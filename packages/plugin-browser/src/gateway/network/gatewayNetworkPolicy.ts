import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
} from '@prodivix/plugin-contracts';
import {
  pluginHostFailure,
  pluginHostSuccess,
  type PluginHostResult,
} from '@prodivix/plugin-host';
import type {
  GatewayNetworkMethod,
  GatewayNetworkRequest,
  GatewayNetworkScopePolicy,
} from '#browser/gateway/network/gatewayNetwork.types';

const FORBIDDEN_REQUEST_HEADERS = new Set([
  'authorization',
  'connection',
  'cookie',
  'host',
  'keep-alive',
  'origin',
  'proxy-authenticate',
  'proxy-authorization',
  'referer',
  'set-cookie',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

export const gatewayNetworkDenied = (
  message: string,
  request: GatewayNetworkRequest,
  extra: Record<string, string | number | boolean> = {}
): PluginHostResult<never> =>
  pluginHostFailure([
    createPluginDiagnostic(
      PLUGIN_DIAGNOSTIC_CODES.GATEWAY_NETWORK_POLICY_DENIED,
      message,
      {
        capabilityId: 'network.request',
        capabilityScope: request.scope,
        networkMethod: request.method,
        ...extra,
      }
    ),
  ]);

export const gatewayNetworkHandlerFailed = (
  message: string,
  request: GatewayNetworkRequest
): PluginHostResult<never> =>
  pluginHostFailure([
    createPluginDiagnostic(
      PLUGIN_DIAGNOSTIC_CODES.GATEWAY_HANDLER_FAILED,
      message,
      {
        capabilityId: 'network.request',
        capabilityScope: request.scope,
        networkMethod: request.method,
      }
    ),
  ]);

const parseIpv4 = (hostname: string): readonly number[] | undefined => {
  const parts = hostname.split('.');
  if (parts.length !== 4) return undefined;
  const numbers = parts.map(Number);
  return numbers.every(
    (part, index) =>
      /^\d{1,3}$/.test(parts[index] ?? '') &&
      Number.isInteger(part) &&
      part >= 0 &&
      part <= 255
  )
    ? numbers
    : undefined;
};

const isNonPublicIpv4 = (parts: readonly number[]): boolean => {
  const [first = 0, second = 0, third = 0] = parts;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0 && third === 0) ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113) ||
    first >= 224
  );
};

const isNonPublicHostname = (input: string): boolean => {
  const hostname = input.replace(/^\[|\]$/g, '').toLowerCase();
  const ipv4 = parseIpv4(hostname);
  if (ipv4) return isNonPublicIpv4(ipv4);
  if (hostname.includes(':')) {
    if (/^::ffff:/i.test(hostname)) return true;
    return (
      hostname === '::' ||
      hostname === '::1' ||
      /^f[cd]/.test(hostname) ||
      /^fe[89ab]/.test(hostname) ||
      /^ff/.test(hostname) ||
      /^2001:db8/.test(hostname)
    );
  }
  return (
    hostname === 'localhost' ||
    !hostname.includes('.') ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan')
  );
};

const pathAllowed = (pathname: string, prefixes: readonly string[]): boolean =>
  prefixes.some((prefix) =>
    prefix === '/'
      ? true
      : prefix.endsWith('/')
        ? pathname.startsWith(prefix)
        : pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

export const normalizeGatewayNetworkOrigins = (
  policy: GatewayNetworkScopePolicy
): ReadonlySet<string> | undefined => {
  const origins = new Set<string>();
  for (const source of policy.allowedOrigins) {
    try {
      const url = new URL(source);
      if (
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        url.href !== `${url.origin}/` ||
        isNonPublicHostname(url.hostname)
      ) {
        return undefined;
      }
      origins.add(url.origin);
    } catch {
      return undefined;
    }
  }
  return origins;
};

export const gatewayNetworkPolicyIsBounded = (
  policy: GatewayNetworkScopePolicy
): boolean =>
  policy.allowedMethods.length > 0 &&
  policy.allowedPathPrefixes.length > 0 &&
  policy.allowedPathPrefixes.every((prefix) => prefix.startsWith('/')) &&
  policy.allowedResponseContentTypes.length > 0 &&
  Number.isSafeInteger(policy.maxRequestBytes) &&
  policy.maxRequestBytes > 0 &&
  Number.isSafeInteger(policy.maxResponseBytes) &&
  policy.maxResponseBytes > 0 &&
  Number.isSafeInteger(policy.timeoutMs) &&
  policy.timeoutMs > 0 &&
  Number.isSafeInteger(policy.maxRedirects) &&
  policy.maxRedirects >= 0;

export const validateGatewayNetworkTarget = (
  target: URL,
  method: GatewayNetworkMethod,
  policy: GatewayNetworkScopePolicy,
  origins: ReadonlySet<string>,
  request: GatewayNetworkRequest
): PluginHostResult<void> => {
  let decodedPathname: string;
  try {
    if (/%2f|%5c/i.test(target.pathname)) {
      return gatewayNetworkDenied(
        'Network target contains an encoded path separator.',
        request,
        { networkOrigin: target.origin }
      );
    }
    decodedPathname = decodeURIComponent(target.pathname);
  } catch {
    return gatewayNetworkDenied(
      'Network target path is not valid UTF-8.',
      request,
      { networkOrigin: target.origin }
    );
  }
  if (
    target.protocol !== 'https:' ||
    target.username ||
    target.password ||
    isNonPublicHostname(target.hostname) ||
    !origins.has(target.origin) ||
    !policy.allowedMethods.includes(method) ||
    decodedPathname.includes('\\') ||
    !pathAllowed(decodedPathname, policy.allowedPathPrefixes)
  ) {
    return gatewayNetworkDenied(
      'Network target is outside the bound HTTPS origin, method, or path policy.',
      request,
      { networkOrigin: target.origin }
    );
  }
  return pluginHostSuccess(undefined);
};

export const normalizeGatewayNetworkRequestHeaders = (
  request: GatewayNetworkRequest,
  policy: GatewayNetworkScopePolicy
): PluginHostResult<Headers> => {
  const allowed = new Set(
    (policy.allowedRequestHeaders ?? ['accept', 'content-type']).map((header) =>
      header.toLowerCase()
    )
  );
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers ?? {})) {
    const normalized = name.toLowerCase();
    if (
      !/^[a-z0-9!#$%&'*+.^_`|~-]+$/.test(normalized) ||
      FORBIDDEN_REQUEST_HEADERS.has(normalized) ||
      normalized.startsWith('proxy-') ||
      normalized.startsWith('sec-') ||
      !allowed.has(normalized)
    ) {
      return gatewayNetworkDenied(
        'Network request contains a forbidden or unapproved header.',
        request,
        { networkHeader: normalized }
      );
    }
    try {
      headers.set(normalized, value);
    } catch {
      return gatewayNetworkDenied(
        'Network request header value is invalid.',
        request,
        { networkHeader: normalized }
      );
    }
  }
  return pluginHostSuccess(headers);
};
