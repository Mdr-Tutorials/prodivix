import {
  createExecutionNetworkTrace,
  type ExecutionNetworkCorrelation,
  type ExecutionNetworkTrace,
  type ExecutionSourceTrace,
  type RuntimeZone,
} from '@prodivix/runtime-core';

const maximumResponseBytes = 4 * 1024 * 1024;
const sensitiveHeaderNames = new Set([
  'authorization',
  'cookie',
  'proxy-authorization',
  'x-api-key',
]);

export type BrowserNetworkRequest = Readonly<{
  requestId: string;
  url: string;
  method: string;
  headers?: Readonly<Record<string, string>>;
  body?: string;
  signal?: AbortSignal;
  runtimeZone: RuntimeZone;
  mode: 'mock' | 'live';
  adapter: string;
  correlation?: ExecutionNetworkCorrelation;
  sourceTrace?: readonly ExecutionSourceTrace[];
}>;

export type BrowserNetworkResponse = Readonly<{
  status: number;
  ok: boolean;
  text: string;
  trace: ExecutionNetworkTrace;
}>;

export type BrowserNetworkAdapter = Readonly<{
  execute(request: BrowserNetworkRequest): Promise<BrowserNetworkResponse>;
}>;

export type CreateBrowserNetworkAdapterOptions = Readonly<{
  fetch?: typeof globalThis.fetch;
  now?: () => number;
  maximumResponseBytes?: number;
  allowPrivateNetwork?: boolean;
  publishTrace?(trace: ExecutionNetworkTrace): void;
}>;

export class BrowserNetworkRequestError extends Error {
  readonly trace: ExecutionNetworkTrace;

  constructor(message: string, trace: ExecutionNetworkTrace) {
    super(message);
    this.name = 'BrowserNetworkRequestError';
    this.trace = trace;
  }
}

const privateHostname = (hostname: string): boolean => {
  const normalized = hostname
    .toLowerCase()
    .replace(/^\[|\]$/gu, '')
    .replace(/\.$/u, '');
  const ipv6Literal = normalized.includes(':');
  if (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    normalized === '::' ||
    normalized === '::1' ||
    (ipv6Literal &&
      (normalized.startsWith('::ffff:') ||
        normalized.startsWith('fc') ||
        normalized.startsWith('fd') ||
        /^fe[89ab]/u.test(normalized)))
  )
    return true;
  const octets = normalized.split('.');
  if (
    octets.length !== 4 ||
    octets.some((octet) => !/^\d{1,3}$/u.test(octet) || Number(octet) > 255)
  )
    return false;
  const [first, second] = octets.map(Number);
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    first >= 224
  );
};

const requestUrl = (value: string, allowPrivateNetwork: boolean): URL => {
  const url = new URL(value);
  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.username ||
    url.password ||
    (!allowPrivateNetwork && privateHostname(url.hostname))
  )
    throw new TypeError('Browser Network URL is not safe.');
  return url;
};

const requestHeaders = (
  source: Readonly<Record<string, string>> | undefined
): Headers => {
  const headers = new Headers();
  for (const [name, value] of Object.entries(source ?? {})) {
    const normalizedName = name.trim().toLowerCase();
    if (
      !normalizedName ||
      sensitiveHeaderNames.has(normalizedName) ||
      value.includes('\0') ||
      value.length > 8_192
    )
      throw new TypeError(`Browser Network header is forbidden: ${name}.`);
    headers.set(normalizedName, value);
  }
  return headers;
};

const concatenateResponseChunks = (
  chunks: readonly Uint8Array[],
  byteLength: number
): Uint8Array => {
  const contents = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    contents.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return contents;
};

const readBoundedResponse = async (
  response: Response,
  maximumBytes: number
): Promise<
  Readonly<{
    contents: Uint8Array;
    responseBytes: number;
    truncated: boolean;
  }>
> => {
  if (!response.body) {
    const contents = new Uint8Array(await response.arrayBuffer());
    return Object.freeze({
      contents:
        contents.byteLength > maximumBytes
          ? contents.slice(0, maximumBytes)
          : contents,
      responseBytes: contents.byteLength,
      truncated: contents.byteLength > maximumBytes,
    });
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let retainedBytes = 0;
  let responseBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    responseBytes += value.byteLength;
    const remaining = maximumBytes - retainedBytes;
    if (remaining > 0) {
      const accepted =
        value.byteLength > remaining ? value.slice(0, remaining) : value;
      chunks.push(accepted);
      retainedBytes += accepted.byteLength;
    }
    if (responseBytes > maximumBytes) {
      try {
        await reader.cancel();
      } catch {
        // The response is already rejected; cancellation is best effort.
      }
      return Object.freeze({
        contents: concatenateResponseChunks(chunks, retainedBytes),
        responseBytes,
        truncated: true,
      });
    }
  }
  return Object.freeze({
    contents: concatenateResponseChunks(chunks, retainedBytes),
    responseBytes,
    truncated: false,
  });
};

/** Performs client-safe fetch while publishing metadata-only traces with origin-level URLs. */
export const createBrowserNetworkAdapter = (
  options: CreateBrowserNetworkAdapterOptions = {}
): BrowserNetworkAdapter => {
  const fetchImplementation = options.fetch ?? globalThis.fetch;
  if (!fetchImplementation)
    throw new Error('Browser Network fetch implementation is unavailable.');
  const now = options.now ?? Date.now;
  const responseLimit = options.maximumResponseBytes ?? maximumResponseBytes;
  if (!Number.isSafeInteger(responseLimit) || responseLimit < 1)
    throw new TypeError('Browser Network response limit must be positive.');

  return Object.freeze({
    async execute(request): Promise<BrowserNetworkResponse> {
      const url = requestUrl(request.url, options.allowPrivateNetwork === true);
      if (request.runtimeZone !== 'client')
        throw new TypeError(
          'Browser Network adapter only supports client runtime.'
        );
      if (request.mode !== 'live')
        throw new TypeError(
          'Browser Network adapter cannot execute mock traffic.'
        );
      const method = request.method.trim().toUpperCase();
      if (!/^[A-Z]+$/u.test(method))
        throw new TypeError('Browser Network method is invalid.');
      const startedAt = now();
      const trace = (
        completedAt: number,
        outcome: 'allowed' | 'failed',
        input: Readonly<{
          status?: number;
          requestBytes?: number;
          responseBytes?: number;
          truncated?: boolean;
        }> = {}
      ) =>
        createExecutionNetworkTrace({
          requestId: request.requestId,
          phase: 'runtime',
          runtimeZone: request.runtimeZone,
          mode: request.mode,
          adapter: request.adapter,
          method,
          sanitizedUrl: `${url.origin}/`,
          protocol: url.protocol === 'https:' ? 'https' : 'http',
          startedAt,
          completedAt,
          outcome,
          ...input,
          ...(request.correlation ? { correlation: request.correlation } : {}),
          ...(request.sourceTrace ? { sourceTrace: request.sourceTrace } : {}),
        });
      const publishTrace = (value: ReturnType<typeof trace>): void => {
        try {
          options.publishTrace?.(value);
        } catch {
          // Trace observers cannot alter the network request outcome.
        }
      };
      const requestBytes = request.body
        ? new TextEncoder().encode(request.body).byteLength
        : 0;
      try {
        const response = await fetchImplementation(url, {
          method,
          headers: requestHeaders(request.headers),
          ...(request.body === undefined ? {} : { body: request.body }),
          ...(request.signal ? { signal: request.signal } : {}),
          credentials: 'omit',
          redirect: 'error',
          referrerPolicy: 'no-referrer',
          cache: 'no-store',
        });
        const { contents, responseBytes, truncated } =
          await readBoundedResponse(response, responseLimit);
        const completedTrace = trace(now(), 'allowed', {
          status: response.status,
          requestBytes,
          responseBytes,
          ...(truncated ? { truncated: true } : {}),
        });
        publishTrace(completedTrace);
        if (truncated)
          throw new BrowserNetworkRequestError(
            'Browser Network response exceeded its configured limit.',
            completedTrace
          );
        const text = new TextDecoder('utf-8', { fatal: true }).decode(contents);
        return Object.freeze({
          status: response.status,
          ok: response.ok,
          text,
          trace: completedTrace,
        });
      } catch (error) {
        if (error instanceof BrowserNetworkRequestError) throw error;
        const failedTrace = trace(now(), 'failed', { requestBytes });
        publishTrace(failedTrace);
        throw new BrowserNetworkRequestError(
          error instanceof Error
            ? error.message
            : 'Browser Network request failed.',
          failedTrace
        );
      }
    },
  });
};
