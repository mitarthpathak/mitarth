import { handleAsk } from "../../../lib/ask/handle.js";

// Answers stream for a few seconds at most; the model call itself times out
// after 25 s (lib/ask/handle.js), so the function never runs to the platform
// maximum.
export const maxDuration = 30;

export async function POST(request) {
  return handleAsk(request);
}
