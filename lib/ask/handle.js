// The whole /api/ask pipeline, as a plain (Request) => Response function so
// the route and the eval runner exercise exactly the same code:
//
//   JSON { question } → validate → guard → offline check → rate limit
//   → retrieval → streamText → NDJSON stream + validated sources
//
// Response stream (application/x-ndjson), one JSON object per line:
//   { "type": "text", "value": "..." }          answer text, as it streams
//   { "type": "replace", "text": "..." }        only if the final text was changed (masking)
//   { "type": "sources", "sources": [...], "dropped": [n] }   last line
//   { "type": "error", "code": "...", "message": "..." }      if the model fails mid-stream
//
// Nothing about the question or the visitor is stored.

import { streamText } from "ai";
import { validateQuestion, guard, maskPhones } from "./guard.js";
import { checkRateLimit } from "./rate-limit.js";
import { retrieve } from "./retrieve.js";
import { SYSTEM_PROMPT, buildPrompt } from "./system-prompt.js";
import { modelConfig, languageModel } from "./provider.js";

const NDJSON = { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" };

function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

const publicSource = (p, n) => ({ n, id: p.id, title: p.title, url: p.url });

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
  return { sources: valid.map((n) => publicSource(passages[n - 1], n)), dropped: [...dropped] };
}

/** A fixed text answer streamed in the same format (used for guard refusals). */
function fixedAnswer(text) {
  const body = `${JSON.stringify({ type: "text", value: text })}\n${JSON.stringify({ type: "sources", sources: [], dropped: [] })}\n`;
  return new Response(body, { status: 200, headers: { ...NDJSON, "x-ask-guard": "1" } });
}

export async function handleAsk(request, { model: modelOverride } = {}) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { code: "bad_request", message: 'Send JSON like { "question": "What is DevTask?" }.' });
  }

  const checked = validateQuestion(body?.question);
  if (!checked.ok) return json(400, { code: "invalid_question", message: checked.message });
  const question = checked.question;

  const refusal = guard(question);
  if (refusal) return fixedAnswer(refusal);

  const config = modelConfig();
  if (!config.ok && !modelOverride) {
    // Still useful offline: point at the closest pages.
    const nearest = retrieve(question, 3).filter((p) => p.score > 0);
    return json(503, {
      code: "offline",
      message: "AI is offline in this build. Every other command still works.",
      sources: nearest.map((p, i) => publicSource(p, i + 1)),
    });
  }

  const limit = await checkRateLimit(request);
  if (!limit.ok) {
    const minutes = Math.ceil(limit.retryAfter / 60);
    const message =
      limit.scope === "daily"
        ? "The terminal has answered all the questions it can for today. Try again tomorrow, or run `contact`."
        : `That's a lot of questions in a short time. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
    return json(429, { code: "rate_limited", scope: limit.scope, message, retryAfter: limit.retryAfter }, { "retry-after": String(limit.retryAfter) });
  }

  const passages = retrieve(question);
  const model = modelOverride ?? (await languageModel(config));
  const result = streamText({
    model,
    instructions: SYSTEM_PROMPT,
    prompt: buildPrompt(question, passages),
    temperature: 0.2,
    maxOutputTokens: 350,
    maxRetries: 1,
    abortSignal: request.signal,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj) => controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      let full = "";
      try {
        for await (const delta of result.textStream) {
          full += delta;
          send({ type: "text", value: delta });
        }
      } catch {
        send({ type: "error", code: "model", message: "The AI had trouble answering. Try again in a moment." });
      }
      if (!full.trim()) {
        send({ type: "error", code: "empty", message: "The AI returned an empty answer. Try rephrasing the question." });
      }
      const masked = maskPhones(full);
      if (masked !== full) send({ type: "replace", text: masked });
      send({ type: "sources", ...validateCitations(masked, passages) });
      controller.close();
    },
  });

  return new Response(stream, { status: 200, headers: NDJSON });
}
