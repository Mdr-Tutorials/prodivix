export type BrowserGatewayQuotaPolicy = Readonly<{
  maxRequestBytes: number;
  maxResponseBytes: number;
  requestsPerSecond: number;
  requestBurst: number;
  maxConcurrentRequests: number;
  maxTimeoutMs: number;
}>;

export const DEFAULT_BROWSER_GATEWAY_QUOTA_POLICY: BrowserGatewayQuotaPolicy =
  Object.freeze({
    maxRequestBytes: 256 * 1024,
    maxResponseBytes: 256 * 1024,
    requestsPerSecond: 64,
    requestBurst: 64,
    maxConcurrentRequests: 16,
    maxTimeoutMs: 5_000,
  });

const positiveInteger = (
  value: number | undefined,
  fallback: number
): number =>
  Number.isSafeInteger(value) && (value ?? 0) > 0
    ? (value as number)
    : fallback;

export const normalizeBrowserGatewayQuotaPolicy = (
  input: Partial<BrowserGatewayQuotaPolicy> = {}
): BrowserGatewayQuotaPolicy =>
  Object.freeze({
    maxRequestBytes: positiveInteger(
      input.maxRequestBytes,
      DEFAULT_BROWSER_GATEWAY_QUOTA_POLICY.maxRequestBytes
    ),
    maxResponseBytes: positiveInteger(
      input.maxResponseBytes,
      DEFAULT_BROWSER_GATEWAY_QUOTA_POLICY.maxResponseBytes
    ),
    requestsPerSecond: positiveInteger(
      input.requestsPerSecond,
      DEFAULT_BROWSER_GATEWAY_QUOTA_POLICY.requestsPerSecond
    ),
    requestBurst: positiveInteger(
      input.requestBurst,
      DEFAULT_BROWSER_GATEWAY_QUOTA_POLICY.requestBurst
    ),
    maxConcurrentRequests: positiveInteger(
      input.maxConcurrentRequests,
      DEFAULT_BROWSER_GATEWAY_QUOTA_POLICY.maxConcurrentRequests
    ),
    maxTimeoutMs: positiveInteger(
      input.maxTimeoutMs,
      DEFAULT_BROWSER_GATEWAY_QUOTA_POLICY.maxTimeoutMs
    ),
  });
