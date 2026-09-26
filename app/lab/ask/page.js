import Link from "next/link";
import SignatureSVG from "../../components/SignatureSVG";
import ArchitectureDiagram from "../../components/case/ArchitectureDiagram";
import { RULES } from "../../../lib/ask/system-prompt.js";
import { MAX_LEN, MIN_LEN } from "../../../lib/ask/guard.js";
import { PER_IP_LIMIT, DAILY_LIMIT } from "../../../lib/ask/rate-limit.js";
import results from "../../../evals/results.json" with { type: "json" };
import knowledge from "../../../lib/ask/knowledge.json" with { type: "json" };
import "../../work/case-study.css";
import "./lab.css";

export const metadata = {
  title: "How the terminal answers — Mitarth Pathak",
  description:
    "How the portfolio terminal's ask agent works: validation and a guard, rate limits, lexical retrieval over the site's own content, a model that must cite its sources, and the latest eval results.",
  alternates: { canonical: "/lab/ask" },
  openGraph: { url: "/lab/ask", title: "How the terminal answers — Mitarth Pathak" },
};

const PIPELINE = {
  nodes: [
    { id: "q", label: "Question", note: `same-site JSON · ${MIN_LEN}–${MAX_LEN} characters` },
    { id: "guard", label: "Validation + guard", note: "injection, role-play & phone → fixed refusal" },
    { id: "retrieve", label: "Retrieval", note: `BM25 over ${knowledge.chunks.length} passages · top 5 · nothing close → "not covered"` },
    { id: "limit", label: "Rate limit", note: `${PER_IP_LIMIT} / 10 min per visitor · ${DAILY_LIMIT} / day` },
    { id: "model", label: "Model", note: "numbered passages only · stopped past 150 words" },
    { id: "sources", label: "Validated sources", note: "only ids it was given · numbers masked" },
  ],
  edges: [
    ["q", "guard", "JSON"],
    ["guard", "retrieve", "clean text"],
    ["retrieve", "limit", "relevant"],
    ["limit", "model", "5 passages + profile"],
    ["model", "sources", "streamed answer"],
  ],
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

const pct = (n) => `${(n * 100).toFixed(n === 1 ? 0 : 1)}%`;

export default function LabAskPage() {
  const r = results;
  const a = r.answers;
  const g = r.guard;
  const totalCases = r.cases.answerable + r.cases.unanswerable + r.cases.adversarial;

  return (
    <div className="cs-page">
      <header className="cs-topbar">
        <Link href="/#terminal" className="cs-back">
          <span aria-hidden="true">←</span> Terminal
        </Link>
        <Link href="/" className="cs-sig" aria-label="Mitarth Pathak — home">
          <SignatureSVG strokeWidth="16" />
        </Link>
        <p className="cs-count" aria-hidden="true">
          lab / ask
        </p>
      </header>

      <main id="main" className="cs-frame">
        <section className="cs-hero" aria-labelledby="lab-title">
          <p className="cs-label cs-eyebrow">How it works</p>
          <h1 id="lab-title" className="cs-title">
            How the terminal answers
          </h1>
          <p className="cs-oneliner">
            <code className="lab-code">ask</code> answers questions about my work from this site&apos;s own content, and
            shows where every answer came from.
          </p>
        </section>

        <div className="lab-body">
          <section className="cs-section" aria-labelledby="what-title">
            <p className="cs-label">01 — What it is</p>
            <h2 id="what-title" className="cs-h2">
              A small, grounded agent
            </h2>
            <p>
              The case studies and my profile are split into {knowledge.chunks.length} short passages at build time, each
              tied to the exact page section it came from. A question is matched against them with lexical search, and the
              model gets only the best five plus a short profile summary. It must cite them as [1], [2]… The server then
              keeps only citations that point at passages it actually sent, and those become the links under the answer.
            </p>
            <p>
              No vector database and no extra infrastructure: at this size, keyword search (BM25) is fast, predictable and
              easy to evaluate.
            </p>
            <p>
              Privacy: this site doesn&apos;t store or log questions or IP addresses. Rate limiting uses a salted hash of the
              IP that changes every day. To write an answer, the question and the passages are sent to the AI provider,
              whose own data policy applies.
            </p>
          </section>

          <section className="cs-section" aria-labelledby="pipeline-title">
            <p className="cs-label">02 — Pipeline</p>
            <h2 id="pipeline-title" className="cs-h2">
              From question to sources
            </h2>
            <ArchitectureDiagram title="Ask agent" nodes={PIPELINE.nodes} edges={PIPELINE.edges} />
            <p className="cs-note">
              Without an API key the pipeline stops before the rate limit (nothing can be spent): the terminal says the AI
              is offline, quotes the closest passage and links the closest pages. Every other command keeps working. The
              daily cap is shared across all servers when Upstash Redis is configured; without it, each server instance
              counts on its own.
            </p>
          </section>

          <section className="cs-section" aria-labelledby="rules-title">
            <p className="cs-label">03 — Rules</p>
            <h2 id="rules-title" className="cs-h2">
              What the model is told
            </h2>
            <ol className="lab-rules">
              {RULES.map((rule) => (
                <li key={rule}>{rule.replace(/`/g, "")}</li>
              ))}
            </ol>
          </section>

          <section className="cs-section" aria-labelledby="evals-title">
            <p className="cs-label">04 — Evals</p>
            <h2 id="evals-title" className="cs-h2">
              Latest results
            </h2>
            <p className="lab-meta">
              Run on {formatDate(r.date)} ·{" "}
              {r.mode === "full" ? <>model {r.model}</> : <>retrieval and guard only, no model</>} · {totalCases} cases
            </p>
            {r.mode !== "full" && (
              <p className="lab-callout">
                No API key was configured when these evals ran, so no answer has been checked yet: only retrieval (the{" "}
                {r.cases.answerable} answerable questions) and the guard (all {totalCases}). The answer checks (citations,
                &ldquo;don&apos;t know&rdquo;, rule-breaking) run as soon as a key is set.
              </p>
            )}
            <dl className="lab-stats">
              <div>
                <dt>Retrieval recall@5</dt>
                <dd>
                  {pct(r.retrieval.recallAt5)}
                  <span>
                    {r.retrieval.hits}/{r.retrieval.total} answerable questions have an expected source in the top 5
                  </span>
                </dd>
              </div>
              <div>
                <dt>Retrieval time</dt>
                <dd>
                  {r.retrieval.medianMs < 1 ? "< 1 ms" : `${r.retrieval.medianMs} ms`}
                  <span>median per question</span>
                </dd>
              </div>
              {g && (
                <>
                  <div>
                    <dt>Ordinary questions refused</dt>
                    <dd>
                      {g.ordinaryRefusedByGuard.length}/{g.ordinaryTotal}
                      <span>answerable and unanswerable questions the guard wrongly stopped</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Attacks stopped early</dt>
                    <dd>
                      {g.adversarialBlocked}/{g.adversarialTotal}
                      <span>adversarial cases refused before the model; the rest face its rules</span>
                    </dd>
                  </div>
                </>
              )}
              {a && (
                <>
                  <div>
                    <dt>Answerable</dt>
                    <dd>
                      {a.answerable.passed}/{a.answerable.total}
                      <span>cite an expected source</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Unanswerable</dt>
                    <dd>
                      {a.unanswerable.passed}/{a.unanswerable.total}
                      <span>say they don&apos;t know</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Adversarial</dt>
                    <dd>
                      {a.adversarial.passed}/{a.adversarial.total}
                      <span>break no rule (no leak, no phone, third person, ≤ 120 words)</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Median latency</dt>
                    <dd>
                      {(a.medianLatencyMs / 1000).toFixed(1)} s<span>full answer, model calls only</span>
                    </dd>
                  </div>
                </>
              )}
            </dl>
            {r.retrieval.rows && (
              <div className="lab-table-wrap">
                <table className="lab-table">
                  <caption className="sr-only">Retrieval rank of the first expected source, per question</caption>
                  <thead>
                    <tr>
                      <th scope="col">Question</th>
                      <th scope="col">Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.retrieval.rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.question}</td>
                        <td>{row.rank ?? "miss"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="cs-note">
              These are {r.cases.answerable}{" "}hand-written questions for a small site, and a case passes when an expected
              section is anywhere in the top 5. Read 100% as &ldquo;retrieval isn&apos;t the weak link here&rdquo;, not as a
              benchmark. Cases live in <code className="lab-code">evals/ask-cases.json</code> ({r.cases.answerable}{" "}
              answerable, {r.cases.unanswerable} unanswerable, {r.cases.adversarial} adversarial) and run with{" "}
              <code className="lab-code">npm run eval:ask</code>. A failing case is fixed in the system, never by editing
              the case.
            </p>
          </section>
        </div>

        <nav className="cs-next-wrap" aria-label="Back to the terminal">
          <Link href="/#terminal" className="cs-next lab-next">
            <span className="cs-label">
              Try it <span aria-hidden="true">→</span>
            </span>
            <span className="cs-next-body">
              <span className="cs-next-title">Ask the terminal</span>
              <span className="cs-next-line">Run a command, or ask about a project.</span>
            </span>
          </Link>
        </nav>
      </main>

      <footer className="cs-footer">
        <p className="cs-footer-by">
          <span>Built by Mitarth Pathak</span>
          <a href="mailto:mpathak6207@gmail.com">mpathak6207@gmail.com</a>
        </p>
        <Link href="/" className="cs-back">
          <span aria-hidden="true">←</span> Home
        </Link>
      </footer>
    </div>
  );
}
