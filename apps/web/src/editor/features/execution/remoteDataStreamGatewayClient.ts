import {
  EXECUTION_DATA_STREAM_BRIDGE_LIMITS,
  readExecutionDataStreamBridgeMessage,
  type ExecutionDataStreamBridgeMessage,
  type ExecutionDataStreamInvocation,
} from '@prodivix/runtime-core';
import {
  isRemoteDataGatewaySafeErrorCode,
  RemoteDataGatewayError,
} from './remoteDataGatewayClient';

const maximumStreamBytes = 4 * 1024 * 1024;
const maximumFailureBytes = 64 * 1024;
const maximumStreamRecords = EXECUTION_DATA_STREAM_BRIDGE_LIMITS.maxEvents + 2;

export type RemoteDataStreamFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export type RemoteDataStreamGatewaySession = Readonly<{
  network: Extract<
    ExecutionDataStreamBridgeMessage,
    { phase: 'open' }
  >['network'];
  next(): Promise<
    Extract<ExecutionDataStreamBridgeMessage, { phase: 'event' }> | undefined
  >;
  close(): void;
}>;

export type RemoteDataStreamGatewayClient = Readonly<{
  open(
    executionId: string,
    invocation: ExecutionDataStreamInvocation,
    signal?: AbortSignal
  ): Promise<RemoteDataStreamGatewaySession>;
}>;

const identifier = (value: string, label: string): string => {
  if (
    !value ||
    value !== value.trim() ||
    value.length > 512 ||
    value.includes('\0')
  )
    throw new TypeError(`${label} is invalid.`);
  return value;
};

const byteLength = (value: string): number =>
  new TextEncoder().encode(value).byteLength;

const readFailure = async (
  response: Response
): Promise<Readonly<{ code: string; retryable: boolean }> | undefined> => {
  if (
    !response.headers
      .get('content-type')
      ?.toLowerCase()
      .startsWith('application/json')
  )
    return undefined;
  const declaredLength = response.headers.get('content-length');
  if (
    declaredLength &&
    (!/^\d+$/u.test(declaredLength) ||
      Number(declaredLength) > maximumFailureBytes)
  ) {
    await response.body?.cancel().catch(() => undefined);
    return undefined;
  }
  if (!response.body) return undefined;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const current = await reader.read();
      if (current.done) break;
      total += current.value.byteLength;
      if (total > maximumFailureBytes) {
        await reader.cancel();
        return undefined;
      }
      chunks.push(current.value);
    }
  } catch {
    await reader.cancel().catch(() => undefined);
    return undefined;
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const decoded = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    ) as unknown;
    if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded))
      return undefined;
    const error = (decoded as { error?: unknown }).error;
    if (!error || typeof error !== 'object' || Array.isArray(error))
      return undefined;
    const record = error as { code?: unknown; retryable?: unknown };
    return isRemoteDataGatewaySafeErrorCode(record.code) &&
      typeof record.retryable === 'boolean'
      ? Object.freeze({ code: record.code, retryable: record.retryable })
      : undefined;
  } catch {
    return undefined;
  }
};

const readNdjsonRecords = (
  response: Response
): AsyncGenerator<unknown, void, undefined> => {
  const body = response.body;
  if (!body) throw new RemoteDataGatewayError('DATA_REMOTE_GATEWAY_INVALID');
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let buffered = '';
  let totalBytes = 0;
  let records = 0;
  const parseLine = (line: string): unknown => {
    const normalized = line.endsWith('\r') ? line.slice(0, -1) : line;
    if (
      !normalized ||
      byteLength(normalized) > EXECUTION_DATA_STREAM_BRIDGE_LIMITS.maxEventBytes
    )
      throw new RemoteDataGatewayError('DATA_REMOTE_GATEWAY_INVALID');
    records += 1;
    if (records > maximumStreamRecords)
      throw new RemoteDataGatewayError('DATA_STREAM_CAPACITY');
    try {
      return JSON.parse(normalized) as unknown;
    } catch {
      throw new RemoteDataGatewayError('DATA_REMOTE_GATEWAY_INVALID');
    }
  };
  return (async function* () {
    try {
      while (true) {
        const result = await reader.read();
        if (result.done) break;
        totalBytes += result.value.byteLength;
        if (totalBytes > maximumStreamBytes)
          throw new RemoteDataGatewayError('DATA_STREAM_CAPACITY');
        buffered += decoder.decode(result.value, { stream: true });
        let newline = buffered.indexOf('\n');
        while (newline >= 0) {
          const line = buffered.slice(0, newline);
          buffered = buffered.slice(newline + 1);
          if (line.length) yield parseLine(line);
          newline = buffered.indexOf('\n');
        }
        if (
          byteLength(buffered) >
          EXECUTION_DATA_STREAM_BRIDGE_LIMITS.maxEventBytes
        )
          throw new RemoteDataGatewayError('DATA_REMOTE_GATEWAY_INVALID');
      }
      buffered += decoder.decode();
      if (buffered.length) yield parseLine(buffered);
    } catch (error) {
      await reader.cancel().catch(() => undefined);
      throw error instanceof RemoteDataGatewayError
        ? error
        : new RemoteDataGatewayError('DATA_REMOTE_GATEWAY_INVALID');
    } finally {
      reader.releaseLock();
    }
  })();
};

const retryableStreamCode = (code: string): boolean =>
  code === 'DATA_STREAM_CAPACITY' ||
  code === 'DATA_GRAPHQL_REQUEST_FAILED' ||
  code === 'DATA_ASYNCAPI_REQUEST_FAILED';

/** Opens the Backend NDJSON stream without buffering it or forwarding browser credentials implicitly. */
export const createRemoteDataStreamGatewayClient = (options: {
  baseUrl: string;
  accessToken: string;
  fetcher?: RemoteDataStreamFetch;
}): RemoteDataStreamGatewayClient => {
  const baseUrl = new URL(options.baseUrl);
  const accessToken = options.accessToken.trim();
  const fetcher = options.fetcher ?? globalThis.fetch;
  if (!accessToken)
    throw new TypeError('Remote Data stream gateway requires authentication.');
  if (
    (baseUrl.protocol !== 'http:' && baseUrl.protocol !== 'https:') ||
    baseUrl.username ||
    baseUrl.password ||
    baseUrl.search ||
    baseUrl.hash
  )
    throw new TypeError('Remote Data stream gateway base URL is unsafe.');
  return Object.freeze({
    async open(executionId, invocation, signal) {
      const execution = identifier(executionId, 'Remote execution id');
      const abort = new AbortController();
      const forwardAbort = () => abort.abort();
      signal?.addEventListener('abort', forwardAbort, { once: true });
      if (signal?.aborted) {
        signal.removeEventListener('abort', forwardAbort);
        throw new RemoteDataGatewayError(
          'DATA_REMOTE_GATEWAY_UNAVAILABLE',
          true
        );
      }
      const path = `${baseUrl.pathname.replace(/\/$/u, '')}/remote-executions/${encodeURIComponent(execution)}/data-sources/${encodeURIComponent(invocation.documentId)}/operations/${encodeURIComponent(invocation.operationId)}/stream`;
      let response: Response;
      try {
        response = await fetcher(new URL(path, baseUrl.origin), {
          method: 'POST',
          headers: {
            accept: 'application/x-ndjson',
            authorization: `Bearer ${accessToken}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            invocationId: invocation.invocationId,
            sequence: invocation.sequence,
            attempt: invocation.attempt,
            input: invocation.input,
          }),
          signal: abort.signal,
          credentials: 'omit',
          cache: 'no-store',
          redirect: 'error',
          referrerPolicy: 'no-referrer',
        });
      } catch {
        signal?.removeEventListener('abort', forwardAbort);
        throw new RemoteDataGatewayError(
          'DATA_REMOTE_GATEWAY_UNAVAILABLE',
          true
        );
      }
      if (response.status !== 200) {
        signal?.removeEventListener('abort', forwardAbort);
        const failure = await readFailure(response);
        if (failure)
          throw new RemoteDataGatewayError(failure.code, failure.retryable);
        throw new RemoteDataGatewayError(
          response.status >= 500
            ? 'DATA_REMOTE_GATEWAY_UNAVAILABLE'
            : 'DATA_REMOTE_GATEWAY_DENIED',
          response.status >= 500
        );
      }
      if (
        !response.headers
          .get('content-type')
          ?.toLowerCase()
          .startsWith('application/x-ndjson')
      ) {
        signal?.removeEventListener('abort', forwardAbort);
        await response.body?.cancel().catch(() => undefined);
        throw new RemoteDataGatewayError('DATA_REMOTE_GATEWAY_INVALID');
      }
      const declaredLength = response.headers.get('content-length');
      if (
        declaredLength &&
        (!/^\d+$/u.test(declaredLength) ||
          Number(declaredLength) > maximumStreamBytes)
      ) {
        signal?.removeEventListener('abort', forwardAbort);
        await response.body?.cancel().catch(() => undefined);
        throw new RemoteDataGatewayError('DATA_STREAM_CAPACITY');
      }
      const iterator = readNdjsonRecords(response)[Symbol.asyncIterator]();
      const closeIterator = async (): Promise<void> => {
        try {
          await iterator.return?.();
        } catch {
          // Transport teardown cannot replace the stream boundary result.
        }
      };
      let first: IteratorResult<unknown>;
      try {
        first = await iterator.next();
      } catch (error) {
        signal?.removeEventListener('abort', forwardAbort);
        abort.abort();
        throw error instanceof RemoteDataGatewayError
          ? error
          : new RemoteDataGatewayError('DATA_REMOTE_GATEWAY_INVALID');
      }
      const open = first.done
        ? undefined
        : readExecutionDataStreamBridgeMessage(
            {
              ...(first.value as Record<string, unknown>),
              requestId: invocation.requestId,
            },
            invocation,
            0
          );
      if (!open || open.phase !== 'open') {
        signal?.removeEventListener('abort', forwardAbort);
        abort.abort();
        await closeIterator();
        throw new RemoteDataGatewayError('DATA_REMOTE_GATEWAY_INVALID');
      }
      let cursor = 0;
      let pending = false;
      let terminal = false;
      return Object.freeze({
        network: open.network,
        async next() {
          if (terminal) return undefined;
          if (pending) throw new RemoteDataGatewayError('DATA_STREAM_CONFLICT');
          pending = true;
          try {
            const result = await iterator.next();
            if (result.done) {
              terminal = true;
              abort.abort();
              signal?.removeEventListener('abort', forwardAbort);
              throw new RemoteDataGatewayError('DATA_REMOTE_GATEWAY_INVALID');
            }
            const raw = result.value as Record<string, unknown>;
            const message = readExecutionDataStreamBridgeMessage(
              {
                ...raw,
                requestId: invocation.requestId,
                ...(raw.phase === 'error'
                  ? { retryable: retryableStreamCode(String(raw.code)) }
                  : {}),
              },
              invocation,
              cursor
            );
            if (!message)
              throw new RemoteDataGatewayError('DATA_REMOTE_GATEWAY_INVALID');
            if (message.phase === 'event') {
              cursor = message.cursor;
              return message;
            }
            terminal = true;
            abort.abort();
            signal?.removeEventListener('abort', forwardAbort);
            await closeIterator();
            if (message.phase === 'complete') return undefined;
            if (message.phase === 'error')
              throw new RemoteDataGatewayError(
                isRemoteDataGatewaySafeErrorCode(message.code)
                  ? message.code
                  : 'DATA_REMOTE_GATEWAY_INVALID',
                message.retryable
              );
            throw new RemoteDataGatewayError('DATA_REMOTE_GATEWAY_INVALID');
          } catch (error) {
            if (!terminal) {
              terminal = true;
              abort.abort();
              signal?.removeEventListener('abort', forwardAbort);
              await closeIterator();
            }
            throw error instanceof RemoteDataGatewayError
              ? error
              : new RemoteDataGatewayError('DATA_REMOTE_GATEWAY_INVALID');
          } finally {
            pending = false;
          }
        },
        close() {
          if (terminal) return;
          terminal = true;
          abort.abort();
          signal?.removeEventListener('abort', forwardAbort);
          void closeIterator();
        },
      });
    },
  });
};
