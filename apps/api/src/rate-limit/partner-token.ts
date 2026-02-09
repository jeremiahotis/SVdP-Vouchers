import { PARTNER_TOKEN_RATE_LIMIT } from "./limits";

type RateLimitBucket = {
  windowStart: number;
  count: number;
};

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

const buckets = new Map<string, RateLimitBucket>();
let lastCleanupAt = 0;

function cleanupBuckets(now: number, windowMs: number) {
  if (now - lastCleanupAt < windowMs) {
    return;
  }
  lastCleanupAt = now;
  for (const [tokenId, bucket] of buckets.entries()) {
    if (now - bucket.windowStart >= windowMs) {
      buckets.delete(tokenId);
    }
  }
}

export function checkPartnerTokenRateLimit(
  tokenId: string,
  now = Date.now(),
): RateLimitResult {
  const { limit, windowMs } = PARTNER_TOKEN_RATE_LIMIT;
  cleanupBuckets(now, windowMs);
  const current = buckets.get(tokenId);

  if (!current || now - current.windowStart >= windowMs) {
    buckets.set(tokenId, { windowStart: now, count: 1 });
    return { allowed: true };
  }

  if (current.count < limit) {
    current.count += 1;
    return { allowed: true };
  }

  const retryAfterMs = current.windowStart + windowMs - now;
  const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

  return { allowed: false, retryAfterSeconds };
}
