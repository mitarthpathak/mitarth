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

The home page has a real terminal (`#terminal`). Every command works without any setup. `ask "<question>"` needs an AI provider; without one it replies "AI is offline in this build" and links the closest pages.

1. Copy `.env.example` to `.env.local` (git-ignored) and fill in:

   | Variable | What |
   |---|---|
   | `ASK_PROVIDER` | `openai`, `anthropic` or `google` |
   | `ASK_MODEL` | the provider's model id (for `anthropic` it defaults to `claude-haiku-4-5`) |
   | `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` | the key for the provider you chose |
   | `ASK_DAILY_LIMIT` | optional, global answers per day (default 300) |
   | `ASK_HASH_SALT` | optional, salt for hashing visitor IPs before rate limiting |

2. Add the same variables in **Vercel → Project → Settings → Environment Variables** (Production and Preview), then redeploy.
   - Never give a key a `NEXT_PUBLIC_` prefix. Keys are read only in `lib/ask/provider.js`, on the server.

3. **Set a spending limit with your AI provider** (in the provider's billing dashboard) before deploying. The app caps usage at 8 questions per visitor per 10 minutes and `ASK_DAILY_LIMIT` per day, and answers are capped at about 350 output tokens. A hard limit at the provider is still the only real protection for your bill.

4. Optional: shared rate limits with **Upstash Redis**. Create a free Upstash Redis database and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Without them, an in-memory limiter is used. That is best-effort on serverless: each warm instance counts separately and resets on a cold start.

5. Run `npm run eval:ask` with the key set to run the full answer checks. It writes `evals/results.json`, and `/lab/ask` shows those numbers. Commit the new results.

Questions and IP addresses are not stored. The knowledge base is rebuilt from `content/` on every build (`npm run knowledge`).
