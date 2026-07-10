import { describe, expect, it, vi } from 'vitest';
import { createPluginOwnerRef, pluginHostSuccess } from '@prodivix/plugin-host';
import {
  createGatewayNetworkAdapter,
  createStaticGatewayNetworkPolicyResolver,
  type GatewayExecutionContext,
  type GatewayNetworkScopePolicy,
} from '#browser/index';

const policy = (
  overrides: Partial<GatewayNetworkScopePolicy> = {}
): GatewayNetworkScopePolicy => ({
  scope: 'api.example',
  allowedOrigins: ['https://api.example.com'],
  allowedMethods: ['GET', 'POST'],
  allowedPathPrefixes: ['/v1'],
  allowedRequestHeaders: ['accept', 'content-type', 'x-request-id'],
  allowedResponseContentTypes: ['application/json', 'text/plain'],
  maxRequestBytes: 1_024,
  maxResponseBytes: 1_024,
  timeoutMs: 1_000,
  maxRedirects: 2,
  ...overrides,
});

const staticPolicy = (...policies: GatewayNetworkScopePolicy[]) => {
  const result = createStaticGatewayNetworkPolicyResolver(policies);
  if (!result.ok) throw new Error('Expected valid static network policy.');
  return result.value;
};

const context = (
  signal = new AbortController().signal
): GatewayExecutionContext =>
  Object.freeze({
    owner: createPluginOwnerRef('@test/network', 'installation-1', 1),
    pluginVersion: '1.0.0',
    operationId: 'operation-1',
    sessionToken: 'session-1',
    permissionRevision: 1,
    capability: { id: 'network.request' as const, scope: 'api.example' },
    signal,
    assertActive: () => pluginHostSuccess(undefined),
  });

describe('Gateway network adapter', () => {
  it('rejects duplicate static policy scopes at composition time', () => {
    const result = createStaticGatewayNetworkPolicyResolver([
      policy(),
      policy(),
    ]);

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0].code).toBe('PLG-4034');
  });

  it('returns only bounded text and approved response headers', async () => {
    const fetch = vi.fn(
      async () =>
        new Response('{"ok":true}', {
          status: 200,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            etag: 'fixture-etag',
            'x-private-header': 'must-not-cross',
          },
        })
    );
    const adapter = createGatewayNetworkAdapter({
      policy: staticPolicy(policy()),
      fetch,
    });

    const result = await adapter.request(context(), {
      scope: 'api.example',
      url: 'https://api.example.com/v1/items',
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        url: 'https://api.example.com/v1/items',
        status: 200,
        body: '{"ok":true}',
        redirected: false,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          etag: 'fixture-etag',
        },
      },
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/v1/items',
      expect.objectContaining({ credentials: 'omit', redirect: 'manual' })
    );
    expect(result.ok && result.value.headers).not.toHaveProperty(
      'x-private-header'
    );
  });

  it('rejects private targets and forbidden authorization headers before fetch', async () => {
    const fetch = vi.fn();
    const privateAdapter = createGatewayNetworkAdapter({
      policy: {
        resolve: () => policy({ allowedOrigins: ['https://127.0.0.1'] }),
      },
      fetch,
    });
    const headerAdapter = createGatewayNetworkAdapter({
      policy: staticPolicy(policy()),
      fetch,
    });

    const privateResult = await privateAdapter.request(context(), {
      scope: 'api.example',
      url: 'https://127.0.0.1/v1/items',
      method: 'GET',
    });
    const headerResult = await headerAdapter.request(context(), {
      scope: 'api.example',
      url: 'https://api.example.com/v1/items',
      method: 'GET',
      headers: { Authorization: 'Bearer private' },
    });

    expect(privateResult.diagnostics[0].code).toBe('PLG-4038');
    expect(headerResult.diagnostics[0].code).toBe('PLG-4038');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects scope mismatches and encoded path separator escapes', async () => {
    const fetch = vi.fn();
    const mismatched = createGatewayNetworkAdapter({
      policy: {
        resolve: () => policy({ scope: 'different.scope' }),
      },
      fetch,
    });
    const adapter = createGatewayNetworkAdapter({
      policy: staticPolicy(policy()),
      fetch,
    });

    const scopeResult = await mismatched.request(context(), {
      scope: 'api.example',
      url: 'https://api.example.com/v1/items',
      method: 'GET',
    });
    const pathResult = await adapter.request(context(), {
      scope: 'api.example',
      url: 'https://api.example.com/v1%2F..%2Fadmin',
      method: 'GET',
    });

    expect(scopeResult.diagnostics[0].code).toBe('PLG-4038');
    expect(pathResult.diagnostics[0].code).toBe('PLG-4038');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('revalidates every visible redirect and blocks an origin escape', async () => {
    const fetch = vi.fn(
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: 'https://evil.example/v1/exfiltrate' },
        })
    );
    const adapter = createGatewayNetworkAdapter({
      policy: staticPolicy(policy()),
      fetch,
    });

    const result = await adapter.request(context(), {
      scope: 'api.example',
      url: 'https://api.example.com/v1/start',
      method: 'GET',
    });

    expect(result.diagnostics[0].code).toBe('PLG-4038');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('follows a bounded in-policy redirect with deterministic method handling', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 303,
          headers: { location: '/v1/final' },
        })
      )
      .mockResolvedValueOnce(
        new Response('done', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        })
      );
    const adapter = createGatewayNetworkAdapter({
      policy: staticPolicy(policy()),
      fetch,
    });

    const result = await adapter.request(context(), {
      scope: 'api.example',
      url: 'https://api.example.com/v1/start',
      method: 'POST',
      body: 'fixture',
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        url: 'https://api.example.com/v1/final',
        body: 'done',
        redirected: true,
      },
    });
    expect(fetch.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({ method: 'GET' })
    );
    expect(fetch.mock.calls[1]?.[1]).not.toHaveProperty('body');
  });

  it('cancels an oversized response stream at the policy byte limit', async () => {
    const fetch = vi.fn(
      async () =>
        new Response('response-larger-than-limit', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        })
    );
    const adapter = createGatewayNetworkAdapter({
      policy: staticPolicy(policy({ maxResponseBytes: 8 })),
      fetch,
    });

    const result = await adapter.request(context(), {
      scope: 'api.example',
      url: 'https://api.example.com/v1/items',
      method: 'GET',
    });

    expect(result.diagnostics[0].code).toBe('PLG-4038');
  });

  it('aborts fetch when the scope deadline expires', async () => {
    const fetch = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true }
          );
        })
    );
    const adapter = createGatewayNetworkAdapter({
      policy: staticPolicy(policy({ timeoutMs: 10 })),
      fetch,
    });

    const result = await adapter.request(context(), {
      scope: 'api.example',
      url: 'https://api.example.com/v1/items',
      method: 'GET',
    });

    expect(result.diagnostics[0].code).toBe('PLG-4035');
  });
});
