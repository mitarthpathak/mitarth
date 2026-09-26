i am lazy 
I'll write README later

---

# mitarth.vercel.app

Portfolio of Mitarth Pathak — Next.js 16 (App Router), React 19, GSAP, Motion and React Three Fiber.

```bash
npm ci
npm run dev        # http://localhost:3000
npm run build      # also rebuilds lib/ask/knowledge.json (prebuild)
npm run lint
npm run eval:ask   # evals for the terminal's ask agent
```

Content lives in `content/projects.js` (case studies) and `content/profile.js` (profile). Both feed the pages, the terminal and the ask agent's knowledge base.

## Ask the terminal: setup

The home page has a working terminal (`#terminal`). Every command works without any setup. `ask "<question>"` (or just typing a question) needs an AI provider; without one it replies "AI is offline in this build", quotes the closest passage and links the closest pages.

1. Copy `.env.example` to `.env.local` (git-ignored) and fill in:

   | Variable | What |
   |---|---|
   | `ASK_PROVIDER` | `openai`, `anthropic` or `google` |
   | `ASK_MODEL` | the provider's model id (for `anthropic` it defaults to `claude-haiku-4-5`) |
   | `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` | the key for the provider you chose |
   | `ASK_DAILY_LIMIT` | optional, global answers per day (default 300) |
   | `ASK_HASH_SALT` | recommended: a long random string, used to hash visitor IPs for rate limiting (hashes rotate daily). Without it, the Upstash token or a per-instance random value is used |

2. Add the same variables in **Vercel → Project → Settings → Environment Variables** (Production and Preview), then redeploy.
   - Never give a key a `NEXT_PUBLIC_` prefix. Keys are read only in `lib/ask/provider.js`, on the server.

3. **Set a spending limit with your AI provider** (in the provider's billing dashboard) before deploying. The app caps usage at 8 questions per visitor per 10 minutes and `ASK_DAILY_LIMIT` per day, and answers are capped at about 350 output tokens. A hard limit at the provider is still the only real protection for your bill.

4. Optional: shared rate limits with **Upstash Redis**. Create a free Upstash Redis database and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Without them, an in-memory limiter is used. That is best-effort on serverless: each warm instance counts separately (so the daily cap is per instance) and resets on a cold start. If Redis is slow or down, the in-memory limiter takes over.

   `/api/ask` only accepts same-site JSON requests, so other websites can't spend your question budget from their visitors' browsers. For extra protection against scripted abuse, you can add a Vercel Firewall rate-limit rule for `/api/ask`.

5. Run `npm run eval:ask` with the key set to run the full answer checks. Without a key it still checks retrieval and the guard. It writes `evals/results.json`, and `/lab/ask` shows those numbers. Commit the new results. The evals never use Upstash, even when it's configured.

For UI work without a key, `ASK_PROVIDER=mock npm run dev` streams fake answers. It only works in development and is never used by the evals.

The site doesn't store or log questions or IP addresses; the question and the passages are sent to the AI provider to write the answer. The knowledge base is rebuilt from `content/` on every build (`npm run knowledge`).
