type Entry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Entry>();

export function checkRateLimit(
  key: string,
  options: { limit: number; windowMs: number }
) {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { limited: false, remaining: options.limit - 1 };
  }

  if (entry.count >= options.limit) {
    return { limited: true, remaining: 0 };
  }

  entry.count += 1;
  return { limited: false, remaining: options.limit - entry.count };
}

export function getClientKey(prefix: string, req: Request, identifier = "") {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || req.headers.get("x-real-ip") || "local";
  return `${prefix}:${ip}:${identifier.toLowerCase()}`;
}

export function resetRateLimitsForTests() {
  buckets.clear();
}
