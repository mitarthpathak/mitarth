import "server-only";

// DEVELOPMENT ONLY (ASK_PROVIDER=mock, never in production): a fake model that
// streams slowly so the terminal's thinking / streaming / sources states can
// be built and screenshotted without an API key. It quotes one sentence from
// each of the first two passages it was given, with their citation numbers.
//
// Test switches for QA, as words in the question: "mockerror" fails halfway
// through, "mockphone" includes a phone number, "mockcite" cites a passage
// that wasn't sent.

import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";

function promptText(prompt) {
  return prompt
    .flatMap((m) => (typeof m.content === "string" ? [m.content] : m.content.map((c) => c.text ?? "")))
    .join("\n");
}

const sentences = (body) => body.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) ?? [body.trim()];

export function mockModel() {
  return new MockLanguageModelV4({
    doStream: async ({ prompt }) => {
      const user = promptText(prompt.filter((m) => m.role === "user"));
      const [context, rest = ""] = user.split("<question>");
      const question = rest.split("</question>")[0].toLowerCase();
      const passages = [...context.matchAll(/\[(\d+)\] [^\n]+\n([^\n]+)/g)].slice(0, 2);
      const used = new Set();
      const quoted = passages.map(([, n, body]) => {
        const s = sentences(body).find((x) => !used.has(x)) ?? sentences(body)[0];
        used.add(s);
        return `${s} [${n}]`;
      });
      let answer = "(Mock model, development only.) " + quoted.join(" ");
      if (question.includes("mockphone")) answer += " Call +00 00000 00000 for more.";
      if (question.includes("mockcite")) answer += " This part is made up [9].";
      const words = answer.split(/(?<=\s)/);
      const fail = question.includes("mockerror");
      const deltas = (fail ? words.slice(0, Math.ceil(words.length / 2)) : words).map((delta) => ({ type: "text-delta", id: "t", delta }));
      return {
        stream: simulateReadableStream({
          initialDelayInMs: 900,
          chunkDelayInMs: 90,
          chunks: [
            { type: "text-start", id: "t" },
            ...deltas,
            ...(fail
              ? [{ type: "error", error: new Error("mock provider failure") }]
              : [
                  { type: "text-end", id: "t" },
                  {
                    type: "finish",
                    finishReason: { unified: "stop", raw: undefined },
                    usage: { inputTokens: { total: 0, noCache: 0 }, outputTokens: { total: 0, text: 0 } },
                  },
                ]),
          ],
        }),
      };
    },
  });
}
