// Lexical retrieval over the knowledge base. At ~40 short passages, BM25 is
// fast, deterministic and easy to evaluate, with no embeddings or vector
// store (see /lab/ask). MiniSearch indexes title and text (plus section-level
// keywords), with the title boosted and light fuzzy + prefix matching. The
// index is built once per server instance; a query takes about a millisecond.

import MiniSearch from "minisearch";
import knowledge from "./knowledge.json" with { type: "json" };

export const PROFILE_SUMMARY_ID = "profile-summary";
export const TOP_K = 5;
// Below this BM25 score nothing on the site is about the question ("hi",
// "what is love?"). Every real question in the evals scores above 4.
export const MIN_SCORE = 3;

const STOP = new Set(
  "a an and are as at be but by can did do does for from had has have he her his how i in is it its me my of on or our she so that the their them they this to was were what when where which who why will with you your mitarth mitarths pathak pathaks tell about please".split(" ")
);

const chunks = knowledge.chunks;
const byId = new Map(chunks.map((c) => [c.id, c]));

const processTerm = (term) => {
  const t = term.toLowerCase().replace(/[’']s$/, "");
  return t.length < 2 || STOP.has(t) ? null : t;
};

const index = new MiniSearch({
  fields: ["title", "text", "keywords"],
  storeFields: ["id"],
  processTerm,
  searchOptions: {
    boost: { title: 2, keywords: 1.5 },
    fuzzy: 0.2,
    prefix: true,
    combineWith: "OR",
  },
});
index.addAll(chunks);

/**
 * Returns the top 5 chunks for a question, each with its score, plus the
 * short profile-summary chunk (always included, last if it didn't rank).
 */
export function retrieve(question, k = TOP_K) {
  const hits = index.search(question).slice(0, k);
  const results = hits.map((h) => {
    const { keywords, ...chunk } = byId.get(h.id);
    return { ...chunk, score: Number(h.score.toFixed(3)) };
  });
  if (!results.some((r) => r.id === PROFILE_SUMMARY_ID)) {
    const { keywords, ...summary } = byId.get(PROFILE_SUMMARY_ID);
    results.push({ ...summary, score: 0 });
  }
  return results;
}

/** The words that actually get searched (MiniSearch's tokenizer + stopwords). */
export function queryTerms(question) {
  return question.split(/[\n\r\p{Z}\p{P}]+/u).map(processTerm).filter(Boolean);
}

/**
 * Is anything on the site about this question? A question made only of
 * stopwords ("What does he do?") is about Mitarth in general: the profile
 * summary answers it.
 */
export function hasRelevantPassage(question, passages) {
  if (queryTerms(question).length === 0) return true;
  return passages.some((p) => p.score >= MIN_SCORE);
}
