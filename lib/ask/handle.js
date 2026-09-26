import "server-only";

// The whole /api/ask pipeline, as a plain (Request) => Response function so
// the route and the eval runner exercise exactly the same code:
//
//   same-origin JSON { question } → validate → guard → retrieval floor
//   → offline check → rate limit → streamText → NDJSON stream + validated sources
//
// Response stream (application/x-ndjson), one JSON object per line:
//   { "type": "meta", "passages": n }            first line: how many passages were sent
//   { "type": "text", "value": "..." }           answer text (phone numbers already masked)
//   { "type": "error", "code": "...", "message": "..." }   model failed or stopped
//   { "type": "sources", "sources": [...], "dropped": [n], "uncited": bool, "truncated": bool }   last line
//
// Nothing about the question or the visitor is stored or logged.

import { streamText } from "ai";
import { validateQuestion, guard, createPhoneMasker } from "./guard.js";
import { checkRateLimit } from "./rate-limit.js";
import { retrieve, hasRelevantPassage } from "./retrieve.js";
import { SYSTEM_PROMPT, NOT_COVERED, buildPrompt } from "./system-prompt.js";
import { modelConfig, languageModel } from "./provider.js";

const NDJSON = { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" };
const MAX_BODY_BYTES = 2048;
const MAX_OUTPUT_TOKENS = 350;
// The model is told ≤ 120 words; past this the server stops it (the UI says
// the answer was cut short), so the rule holds even when the model doesn't.
const MAX_WORDS = 150;
const TIMEOUT = { totalMs: 25_000, firstChunkMs: 12_000, chunkMs: 8_000 };

function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

const publicSource = (p, n) => ({ n, id: p.id, title: p.title, url: p.url, ...(p.command ? { command: p.command } : {}) });
const countWords = (t) => t.split(/\s+/).filter(Boolean).length;

/** Which [n] markers are valid for the passages that were actually sent. */
export function validateCitations(text, passages) {
  const valid = [];
  const dropped = new Set();
  for (const m of text.matchAll(/\[(\d+(?:\s*,\s*\d+)*)\]/g)) {
    for (const raw of m[1].split(",")) {
      const n = Number(raw.trim());
      if (n >= 1 && n <= passages.length) {
        if (!valid.includes(n)) valid.push(n);
      } else dropped.add(n);
    }
  }
  valid.sort((a, b) => a - b);
  return { sources: valid.map((n) => publicSource(passages[n - 1], n)), dropped: [...dropped] };
}

/** A fixed text answer streamed in the same format (guard refusals, "not covered"). */
function fixedAnswer(text, reason) {
  const lines = [
    { type: "meta", passages: 0 },
    { type: "text", value: text },
    { type: "sources", sources: [], dropped: [], uncited: false, truncated: false },
  ];
  return new Response(lines.map((l) => JSON.stringify(l)).join("\n") + "\n", {
    status: 200,
    headers: { ...NDJSON, "x-ask-fixed": reason },
  });
}

/**
 * Only this site's own pages may spend the question budget: a cross-site
 * form or no-cors fetch is refused. Requests without browser headers (curl,
 * the eval runner) have no Origin or Sec-Fetch-Site and are still
 * rate-limited like everyone else.
 */
function checkRequest(request) {
  const type = request.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) {
    return json(415, { code: "bad_request", message: 'Send JSON like { "question": "What is DevTask?" }.' });
  }
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return json(403, { code: "forbidden", message: "Questions can only be asked from this site." });
  }
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;
    let originHost = null;
    try {
      originHost = new URL(origin).host;
    } catch {}
    if (originHost !== host) return json(403, { code: "forbidden", message: "Questions can only be asked from this site." });
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return json(413, { code: "too_large", message: "That request is too large." });
  return null;
}

/** The first sentence or two of a passage, for offline answers. */
function excerpt(text, maxWords = 45) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  let out = "";
  for (const s of sentences) {
    if (out && countWords(out + s) > maxWords) break;
    out += s;
  }
  return out.trim();
}

export async function handleAsk(request, { model: modelOverride } = {}) {
  const refused = checkRequest(request);
  if (refused) return refused;

  let body;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
      return json(413, { code: "too_large", message: "That request is too large." });
    }
    body = JSON.parse(raw);
  } catch {
    return json(400, { code: "bad_request", message: 'Send JSON like { "question": "What is DevTask?" }.' });
  }

  const checked = validateQuestion(body?.question);
  if (!checked.ok) return json(400, { code: "invalid_question", message: checked.message });
  const question = checked.question;

  const refusal = guard(question);
  if (refusal) return fixedAnswer(refusal, "guard");

  // Nothing on the site is even close: say so without calling the model.
  const passages = retrieve(question);
  if (!hasRelevantPassage(question, passages)) return fixedAnswer(NOT_COVERED, "not-covered");

  const config = modelConfig();
  if (!config.ok && !modelOverride) {
    // Without a key nothing can be spent, so there's nothing to rate-limit.
    // Still useful: the closest passage, quoted, and links to the pages.
    const nearest = passages.filter((p) => p.score > 0).slice(0, 3);
    return json(200, {
      code: "offline",
      message: "AI is offline in this build: no API key is set up, so `ask` can't answer yet. Every other command still works.",
      excerpt: nearest[0] ? { n: 1, text: excerpt(nearest[0].text) } : null,
      sources: nearest.map((p, i) => publicSource(p, i + 1)),
    });
  }

  const limit = await checkRateLimit(request);
  if (!limit.ok) {
    const minutes = Math.ceil(limit.retryAfter / 60);
    const message =
      limit.scope === "daily"
        ? "The terminal has answered all the questions it can for today (the limit resets at 00:00 UTC). Every other command still works, and `contact` reaches Mitarth directly."
        : `That's a lot of questions in a short time. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
    return json(429, { code: "rate_limited", scope: limit.scope, message, retryAfter: limit.retryAfter }, { "retry-after": String(limit.retryAfter) });
  }

  const model = modelOverride ?? (await languageModel(config));
  const stop = new AbortController();
  const result = streamText({
    model,
    instructions: SYSTEM_PROMPT,
    prompt: buildPrompt(question, passages),
    temperature: 0.2,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    maxRetries: 1,
    timeout: TIMEOUT,
    abortSignal: AbortSignal.any([request.signal, stop.signal]),
    // Replaces the SDK's default console.error(error), which would log the
    // provider request body — the visitor's question. Log the kind only.
    onError: ({ error }) => {
      console.error("[ask] model error:", error?.name ?? "Error", error?.statusCode ?? "");
    },
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let open = true;
      const send = (obj) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
        } catch {
          open = false;
          stop.abort();
        }
      };
      const masker = createPhoneMasker();
      let full = "";
      let failed = null;
      let finishReason = null;
      let capped = false;
      const emit = (text) => {
        if (!text || capped) return;
        const room = MAX_WORDS - countWords(full);
        const pieces = text.split(/(?<=\s)/);
        if (countWords(text) > room) {
          text = pieces.slice(0, Math.max(0, room)).join("").trimEnd() + " …";
          capped = true;
          stop.abort();
        }
        full += text;
        send({ type: "text", value: text });
      };

      send({ type: "meta", passages: passages.length });
      try {
        for await (const part of result.fullStream) {
          if (part.type === "text-delta") emit(masker.push(part.text));
          else if (part.type === "finish") finishReason = part.finishReason;
          else if (part.type === "error") failed = "model";
          else if (part.type === "abort" && !capped) failed = failed ?? "stopped";
          if (failed || capped || !open) break;
        }
      } catch {
        if (!capped) failed = failed ?? "model";
      }
      emit(masker.flush());

      if (failed) {
        const cut = full.trim().length > 0;
        send({
          type: "error",
          code: failed,
          message: cut
            ? "The answer was cut off: the AI service stopped responding. Try asking again."
            : "The AI service had a problem answering. Try again in a moment.",
        });
      } else if (!full.trim()) {
        send({ type: "error", code: "empty", message: "The AI returned an empty answer. Try rephrasing the question." });
      }
      const cited = validateCitations(full, passages);
      send({
        type: "sources",
        ...cited,
        // A substantive answer with no valid citation gets flagged in the UI.
        uncited: cited.sources.length === 0 && countWords(full) > 25,
        truncated: capped || finishReason === "length",
      });
      if (open) controller.close();
    },
    cancel() {
      stop.abort();
    },
  });

  return new Response(stream, { status: 200, headers: NDJSON });
}
