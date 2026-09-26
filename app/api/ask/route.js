// POST /api/ask — the "ask about my work" agent. The whole pipeline lives in
// lib/ask/handle.js (shared with `npm run eval:ask`); API keys are read there
// on the server only.
import { handleAsk } from "../../../lib/ask/handle.js";

export async function POST(request) {
  return handleAsk(request);
}
