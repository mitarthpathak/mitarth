// Input validation and a cheap guard that answers obvious injection or
// extraction attempts with a fixed, polite refusal — without calling the model.

export const MIN_LEN = 3;
export const MAX_LEN = 300;

// Control characters (keep ordinary spaces; tabs/newlines become spaces).
const CONTROL = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g;

export function cleanQuestion(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/[\t\n\r]+/g, " ").replace(CONTROL, "").replace(/\s{2,}/g, " ").trim();
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
  return { ok: true, question };
}

export const REFUSAL =
  "I can only answer questions about Mitarth's work, using what's on this site. Try asking about one of his projects, or run `projects`.";
export const PHONE_REFUSAL =
  "I don't share phone numbers. Run `contact` for his email, LinkedIn and GitHub.";

const INJECTION = [
  /\b(ignore|disregard|forget|override|bypass)\b.{0,40}\b(instructions?|rules?|prompts?|guidelines?|context|everything)\b/i,
  /\bsystem\s*prompt\b/i,
  /\b(reveal|show|print|repeat|leak|output)\b.{0,30}\b(prompt|instructions?|rules)\b/i,
  /\byou\s+are\s+now\b/i,
  /\bdeveloper\s+mode\b/i,
  /\bjail\s*break\b|\bDAN\b/i,
  /\b(pretend|act|roleplay|role-play|behave)\b.{0,25}\b(to be|as|like)\b.{0,25}\b(mitarth|him|pathak)\b/i,
  /\bspeak\s+as\s+(mitarth|him)\b/i,
  /<\/?(system|assistant|instructions?)>/i,
];

const PHONE = /\b(phone|mobile|cell|whats\s*app|contact\s+number|number\s+to\s+call|call\s+him|telephone)\b/i;

/** Returns a fixed refusal string if the question should not reach the model. */
export function guard(question) {
  if (PHONE.test(question)) return PHONE_REFUSAL;
  if (INJECTION.some((re) => re.test(question))) return REFUSAL;
  return null;
}

// Last line of defence on the way out: anything that looks like a phone
// number is masked before it reaches the visitor.
const PHONE_OUT = /(\+?\d[\d\s().-]{8,}\d)/g;
export function maskPhones(text) {
  return text.replace(PHONE_OUT, (m) => (m.replace(/\D/g, "").length >= 10 ? "[number removed]" : m));
}
