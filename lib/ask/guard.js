// Input validation, a cheap guard that answers obvious injection, role-play
// or phone-number requests with a fixed refusal (no model call), and the
// phone-number mask applied to everything the model writes.

export const MIN_LEN = 3;
export const MAX_LEN = 300;

// Invisible and formatting characters: C0/C1 controls, zero-width and bidi
// marks, the soft hyphen and the Unicode "tag" block (ASCII smuggling).
const INVISIBLE = /[\p{Cc}\p{Cf}\u{E0000}-\u{E007F}]/gu;

export function cleanQuestion(raw) {
  if (typeof raw !== "string") return "";
  return raw
    .normalize("NFKC") // fullwidth and other lookalike forms → plain letters
    .replace(/\s+/g, " ")
    .replace(INVISIBLE, "")
    .replace(/ {2,}/g, " ")
    .trim();
}

/** { ok: true, question } or { ok: false, message } (friendly, for a 400). */
export function validateQuestion(raw) {
  const question = cleanQuestion(raw);
  if (question.length < MIN_LEN) {
    return { ok: false, message: `Ask a question of at least ${MIN_LEN} characters, e.g. ask "What is DevTask?"` };
  }
  if (question.length > MAX_LEN) {
    return { ok: false, message: `Keep it under ${MAX_LEN} characters — a short question works best.` };
  }
  if (!/\p{L}/u.test(question)) {
    return { ok: false, message: 'Ask a question in words, e.g. ask "What is DevTask?"' };
  }
  return { ok: true, question };
}

export const REFUSAL =
  "The terminal only answers questions about Mitarth's work, from what's on this site. Try asking about one of his projects, or run `projects`.";
export const PHONE_REFUSAL =
  "The terminal doesn't share phone numbers. Run `contact` for his email, LinkedIn and GitHub.";

const WHO = String.raw`(mitarth|him|pathak|the owner|the author)`;
const INJECTION = [
  // "ignore / override the rules"
  /\b(ignore|disregard|forget|override|bypass|skip)\b.{0,40}\b(instructions?|rules?|prompts?|guidelines?|context|everything|above)\b/i,
  // asking for the prompt itself
  /\b(reveal|show|print|repeat|leak|output|display|dump|copy|paste)\b.{0,30}\b(your|hidden|initial|original|above|previous)\s+(system\s+)?(prompt|instructions?|rules|messages?)\b/i,
  /\b(reveal|show|print|repeat|leak|output|display|dump|copy|paste|what(?:'s| is| are| was| were))\b.{0,20}\bsystem\s*(prompt|message|instructions?)\b/i,
  /\bwhat\s+(are|were|is)\s+your\s+(instructions?|rules|prompt)\b/i,
  // switching persona
  /\byou\s+are\s+now\b|\bfrom\s+now\s+on\b|\bdeveloper\s+mode\b|\bjail\s*break/i,
  /\bDAN\b/, // the "Do Anything Now" jailbreak, case-sensitive so "Dan" is fine
  new RegExp(String.raw`\b(pretend|act|roleplay|role-play|behave|respond|answer|reply|speak|talk|write)\b.{0,25}\b(to be|as|like|in the voice of|on behalf of)\b.{0,25}\b${WHO}\b`, "i"),
  new RegExp(String.raw`\b(you're|you are|you r|ur)\s+(now\s+)?${WHO}\b|\b(pretend|imagine)\b.{0,20}\byou\s*(are|'re)\b`, "i"),
  /\bin\s+(the\s+)?first[\s-]+person\b/i,
  // pseudo-markup meant to look like the prompt's own structure
  /<\/?\s*(system|assistant|user|instructions?|question|context|passages?)\s*>/i,
];

// Contact-intent phrasings only. "Does Yap-Render have a mobile app?" or
// "Does it work on a phone?" are ordinary questions and must reach the model.
const PHONE = [
  /\b(phone|mobile|cell|cellphone|whats\s*app|telephone|contact|personal)\s*(no\b\.?|nos?\.|num\b|numbers?\b|#)/i,
  /\b(his|mitarth'?s|your)\s+(phone|mobile|cell|cellphone|whats\s*app|telephone|number)\b(?!\s*(apps?|ui|ux|layout|screens?|version|view|site|friendly|first))/i,
  /\b(call|ring|text|dial|phone|whats\s*app)\s+(him|mitarth)\b/i,
  /\b(number|digits)\s+to\s+(call|reach|contact|text)\b/i,
];

/** Returns a fixed refusal string if the question should not reach the model. */
export function guard(question) {
  if (PHONE.some((re) => re.test(question))) return PHONE_REFUSAL;
  if (INJECTION.some((re) => re.test(question))) return REFUSAL;
  return null;
}

// ---------- phone-number mask (last line of defence on the way out) ----------

// A run of digits (any script) with the separators people put inside phone
// numbers: spaces, dots, brackets, slashes, underscores and every dash.
const SEP = String.raw`\s().\-‐-―−/_－`;
const NUMBER_RUN = new RegExp(String.raw`[+(＋]?\p{Nd}[\p{Nd}${SEP}]*\p{Nd}\)?`, "gu");
const RUN_CHAR = new RegExp(String.raw`[+(＋\p{Nd}${SEP}]`, "u");
// 2026-09-26 or 2026-09-26 19 (from "19:36") are dates, not phone numbers.
const DATE_TIME = /^\p{Nd}{4}[-/.]\p{Nd}{1,2}[-/.]\p{Nd}{1,2}(?:[\sT]\p{Nd}{1,2})?$/u;

export const MASK = "[number removed]";

export function maskPhones(text) {
  return text.replace(NUMBER_RUN, (m) => {
    const digits = m.replace(/\P{Nd}/gu, "").length;
    return digits >= 10 && !DATE_TIME.test(m.trim()) ? MASK : m;
  });
}

export function hasPhoneNumber(text) {
  return maskPhones(text) !== text;
}

/**
 * Masks a stream of text chunks without ever emitting part of a number:
 * a trailing run of digits and separators is held back until the next
 * character that can't belong to it arrives (or the stream ends).
 */
export function createPhoneMasker() {
  let pending = "";
  return {
    push(chunk) {
      const chars = Array.from(pending + chunk);
      let cut = chars.length;
      while (cut > 0 && RUN_CHAR.test(chars[cut - 1])) cut--;
      pending = chars.slice(cut).join("");
      return maskPhones(chars.slice(0, cut).join(""));
    },
    flush() {
      const out = maskPhones(pending);
      pending = "";
      return out;
    },
  };
}
