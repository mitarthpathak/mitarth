// Rate limits for /api/ask: 8 requests per 10 minutes per visitor, plus a
// global daily cap so a bill can't explode.
//
// With UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN set, limits live
// in Upstash Redis and hold across every serverless instance. Without them,
// an in-memory limiter is used. That is best-effort on serverless: each warm
// instance keeps its own counters and they reset on a cold start.
//
// Visitors are identified by a salted SHA-256 hash of their IP, never the IP.

import { createHash } from "node:crypto";

export const PER_IP_LIMIT = 8;
export const PER_IP_WINDOW_MS = 10 * 60 * 1000;
export const DAILY_LIMIT = Number(process.env.ASK_DAILY_LIMIT) || 300;
const DAY_MS = 24 * 60 * 60 * 1000;

export function visitorKey(request) {
  const fwd = request.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
  const salt = process.env.ASK_HASH_SALT ?? "mitarth-portfolio";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

// ---------- in-memory (best-effort) ----------
const hits = new Map(); // key -> timestamps
let day = { start: Date.now(), count: 0 };

function memoryLimit(key, now = Date.now()) {
  if (now - day.start >= DAY_MS) day = { start: now, count: 0 };
  if (day.count >= DAILY_LIMIT) {
    return { ok: false, scope: "daily", retryAfter: Math.ceil((day.start + DAY_MS - now) / 1000) };
  }
  const recent = (hits.get(key) ?? []).filter((t) => now - t < PER_IP_WINDOW_MS);
  if (recent.length >= PER_IP_LIMIT) {
    hits.set(key, recent);
    return { ok: false, scope: "visitor", retryAfter: Math.ceil((recent[0] + PER_IP_WINDOW_MS - now) / 1000) };
  }
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
  upstash = {
    visitor: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(PER_IP_LIMIT, "10 m"), prefix: "ask:visitor" }),
    daily: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(DAILY_LIMIT, "1 d"), prefix: "ask:daily" }),
  };
  return upstash;
}

/** { ok: true } or { ok: false, scope: "visitor" | "daily", retryAfter: seconds } */
export async function checkRateLimit(request) {
  const key = visitorKey(request);
  const shared = await getUpstash();
  if (!shared) return memoryLimit(key);

  const visitor = await shared.visitor.limit(key);
  if (!visitor.success) {
    return { ok: false, scope: "visitor", retryAfter: Math.max(1, Math.ceil((visitor.reset - Date.now()) / 1000)) };
  }
  const daily = await shared.daily.limit("global");
  if (!daily.success) {
    return { ok: false, scope: "daily", retryAfter: Math.max(1, Math.ceil((daily.reset - Date.now()) / 1000)) };
  }
  return { ok: true };
}

export function rateLimitBackend() {
  return process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? "upstash" : "memory";
}

/** For tests only. */
export function _resetMemoryLimiter() {
  hits.clear();
  day = { start: Date.now(), count: 0 };
}
