// middleware/rateLimiter.js
// Rate limiting per rol (en memòria). En producció es recomana Redis.

const { RATE_LIMITS } = require("../config/constants");

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000;

// Mapa: clau -> { count, resetAt }
const buckets = new Map();

// Neteja periòdica per evitar fuites de memòria
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of buckets) {
    if (val.resetAt <= now) buckets.delete(key);
  }
}, WINDOW_MS).unref?.();

function getLimitForRole(role) {
  if (!role) return RATE_LIMITS.anonymous;
  const r = String(role).toLowerCase();
  return RATE_LIMITS[r] !== undefined ? RATE_LIMITS[r] : RATE_LIMITS.user;
}

function rateLimiter(options = {}) {
  return (req, res, next) => {
    const userId = req.userId ? String(req.userId) : null;
    const role = req.userRole || "anonymous";
    const limit = options.limit || getLimitForRole(role);
    const key = userId ? `u:${userId}` : `ip:${req.ip || "unknown"}`;

    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + WINDOW_MS };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(0, limit - bucket.count);
    const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);

    res.setHeader("X-RateLimit-Limit", String(limit));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(resetSeconds));

    if (bucket.count > limit) {
      res.setHeader("Retry-After", String(resetSeconds));
      return res.status(429).json({
        success: false,
        error: "Massa peticions. Torna a provar-ho més tard.",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: resetSeconds,
      });
    }

    next();
  };
}

module.exports = rateLimiter;
module.exports.getLimitForRole = getLimitForRole;
