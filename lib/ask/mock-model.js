// DEVELOPMENT ONLY (ASK_PROVIDER=mock, never in production): a fake model that
// streams slowly so the terminal's thinking / streaming / sources states can
// be built and screenshotted without an API key. It quotes the first sentence
// of the first two passages it was given, with their citation numbers.

import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";

function promptText(prompt) {
  return prompt
    .flatMap((m) => (typeof m.content === "string" ? [m.content] : m.content.map((c) => c.text ?? "")))
    .join("\n");
}

export function mockModel() {
  return new MockLanguageModelV4({
    doStream: async ({ prompt }) => {
      const text = promptText(prompt);
      const passages = [...text.matchAll(/\[(\d+)\] [^\n]+\n([^\n]+)/g)].slice(0, 2);
      const answer =
        "(Mock model, development only.) " +
        passages.map(([, n, body]) => `${(body.match(/[^.!?]+[.!?]/) ?? [body])[0].trim()} [${n}]`).join(" ");
      const words = answer.split(/(?<=\s)/);
      return {
        stream: simulateReadableStream({
          initialDelayInMs: 900,
          chunkDelayInMs: 90,
          chunks: [
            { type: "text-start", id: "t" },
            ...words.map((delta) => ({ type: "text-delta", id: "t", delta })),
            { type: "text-end", id: "t" },
            {
              type: "finish",
              finishReason: { unified: "stop", raw: undefined },
              usage: { inputTokens: { total: 0, noCache: 0 }, outputTokens: { total: 0, text: 0 } },
            },
          ],
        }),
      };
    },
  });
}
