// Lexical retrieval over the knowledge base (see DECISIONS.md for why BM25
// and not embeddings at this size). MiniSearch indexes title and text (plus
// section-level keywords), with the title boosted and light fuzzy + prefix
// matching. The index is built once per server instance; a query takes well
// under a millisecond.

import MiniSearch from "minisearch";
import knowledge from "./knowledge.json" with { type: "json" };

export const PROFILE_SUMMARY_ID = "profile-summary";
export const TOP_K = 5;

const STOP = new Set(
  "a an and are as at be but by can did do does for from had has have he her his how i in is it its me my of on or our she so that the their them they this to was were what when where which who why will with you your mitarth mitarths pathak pathaks tell about please".split(" ")
);

const chunks = knowledge.chunks;
const byId = new Map(chunks.map((c) => [c.id, c]));

const index = new MiniSearch({
  fields: ["title", "text", "keywords"],
  storeFields: ["id"],
  processTerm: (term) => {
    const t = term.toLowerCase().replace(/[’']s$/, "");
    return t.length < 2 || STOP.has(t) ? null : t;
  },
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

export function allChunks() {
  return chunks;
}
