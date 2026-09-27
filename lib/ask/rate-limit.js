import "server-only";

// Rate limits for /api/ask: 8 requests per 10 minutes per visitor, plus a
// daily cap on answered questions so a bill can't explode.
//
// With UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN set, limits live
// in Upstash Redis and hold across every serverless instance. Without them,
// an in-memory limiter is used. That is best-effort on serverless: each warm
// instance keeps its own counters (so the daily cap is per instance) and they
// reset on a cold start. Set a spending limit with the AI provider as well.
//
// Visitors are identified by a salted, daily-rotated SHA-256 hash of their IP
// (IPv6 by /64), never the IP itself.

import { createHash, randomBytes } from "node:crypto";

export const PER_IP_LIMIT = 8;
export const PER_IP_WINDOW_MS = 10 * 60 * 1000;
const parsedDaily = Number.parseInt(process.env.ASK_DAILY_LIMIT ?? "", 10);
export const DAILY_LIMIT = Number.isFinite(parsedDaily) && parsedDaily >= 0 ? parsedDaily : 300;
const DAY_MS = 24 * 60 * 60 * 1000;
const UPSTASH_TIMEOUT_MS = 1500;

// A secret salt: ASK_HASH_SALT, else the Upstash token (secret and the same on
// every instance), else a random one per instance (fine for in-memory counts).
const SALT = process.env.ASK_HASH_SALT || process.env.UPSTASH_REDIS_REST_TOKEN || randomBytes(16).toString("hex");

/**
 * The client's IP. On Vercel, x-real-ip and x-forwarded-for are set by the
 * edge from the connection, not taken from the visitor. Behind another proxy,
 * make sure it overwrites them too.
 */
function clientIp(request) {
  const real = (request.headers.get("x-real-ip") ?? "").trim();
  const fwd = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  return real || fwd || "unknown";
}

/** One bucket per IPv4 address, or per IPv6 /64 (what one household gets). */
export function ipBucket(ip) {
  const clean = ip.replace(/^\[|\](:\d+)?$/g, "").split("%")[0];
  if (!clean.includes(":")) return clean;
  const mapped = clean.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return mapped[1];
  const [head, tail] = clean.split("::");
  const h = head ? head.split(":") : [];
  const t = tail ? tail.split(":") : [];
  const groups = clean.includes("::") ? [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill("0"), ...t] : h;
  return `${groups
    .slice(0, 4)
    .map((g) => (Number.parseInt(g || "0", 16) || 0).toString(16))
    .join(":")}::/64`;
}

export function visitorKey(request, now = Date.now()) {
  const day = new Date(now).toISOString().slice(0, 10);
  return createHash("sha256").update(`${SALT}:${day}:${ipBucket(clientIp(request))}`).digest("hex").slice(0, 32);
}

const dayStart = (now) => Math.floor(now / DAY_MS) * DAY_MS; // 00:00 UTC
const dailyRejection = (now) => ({ ok: false, scope: "daily", retryAfter: Math.ceil((dayStart(now) + DAY_MS - now) / 1000) });

// ---------- in-memory (best-effort) ----------
const hits = new Map(); // key -> timestamps
let day = { start: dayStart(Date.now()), count: 0 };

function memoryLimit(key, now = Date.now()) {
  if (dayStart(now) !== day.start) day = { start: dayStart(now), count: 0 };
  const recent = (hits.get(key) ?? []).filter((t) => now - t < PER_IP_WINDOW_MS);
  if (recent.length >= PER_IP_LIMIT) {
    hits.set(key, recent);
    return { ok: false, scope: "visitor", retryAfter: Math.ceil((recent[0] + PER_IP_WINDOW_MS - now) / 1000) };
  }
  if (day.count >= DAILY_LIMIT) return dailyRejection(now);
  recent.push(now);
  hits.set(key, recent);
  day.count += 1;
  // keep the map from growing without bound
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < PER_IP_WINDOW_MS)) hits.delete(k);
  return { ok: true };
}

// ---------- Upstash (shared) ----------
let upstash = null;
async function getUpstash() {
  if (upstash !== null) return upstash;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    upstash = false;
    return upstash;
  }
  const [{ Ratelimit }, { Redis }] = await Promise.all([import("@upstash/ratelimit"), import("@upstash/redis")]);
  const redis = Redis.fromEnv();
  const common = { redis, timeout: UPSTASH_TIMEOUT_MS, analytics: false };
  upstash = {
    visitor: new Ratelimit({ ...common, limiter: Ratelimit.slidingWindow(PER_IP_LIMIT, "10 m"), prefix: "ask:visitor" }),
    daily: new Ratelimit({ ...common, limiter: Ratelimit.fixedWindow(Math.max(1, DAILY_LIMIT), "1 d"), prefix: "ask:daily" }),
  };
  return upstash;
}

/**
 * { ok: true } or { ok: false, scope: "visitor" | "daily", retryAfter: seconds }.
 * The visitor limit is checked first, so a visitor who is over their own
 * limit never uses up the shared daily budget.
 */
export async function checkRateLimit(request) {
  const now = Date.now();
  const key = visitorKey(request, now);
  if (DAILY_LIMIT === 0) return dailyRejection(now);
  const shared = await getUpstash();
  if (!shared) return memoryLimit(key, now);

  try {
    const visitor = await shared.visitor.limit(key);
    // If Redis is slow or down, fall back to this instance's own counters
    // rather than letting every request through.
    if (visitor.reason === "timeout") return memoryLimit(key, now);
    if (!visitor.success) {
      return { ok: false, scope: "visitor", retryAfter: Math.max(1, Math.ceil((visitor.reset - now) / 1000)) };
    }
    const daily = await shared.daily.limit("global");
    if (daily.reason === "timeout") return memoryLimit(key, now);
    if (!daily.success) return dailyRejection(now);
    return { ok: true };
  } catch {
    return memoryLimit(key, now);
  }
}
