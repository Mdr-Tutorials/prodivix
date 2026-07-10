export type BrowserPluginQuotaPolicy = Readonly<{
  maxMessageBytes: number;
  messagesPerSecond: number;
  messageBurst: number;
  maxPendingRequests: number;
  gatewayTimeoutMs: number;
  lifecycleTimeoutMs: number;
  handshakeTimeoutMs: number;
  heartbeatIntervalMs: number;
  heartbeatMissLimit: number;
}>;

export const DEFAULT_BROWSER_PLUGIN_QUOTA_POLICY: BrowserPluginQuotaPolicy =
  Object.freeze({
    maxMessageBytes: 256 * 1024,
    messagesPerSecond: 64,
    messageBurst: 96,
    maxPendingRequests: 16,
    gatewayTimeoutMs: 5_000,
    lifecycleTimeoutMs: 10_000,
    handshakeTimeoutMs: 5_000,
    heartbeatIntervalMs: 2_000,
    heartbeatMissLimit: 3,
  });

const positiveInteger = (
  value: number | undefined,
  fallback: number
): number =>
  Number.isSafeInteger(value) && (value ?? 0) > 0
    ? (value as number)
    : fallback;

export const normalizeBrowserPluginQuotaPolicy = (
  input: Partial<BrowserPluginQuotaPolicy> = {}
): BrowserPluginQuotaPolicy =>
  Object.freeze({
    maxMessageBytes: positiveInteger(
      input.maxMessageBytes,
      DEFAULT_BROWSER_PLUGIN_QUOTA_POLICY.maxMessageBytes
    ),
    messagesPerSecond: positiveInteger(
      input.messagesPerSecond,
      DEFAULT_BROWSER_PLUGIN_QUOTA_POLICY.messagesPerSecond
    ),
    messageBurst: positiveInteger(
      input.messageBurst,
      DEFAULT_BROWSER_PLUGIN_QUOTA_POLICY.messageBurst
    ),
    maxPendingRequests: positiveInteger(
      input.maxPendingRequests,
      DEFAULT_BROWSER_PLUGIN_QUOTA_POLICY.maxPendingRequests
    ),
    gatewayTimeoutMs: positiveInteger(
      input.gatewayTimeoutMs,
      DEFAULT_BROWSER_PLUGIN_QUOTA_POLICY.gatewayTimeoutMs
    ),
    lifecycleTimeoutMs: positiveInteger(
      input.lifecycleTimeoutMs,
      DEFAULT_BROWSER_PLUGIN_QUOTA_POLICY.lifecycleTimeoutMs
    ),
    handshakeTimeoutMs: positiveInteger(
      input.handshakeTimeoutMs,
      DEFAULT_BROWSER_PLUGIN_QUOTA_POLICY.handshakeTimeoutMs
    ),
    heartbeatIntervalMs: positiveInteger(
      input.heartbeatIntervalMs,
      DEFAULT_BROWSER_PLUGIN_QUOTA_POLICY.heartbeatIntervalMs
    ),
    heartbeatMissLimit: positiveInteger(
      input.heartbeatMissLimit,
      DEFAULT_BROWSER_PLUGIN_QUOTA_POLICY.heartbeatMissLimit
    ),
  });

export type TokenBucket = Readonly<{
  consume(tokens?: number): boolean;
}>;

export const createTokenBucket = (
  ratePerSecond: number,
  burst: number,
  now: () => number = () => performance.now()
): TokenBucket => {
  const rate = positiveInteger(ratePerSecond, 1);
  const capacity = Math.max(positiveInteger(burst, rate), rate);
  let available = capacity;
  let lastRefill = now();

  return Object.freeze({
    consume: (tokens = 1) => {
      const current = now();
      const elapsedSeconds = Math.max(0, current - lastRefill) / 1_000;
      available = Math.min(capacity, available + elapsedSeconds * rate);
      lastRefill = current;
      if (tokens <= 0 || available < tokens) return false;
      available -= tokens;
      return true;
    },
  });
};
