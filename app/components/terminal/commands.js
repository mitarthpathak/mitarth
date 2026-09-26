// Command table and helpers for the portfolio terminal. Pure data + small
// functions; the React component renders what these describe.

import { projects } from "../../../content/projects.js";

export const COMMANDS = [
  { name: "help", usage: "help", desc: "List every command" },
  { name: "whoami", usage: "whoami", desc: "Who Mitarth is, in one screen" },
  { name: "about", usage: "about", desc: "A short bio" },
  { name: "experience", usage: "experience", desc: "Work experience" },
  { name: "skills", usage: "skills", desc: "Skills, each with the projects that use it" },
  { name: "projects", usage: "projects [--filter]", desc: "Projects with one-liners; filter with --ai, --web, --backend or --mobile" },
  { name: "open", usage: "open <slug>", desc: "Open a case study, e.g. open devtask" },
  { name: "resume", usage: "resume", desc: "Open the résumé (PDF)" },
  { name: "contact", usage: "contact", desc: "Email, LinkedIn and GitHub" },
  { name: "ask", usage: 'ask "<question>"', desc: "Ask the AI about his work; answers cite their sources" },
  { name: "sources", usage: "sources", desc: "Show the last answer's sources again" },
  { name: "how", usage: "how", desc: "How the ask agent works, with eval results" },
  { name: "history", usage: "history", desc: "Commands you've run" },
  { name: "clear", usage: "clear", desc: "Clear the screen (or Ctrl+L)" },
];

export const COMMAND_NAMES = COMMANDS.map((c) => c.name);
export const SLUGS = projects.map((p) => p.slug);
export const FILTERS = ["--ai", "--web", "--backend", "--mobile"];

export const EXAMPLE_CHIPS = ["projects --ai", 'ask "What did Mitarth build with Spring Boot?"', "open yap-render"];
export const MOBILE_CHIPS = ["help", "projects", "contact", 'ask "What is DevTask?"'];

/** Splits `ask "What is X?"` style input into [command, argument string]. */
export function parse(input) {
  const trimmed = input.trim();
  const space = trimmed.search(/\s/);
  if (space === -1) return [trimmed.toLowerCase(), ""];
  const cmd = trimmed.slice(0, space).toLowerCase();
  let rest = trimmed.slice(space + 1).trim();
  if (/^(["“”'])[\s\S]*\1$/.test(rest) || /^[“"][\s\S]*[”"]$/.test(rest)) rest = rest.slice(1, -1).trim();
  return [cmd, rest];
}

export function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

export function nearest(word, options) {
  let best = null;
  let bestD = Infinity;
  for (const o of options) {
    const d = levenshtein(word, o);
    if (d < bestD) {
      best = o;
      bestD = d;
    }
  }
  return bestD <= Math.max(2, Math.floor(word.length / 3)) ? best : null;
}

const QUESTION = /\?$|^(what|who|how|why|when|where|which|does|did|is|are|can|has|tell)\b/i;
export function looksLikeQuestion(text) {
  return QUESTION.test(text.trim()) && text.trim().split(/\s+/).length >= 2;
}

/** Tab completion: returns the completed input, or null. */
export function complete(input) {
  const lower = input.toLowerCase();
  if (!lower.includes(" ")) {
    const matches = COMMAND_NAMES.filter((c) => c.startsWith(lower));
    if (matches.length === 1) return `${matches[0]} `;
    return null;
  }
  const [cmd, arg] = [lower.slice(0, lower.indexOf(" ")), lower.slice(lower.indexOf(" ") + 1)];
  const pool = cmd === "open" ? SLUGS : cmd === "projects" ? FILTERS : [];
  const matches = pool.filter((s) => s.startsWith(arg));
  if (matches.length === 1) return `${cmd} ${matches[0]}`;
  return null;
}

/** Removes citation markers the server reported as invalid. */
export function dropMarkers(text, dropped) {
  if (!dropped?.length) return text;
  return text
    .replace(/\[(\d+(?:\s*,\s*\d+)*)\]/g, (m, g) => {
      const keep = g
        .split(",")
        .map((s) => s.trim())
        .filter((n) => !dropped.includes(Number(n)));
      return keep.length ? `[${keep.join(", ")}]` : "";
    })
    .replace(/\s+([.,;])/g, "$1");
}
