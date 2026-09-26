// Picks the model from environment variables. Server-only: this file (and
// everything else in lib/ask) is imported by app/api/ask/route.js alone.
//
//   ASK_PROVIDER = openai | anthropic | google
//   ASK_MODEL    = the provider's model id
//   key          = the provider's standard variable (below)

const KEY_VARS = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
};

// Only a default where the model id is certain; otherwise ASK_MODEL is required.
const DEFAULT_MODELS = {
  anthropic: "claude-haiku-4-5",
};

/** { ok: true, provider, model } or { ok: false, reason } — never exposes key values. */
export function modelConfig() {
  const provider = (process.env.ASK_PROVIDER ?? "").trim().toLowerCase();
  if (!provider) return { ok: false, reason: "ASK_PROVIDER is not set" };
  // Development only: a fake model for working on the terminal UI without a
  // key. It never runs in production builds and is never used by the evals.
  if (provider === "mock" && process.env.NODE_ENV !== "production") return { ok: true, provider, model: "mock" };
  const keyVar = KEY_VARS[provider];
  if (!keyVar) return { ok: false, reason: `Unsupported ASK_PROVIDER "${provider}"` };
  if (!process.env[keyVar]) return { ok: false, reason: `${keyVar} is not set` };
  const model = (process.env.ASK_MODEL ?? "").trim() || DEFAULT_MODELS[provider];
  if (!model) return { ok: false, reason: "ASK_MODEL is not set" };
  return { ok: true, provider, model };
}

export async function languageModel({ provider, model }) {
  switch (provider) {
    case "openai": {
      const { openai } = await import("@ai-sdk/openai");
      return openai(model);
    }
    case "anthropic": {
      const { anthropic } = await import("@ai-sdk/anthropic");
      return anthropic(model);
    }
    case "google": {
      const { google } = await import("@ai-sdk/google");
      return google(model);
    }
    case "mock":
      if (process.env.NODE_ENV === "production") throw new Error("The mock model is development-only");
      return (await import("./mock-model.js")).mockModel();
    default:
      throw new Error(`Unsupported provider ${provider}`);
  }
}
