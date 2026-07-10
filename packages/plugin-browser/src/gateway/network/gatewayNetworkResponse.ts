import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
} from '@prodivix/plugin-contracts';
import {
  pluginHostFailure,
  pluginHostSuccess,
  type PluginHostResult,
} from '@prodivix/plugin-host';

const EXPOSED_RESPONSE_HEADERS = new Set([
  'cache-control',
  'content-length',
  'content-type',
  'etag',
  'last-modified',
]);

export const readBoundedGatewayNetworkBody = async (
  response: Response,
  maxBytes: number
): Promise<PluginHostResult<Readonly<{ bytes: Uint8Array; text: string }>>> => {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return pluginHostFailure([
      createPluginDiagnostic(
        PLUGIN_DIAGNOSTIC_CODES.GATEWAY_NETWORK_POLICY_DENIED,
        'Network response declares a body above the Host byte limit.',
        { limit: maxBytes, actual: declaredLength }
      ),
    ]);
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > maxBytes) {
        await reader.cancel('gateway-response-limit');
        return pluginHostFailure([
          createPluginDiagnostic(
            PLUGIN_DIAGNOSTIC_CODES.GATEWAY_NETWORK_POLICY_DENIED,
            'Network response exceeded the Host byte limit.',
            { limit: maxBytes, actual: total }
          ),
        ]);
      }
      chunks.push(next.value);
    }
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return pluginHostSuccess({
      bytes,
      text: new TextDecoder('utf-8', { fatal: true }).decode(bytes),
    });
  } catch {
    return pluginHostFailure([
      createPluginDiagnostic(
        PLUGIN_DIAGNOSTIC_CODES.GATEWAY_NETWORK_POLICY_DENIED,
        'Network response is not valid UTF-8 text.'
      ),
    ]);
  }
};

export const selectGatewayNetworkResponseHeaders = (
  headers: Headers
): Readonly<Record<string, string>> =>
  Object.freeze(
    Object.fromEntries(
      [...headers.entries()].filter(([name]) =>
        EXPOSED_RESPONSE_HEADERS.has(name.toLowerCase())
      )
    )
  );
