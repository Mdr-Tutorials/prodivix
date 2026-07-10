import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
} from '@prodivix/plugin-contracts';
import {
  pluginHostFailure,
  pluginHostSuccess,
  type PluginHostResult,
} from '@prodivix/plugin-host';
import {
  gatewayNetworkDenied,
  gatewayNetworkHandlerFailed,
  gatewayNetworkPolicyIsBounded,
  normalizeGatewayNetworkOrigins,
  normalizeGatewayNetworkRequestHeaders,
  validateGatewayNetworkTarget,
} from '#browser/gateway/network/gatewayNetworkPolicy';
import {
  readBoundedGatewayNetworkBody,
  selectGatewayNetworkResponseHeaders,
} from '#browser/gateway/network/gatewayNetworkResponse';
import type {
  CreateGatewayNetworkAdapterOptions,
  GatewayNetworkAdapter,
  GatewayNetworkMethod,
  GatewayNetworkPolicyResolver,
  GatewayNetworkScopePolicy,
} from '#browser/gateway/network/gatewayNetwork.types';

const redirectMethod = (
  status: number,
  method: GatewayNetworkMethod
): GatewayNetworkMethod =>
  status === 303 || ((status === 301 || status === 302) && method === 'POST')
    ? 'GET'
    : method;

/**
 * Executes capability-scoped network traffic without exposing Fetch objects,
 * redirects, ambient credentials, streams, or response handles to plugins.
 */
export const createGatewayNetworkAdapter = (
  options: CreateGatewayNetworkAdapterOptions
): GatewayNetworkAdapter => {
  const fetchImplementation = options.fetch ?? globalThis.fetch;
  return Object.freeze({
    request: async (context, request) => {
      const active = context.assertActive();
      if (!active.ok) return active;
      let policy: GatewayNetworkScopePolicy | undefined;
      try {
        policy = options.policy.resolve(request.scope);
      } catch {
        return gatewayNetworkHandlerFailed(
          'Host network policy resolver failed.',
          request
        );
      }
      const origins = policy
        ? normalizeGatewayNetworkOrigins(policy)
        : undefined;
      if (
        !policy ||
        policy.scope !== request.scope ||
        !gatewayNetworkPolicyIsBounded(policy) ||
        !origins ||
        origins.size === 0
      ) {
        return gatewayNetworkDenied(
          'Network scope has no valid Host policy.',
          request
        );
      }
      if (!fetchImplementation) {
        return gatewayNetworkHandlerFailed(
          'Host Fetch implementation is unavailable.',
          request
        );
      }
      const headers = normalizeGatewayNetworkRequestHeaders(request, policy);
      if (!headers.ok) return headers;
      const requestBytes = new TextEncoder().encode(
        request.body ?? ''
      ).byteLength;
      if (requestBytes > policy.maxRequestBytes) {
        return gatewayNetworkDenied(
          'Network request body exceeds its byte limit.',
          request,
          { limit: policy.maxRequestBytes, actual: requestBytes }
        );
      }
      if (request.method === 'GET' && request.body !== undefined) {
        return gatewayNetworkDenied(
          'GET requests cannot include a body.',
          request
        );
      }

      let target: URL;
      try {
        target = new URL(request.url);
      } catch {
        return gatewayNetworkDenied('Network request URL is invalid.', request);
      }
      let method = request.method;
      let body = request.body;
      let redirects = 0;
      const networkController = new AbortController();
      let policyTimedOut = false;
      const onContextAbort = () =>
        networkController.abort(context.signal.reason);
      context.signal.addEventListener('abort', onContextAbort, { once: true });
      if (context.signal.aborted) onContextAbort();
      const policyTimeout = setTimeout(() => {
        policyTimedOut = true;
        networkController.abort('network-policy-timeout');
      }, policy.timeoutMs);

      try {
        while (true) {
          const targetAllowed = validateGatewayNetworkTarget(
            target,
            method,
            policy,
            origins,
            request
          );
          if (!targetAllowed.ok) return targetAllowed;
          const beforeFetch = context.assertActive();
          if (!beforeFetch.ok) return beforeFetch;
          const response = await fetchImplementation(target.href, {
            method,
            headers: headers.value,
            ...(body === undefined ? {} : { body }),
            credentials: 'omit',
            redirect: 'manual',
            referrerPolicy: 'no-referrer',
            signal: networkController.signal,
          });
          if (
            response.type === 'opaque' ||
            response.type === 'opaqueredirect'
          ) {
            return gatewayNetworkDenied(
              'Network redirect location is not visible for policy revalidation.',
              request,
              { networkOrigin: target.origin }
            );
          }
          if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location');
            if (!location || redirects >= policy.maxRedirects) {
              return gatewayNetworkDenied(
                'Network redirect is missing a visible location or exceeds the redirect limit.',
                request,
                { limit: policy.maxRedirects, actual: redirects + 1 }
              );
            }
            try {
              target = new URL(location, target);
            } catch {
              return gatewayNetworkDenied(
                'Network redirect location is invalid.',
                request,
                { networkOrigin: target.origin }
              );
            }
            method = redirectMethod(response.status, method);
            if (method === 'GET') body = undefined;
            redirects += 1;
            continue;
          }

          const contentType =
            response.headers
              .get('content-type')
              ?.split(';')[0]
              ?.trim()
              .toLowerCase() ?? '';
          if (
            contentType &&
            !policy.allowedResponseContentTypes.some((allowed) =>
              allowed.endsWith('/*')
                ? contentType.startsWith(allowed.slice(0, -1))
                : contentType === allowed
            )
          ) {
            return gatewayNetworkDenied(
              'Network response content type is not allowed.',
              request,
              { networkContentType: contentType }
            );
          }
          const bounded = await readBoundedGatewayNetworkBody(
            response,
            policy.maxResponseBytes
          );
          if (!bounded.ok) return bounded;
          if (
            response.status === 0 ||
            (!contentType && bounded.value.bytes.byteLength > 0)
          ) {
            return gatewayNetworkDenied(
              'Network response lacks a visible status or content type.',
              request,
              { networkOrigin: target.origin }
            );
          }
          return pluginHostSuccess(
            Object.freeze({
              url: target.href,
              status: response.status,
              headers: selectGatewayNetworkResponseHeaders(response.headers),
              body: bounded.value.text,
              bodyBytes: bounded.value.bytes.byteLength,
              redirected: redirects > 0,
            })
          );
        }
      } catch {
        return policyTimedOut
          ? pluginHostFailure([
              createPluginDiagnostic(
                PLUGIN_DIAGNOSTIC_CODES.GATEWAY_REQUEST_TIMEOUT,
                'Network request exceeded its scope policy deadline.',
                {
                  capabilityId: 'network.request',
                  capabilityScope: request.scope,
                  limit: policy.timeoutMs,
                }
              ),
            ])
          : context.signal.aborted
            ? pluginHostFailure([
                createPluginDiagnostic(
                  PLUGIN_DIAGNOSTIC_CODES.GATEWAY_REQUEST_ABORTED,
                  'Network request was canceled before a bounded response completed.',
                  {
                    capabilityId: 'network.request',
                    capabilityScope: request.scope,
                  }
                ),
              ])
            : gatewayNetworkHandlerFailed(
                'Host network request failed.',
                request
              );
      } finally {
        clearTimeout(policyTimeout);
        context.signal.removeEventListener('abort', onContextAbort);
      }
    },
  });
};

export const createStaticGatewayNetworkPolicyResolver = (
  policies: readonly GatewayNetworkScopePolicy[]
): PluginHostResult<GatewayNetworkPolicyResolver> => {
  const byScope = new Map<string, GatewayNetworkScopePolicy>();
  for (const policy of policies) {
    const origins = normalizeGatewayNetworkOrigins(policy);
    if (
      !policy.scope ||
      byScope.has(policy.scope) ||
      !gatewayNetworkPolicyIsBounded(policy) ||
      !origins ||
      origins.size === 0
    ) {
      return pluginHostFailure([
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.GATEWAY_HANDLER_UNAVAILABLE,
          'Static Gateway network policy contains an invalid or duplicate scope.',
          { capabilityId: 'network.request', capabilityScope: policy.scope }
        ),
      ]);
    }
    byScope.set(
      policy.scope,
      Object.freeze({
        ...policy,
        allowedOrigins: Object.freeze([...policy.allowedOrigins]),
        allowedMethods: Object.freeze([...policy.allowedMethods]),
        allowedPathPrefixes: Object.freeze([...policy.allowedPathPrefixes]),
        ...(policy.allowedRequestHeaders
          ? {
              allowedRequestHeaders: Object.freeze([
                ...policy.allowedRequestHeaders,
              ]),
            }
          : {}),
        allowedResponseContentTypes: Object.freeze([
          ...policy.allowedResponseContentTypes,
        ]),
      })
    );
  }
  return pluginHostSuccess(
    Object.freeze({ resolve: (scope) => byScope.get(scope) })
  );
};

export type {
  CreateGatewayNetworkAdapterOptions,
  GatewayNetworkAdapter,
  GatewayNetworkMethod,
  GatewayNetworkPolicyResolver,
  GatewayNetworkRequest,
  GatewayNetworkResponse,
  GatewayNetworkScopePolicy,
} from '#browser/gateway/network/gatewayNetwork.types';
