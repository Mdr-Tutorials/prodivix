import type { IncomingMessage, ServerResponse } from 'node:http';
import type {
  RemoteExecutionControlPlane,
  RemoteExecutionPrincipal,
  RemoteExecutionRequestEnvelope,
} from '@prodivix/runtime-remote';
import {
  decodeRemoteExecutionJobEvent,
  type RemoteExecutionWorkerEvent,
} from '@prodivix/runtime-remote';

export type RemoteExecutionHttpAuthenticator = Readonly<{
  authenticateClient(
    token: string
  ): Promise<RemoteExecutionPrincipal | undefined>;
  authenticateWorker(token: string, workerId: string): Promise<boolean>;
}>;

export type CreateRemoteExecutionHttpHandlerOptions = Readonly<{
  controlPlane: RemoteExecutionControlPlane;
  authenticator: RemoteExecutionHttpAuthenticator;
  resolveClaimedSnapshot(
    input: Readonly<{
      executionId: string;
      workerId: string;
      leaseToken: string;
    }>
  ): Promise<unknown | undefined>;
  isCancellationRequested(
    input: Readonly<{
      executionId: string;
      workerId: string;
      leaseToken: string;
    }>
  ): Promise<boolean | undefined>;
  publicBodyLimitBytes?: number;
  internalBodyLimitBytes?: number;
}>;

const statuses = new Set([
  'starting',
  'running',
  'cancelling',
  'succeeded',
  'failed',
  'cancelled',
  'timed-out',
]);
const artifactKinds = new Set([
  'file',
  'bundle',
  'report',
  'coverage',
  'screenshot',
  'trace',
  'custom',
]);

const json = (
  response: ServerResponse,
  status: number,
  value: unknown
): void => {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  response.end(body);
};

const error = (response: ServerResponse, status: number, code: string): void =>
  json(response, status, { error: { code } });

const bearer = (request: IncomingMessage): string | undefined => {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return undefined;
  const token = header.slice(7);
  return token.length > 0 && token.length <= 8_192 ? token : undefined;
};

const readJson = async (
  request: IncomingMessage,
  maximumBytes: number
): Promise<unknown> => {
  const body = await readBytes(request, maximumBytes);
  try {
    return JSON.parse(Buffer.from(body).toString('utf8')) as unknown;
  } catch {
    throw Object.assign(new Error('invalid json'), { status: 400 });
  }
};

const readBytes = async (
  request: IncomingMessage,
  maximumBytes: number
): Promise<Uint8Array> => {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunkValue of request) {
    const chunk = Buffer.isBuffer(chunkValue)
      ? chunkValue
      : Buffer.from(chunkValue as Uint8Array);
    size += chunk.length;
    if (size > maximumBytes) {
      request.resume();
      throw Object.assign(new Error('request body too large'), { status: 413 });
    }
    chunks.push(chunk);
  }
  if (!chunks.length)
    throw Object.assign(new Error('body required'), { status: 400 });
  return new Uint8Array(Buffer.concat(chunks));
};

const header = (request: IncomingMessage, name: string): string => {
  const value = request.headers[name];
  if (typeof value !== 'string') throw new TypeError(`${name} is required`);
  return text(value);
};

const record = (
  value: unknown,
  allowed: readonly string[],
  required: readonly string[]
) => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TypeError('request body must be an object');
  const result = value as Record<string, unknown>;
  const unknown = Object.keys(result).find((key) => !allowed.includes(key));
  if (unknown || required.some((key) => result[key] === undefined))
    throw new TypeError('request body shape is invalid');
  return result;
};

const text = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim() || value.length > 4_096)
    throw new TypeError('identifier is invalid');
  return value.trim();
};

const positiveInteger = (value: unknown): number => {
  if (!Number.isSafeInteger(value) || (value as number) < 1)
    throw new TypeError('positive integer required');
  return value as number;
};

const workerAuth = async (
  request: IncomingMessage,
  response: ServerResponse,
  authenticator: RemoteExecutionHttpAuthenticator,
  workerId: string
): Promise<boolean> => {
  const token = bearer(request);
  if (!token) {
    error(response, 401, 'unauthorized');
    return false;
  }
  if (!(await authenticator.authenticateWorker(token, workerId))) {
    error(response, 403, 'forbidden');
    return false;
  }
  return true;
};

/** Creates the deployable E3C HTTP boundary; it never logs or reflects credentials or internal failures. */
export const createRemoteExecutionHttpHandler = (
  options: CreateRemoteExecutionHttpHandlerOptions
) => {
  const publicLimit = options.publicBodyLimitBytes ?? 64 * 1024 * 1024;
  const internalLimit = options.internalBodyLimitBytes ?? 64 * 1024;
  return async (
    request: IncomingMessage,
    response: ServerResponse
  ): Promise<void> => {
    try {
      const url = new URL(request.url ?? '/', 'http://control-plane.invalid');
      if (request.method === 'GET' && url.pathname === '/healthz') {
        json(response, 200, { status: 'ok' });
        return;
      }
      const artifactDownloadMatch =
        /^\/v1\/executions\/([^/]+)\/artifacts\/([^/]+)\/content$/u.exec(
          url.pathname
        );
      if (request.method === 'GET' && artifactDownloadMatch) {
        const token = bearer(request);
        if (!token) return error(response, 401, 'unauthorized');
        const principal = await options.authenticator.authenticateClient(token);
        if (!principal) return error(response, 403, 'forbidden');
        const artifact = await options.controlPlane.getArtifact({
          principal,
          executionId: decodeURIComponent(artifactDownloadMatch[1]!),
          artifactId: decodeURIComponent(artifactDownloadMatch[2]!),
        });
        if (!artifact) return error(response, 404, 'not-found');
        response.writeHead(200, {
          'content-type': artifact.descriptor.mediaType,
          'content-length': artifact.contents.byteLength,
          'cache-control': 'private, no-store',
          'x-content-type-options': 'nosniff',
          etag: `"${artifact.descriptor.digest}"`,
        });
        response.end(Buffer.from(artifact.contents));
        return;
      }
      if (request.method !== 'POST') {
        error(response, 404, 'not-found');
        return;
      }
      if (url.pathname === '/v1/executions') {
        const token = bearer(request);
        if (!token) return error(response, 401, 'unauthorized');
        const principal = await options.authenticator.authenticateClient(token);
        if (!principal) return error(response, 403, 'forbidden');
        const envelope = (await readJson(
          request,
          publicLimit
        )) as RemoteExecutionRequestEnvelope;
        const result = await options.controlPlane.handle(envelope, {
          principal,
        });
        json(response, 200, result);
        return;
      }
      if (url.pathname === '/internal/v1/claims') {
        const body = record(
          await readJson(request, internalLimit),
          ['workerId', 'providerId', 'leaseDurationMs'],
          ['workerId', 'providerId', 'leaseDurationMs']
        );
        const workerId = text(body.workerId);
        if (
          !(await workerAuth(
            request,
            response,
            options.authenticator,
            workerId
          ))
        )
          return;
        const claim = await options.controlPlane.claimNext({
          workerId,
          providerId: text(body.providerId),
          leaseDurationMs: positiveInteger(body.leaseDurationMs),
        });
        json(response, 200, { claim: claim ?? null });
        return;
      }
      const leaseMatch = /^\/internal\/v1\/executions\/([^/]+)\/lease$/u.exec(
        url.pathname
      );
      if (leaseMatch) {
        const body = record(
          await readJson(request, internalLimit),
          ['workerId', 'leaseToken', 'leaseDurationMs'],
          ['workerId', 'leaseToken', 'leaseDurationMs']
        );
        const workerId = text(body.workerId);
        if (
          !(await workerAuth(
            request,
            response,
            options.authenticator,
            workerId
          ))
        )
          return;
        const lease = await options.controlPlane.renewLease({
          executionId: decodeURIComponent(leaseMatch[1]!),
          workerId,
          leaseToken: text(body.leaseToken),
          leaseDurationMs: positiveInteger(body.leaseDurationMs),
        });
        if (!lease) return error(response, 409, 'lease-rejected');
        const cancellationRequested = await options.isCancellationRequested({
          executionId: decodeURIComponent(leaseMatch[1]!),
          workerId,
          leaseToken: text(body.leaseToken),
        });
        if (cancellationRequested === undefined)
          return error(response, 409, 'lease-rejected');
        json(response, 200, { lease, cancellationRequested });
        return;
      }
      const transitionMatch =
        /^\/internal\/v1\/executions\/([^/]+)\/transition$/u.exec(url.pathname);
      if (transitionMatch) {
        const body = record(
          await readJson(request, internalLimit),
          ['workerId', 'leaseToken', 'status', 'reason'],
          ['workerId', 'leaseToken', 'status']
        );
        const workerId = text(body.workerId);
        if (
          !(await workerAuth(
            request,
            response,
            options.authenticator,
            workerId
          ))
        )
          return;
        const status = text(body.status);
        if (!statuses.has(status)) throw new TypeError('status is invalid');
        const execution = await options.controlPlane.transition({
          executionId: decodeURIComponent(transitionMatch[1]!),
          workerId,
          leaseToken: text(body.leaseToken),
          status: status as Parameters<
            RemoteExecutionControlPlane['transition']
          >[0]['status'],
          ...(body.reason === undefined ? {} : { reason: text(body.reason) }),
        });
        if (!execution) return error(response, 409, 'lease-rejected');
        json(response, 200, { execution: execution.record });
        return;
      }
      const snapshotMatch =
        /^\/internal\/v1\/executions\/([^/]+)\/snapshot$/u.exec(url.pathname);
      if (snapshotMatch) {
        const body = record(
          await readJson(request, internalLimit),
          ['workerId', 'leaseToken'],
          ['workerId', 'leaseToken']
        );
        const workerId = text(body.workerId);
        if (
          !(await workerAuth(
            request,
            response,
            options.authenticator,
            workerId
          ))
        )
          return;
        const snapshot = await options.resolveClaimedSnapshot({
          executionId: decodeURIComponent(snapshotMatch[1]!),
          workerId,
          leaseToken: text(body.leaseToken),
        });
        if (!snapshot) return error(response, 409, 'lease-rejected');
        json(response, 200, { snapshot });
        return;
      }
      const eventsMatch = /^\/internal\/v1\/executions\/([^/]+)\/events$/u.exec(
        url.pathname
      );
      if (eventsMatch) {
        const body = record(
          await readJson(request, internalLimit),
          ['workerId', 'leaseToken', 'workerEventId', 'event'],
          ['workerId', 'leaseToken', 'workerEventId', 'event']
        );
        const workerId = text(body.workerId);
        if (
          !(await workerAuth(
            request,
            response,
            options.authenticator,
            workerId
          ))
        )
          return;
        const executionId = decodeURIComponent(eventsMatch[1]!);
        const rawEvent = record(
          body.event,
          ['kind', 'log', 'diagnostic', 'trace'],
          ['kind']
        );
        const kind = text(rawEvent.kind);
        if (!['log', 'diagnostic', 'trace'].includes(kind))
          throw new TypeError('worker event kind is invalid');
        const decoded = decodeRemoteExecutionJobEvent({
          jobId: executionId,
          sequence: 1,
          emittedAt: 0,
          ...rawEvent,
        });
        if (decoded.kind === 'state' || decoded.kind === 'artifact')
          throw new TypeError('worker event kind is invalid');
        const event: RemoteExecutionWorkerEvent =
          decoded.kind === 'log'
            ? { kind: decoded.kind, log: decoded.log }
            : decoded.kind === 'diagnostic'
              ? { kind: decoded.kind, diagnostic: decoded.diagnostic }
              : { kind: decoded.kind, trace: decoded.trace };
        const result = await options.controlPlane.appendWorkerEvent({
          executionId,
          workerId,
          leaseToken: text(body.leaseToken),
          workerEventId: text(body.workerEventId),
          event,
        });
        if (result.kind === 'lease-rejected')
          return error(response, 409, 'lease-rejected');
        if (result.kind === 'identity-conflict')
          return error(response, 409, 'identity-conflict');
        if (result.kind === 'budget-exceeded')
          return error(response, 413, 'budget-exceeded');
        json(response, 200, {
          kind: result.kind,
          latestCursor: result.execution.record.latestCursor,
        });
        return;
      }
      const artifactUploadMatch =
        /^\/internal\/v1\/executions\/([^/]+)\/artifacts\/([^/]+)$/u.exec(
          url.pathname
        );
      if (artifactUploadMatch) {
        const workerId = header(request, 'x-prodivix-worker-id');
        if (
          !(await workerAuth(
            request,
            response,
            options.authenticator,
            workerId
          ))
        )
          return;
        const executionId = decodeURIComponent(artifactUploadMatch[1]!);
        const artifactId = decodeURIComponent(artifactUploadMatch[2]!);
        const size = Number(header(request, 'x-prodivix-artifact-size'));
        const expiresAt = Number(
          header(request, 'x-prodivix-artifact-expires-at')
        );
        if (
          !Number.isSafeInteger(size) ||
          size < 0 ||
          !Number.isSafeInteger(expiresAt) ||
          expiresAt < 0
        )
          throw new TypeError('artifact size or expiry is invalid');
        const contents = await readBytes(request, publicLimit);
        const artifactKind = header(request, 'x-prodivix-artifact-kind');
        if (!artifactKinds.has(artifactKind))
          throw new TypeError('artifact kind is invalid');
        const result = await options.controlPlane.putArtifact({
          executionId,
          workerId,
          leaseToken: header(request, 'x-prodivix-lease-token'),
          workerEventId: header(request, 'x-prodivix-worker-event-id'),
          descriptor: {
            artifactId,
            kind: artifactKind as 'file',
            mediaType: header(request, 'content-type'),
            size,
            digest: header(request, 'x-prodivix-artifact-digest'),
            expiresAt,
            authorizationScope: `execution:${executionId}`,
          },
          contents,
        });
        if (result.kind === 'lease-rejected')
          return error(response, 409, 'lease-rejected');
        if (result.kind === 'identity-conflict')
          return error(response, 409, 'identity-conflict');
        if (result.kind === 'budget-exceeded')
          return error(response, 413, 'budget-exceeded');
        json(response, result.kind === 'stored' ? 201 : 200, {
          artifact: result.execution.artifacts.find(
            (candidate) => candidate.artifactId === artifactId
          ),
        });
        return;
      }
      error(response, 404, 'not-found');
    } catch (caught) {
      const status =
        typeof caught === 'object' && caught && 'status' in caught
          ? Number(caught.status)
          : caught instanceof TypeError
            ? 400
            : 500;
      error(
        response,
        status,
        status === 413
          ? 'body-too-large'
          : status === 400
            ? 'invalid-request'
            : 'internal'
      );
    }
  };
};
