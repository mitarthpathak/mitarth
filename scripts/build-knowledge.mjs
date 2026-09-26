// Builds the knowledge base for the "ask about my work" agent.
//
// Chunks content/profile.js and every case-study section of
// content/projects.js into passages of roughly 80–200 words. Each chunk is
// { id, title, text, url, command? } where url is the exact page anchor the
// passage comes from (e.g. /work/devtask#architecture); profile facts point
// at the GitHub profile they come from, plus the terminal command that shows
// them. Writes lib/ask/knowledge.json.
//
// The case studies are written in Mitarth's own voice. Passages are turned
// into the third person here, so the model never reads "I built…" as its own
// voice; the build fails if any first person, or any phone number, is left.
//
// Also writes lib/stack-versions.json: the site's own dependencies as
// actually installed (what `npm ls --depth=0` prints), for the IDE pane; and
// lib/site-files.json: whether public/resume.pdf exists, for `resume`.
//
// Runs from `prebuild` and via `npm run knowledge`.

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { projects, sectionOrder } = await import(pathToFileURL(join(root, "content/projects.js")).href);
const { profile, projectsForSkill } = await import(pathToFileURL(join(root, "content/profile.js")).href);
const { hasPhoneNumber } = await import(pathToFileURL(join(root, "lib/ask/guard.js")).href);

const MAX_WORDS = 200;
const PROFILE_URL = "https://github.com/mitarthpathak";

const words = (s) => s.split(/\s+/).filter(Boolean).length;
const stripTicks = (s) => s.replace(/`([^`]+)`/g, "$1");
// Source titles in the third person ("DevTask — What he built").
const THIRD_PERSON_LABEL = { role: "Mitarth's role", built: "What he built", learned: "What he learned" };
const sectionLabel = Object.fromEntries(sectionOrder.map((s) => [s.id, THIRD_PERSON_LABEL[s.id] ?? s.label]));

// First person → third person. Past-tense verbs don't change ("I built" →
// "he built"); anything this can't rewrite safely fails the build below.
const PAST = /^(\w+ed|built|wrote|chose|made|kept|went|found|ran|put|set|got|took|gave|spent|split|left|read|saw|knew|thought|did|had|was|learnt|began|brought|taught|won|lost|led|sent|shipped)$/i;
function toThirdPerson(text) {
  return text
    .replace(/\bI (\w+)/g, (m, verb, offset) => {
      if (!PAST.test(verb)) return m;
      const sentenceStart = offset === 0 || /[.!?:]\s*$/.test(text.slice(0, offset));
      return `${sentenceStart ? "Mitarth" : "he"} ${verb}`;
    })
    .replace(/\bon my own\b/g, "on his own")
    .replace(/\bmyself\b/g, "himself")
    .replace(/\bmy\b/g, "his")
    .replace(/\bMy\b/g, "His")
    .replace(/\bme\b/g, "him");
}
const FIRST_PERSON = /\b(I|I'm|I've|I'd|I'll|my|My|me|mine|myself)\b/;

// Split text that is too long at sentence boundaries into ≤ MAX_WORDS parts.
function split(text) {
  if (words(text) <= MAX_WORDS) return [text];
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [text];
  const parts = [];
  let current = "";
  for (const s of sentences) {
    if (current && words(current + s) > MAX_WORDS) {
      parts.push(current.trim());
      current = "";
    }
    current += s;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

// Section-level search keywords: the same words for every project's section
// of that type (never tuned to a single question). Indexed for retrieval
// only; the model sees just `title` and `text`.
const KEYWORDS = {
  problem: "problem why motivation goal need users",
  role: "role team who built worked contribution collaborators responsibilities",
  built: "features what built does product",
  endpoints: "api endpoints routes rest http methods",
  ai: "ai model llm prompt data training approach",
  quality: "quality evaluation tested checks limits limitations safety guardrails disclaimer",
  architecture: "architecture how it works components system design stack diagram",
  decisions: "decisions choices why trade-offs tradeoffs",
  results: "results outcome impact status live deployed",
  learned: "learned lessons learnings takeaways next",
  profile: "about bio who background based location lives city from",
  experience: "experience work job internship company education college degree studying",
  skills: "skills languages frameworks tools technologies stack",
  contact: "contact email linkedin github reach hire",
};

const chunks = [];
function add(id, title, text, url, kind, command) {
  const parts = split(toThirdPerson(stripTicks(text.replace(/\s+/g, " ").trim())));
  parts.forEach((part, i) => {
    chunks.push({
      id: parts.length > 1 ? `${id}-${i + 1}` : id,
      title,
      text: part,
      url,
      ...(command ? { command } : {}),
      keywords: KEYWORDS[kind] ?? "",
    });
  });
}

// ---- Profile ----
add(
  "profile-summary",
  "GitHub profile — About",
  `${profile.summary} He lives in ${profile.location}. His stated focus areas are ${profile.focus.join(", ")}.`,
  PROFILE_URL,
  "profile",
  "about"
);

add(
  "profile-experience",
  "GitHub profile — Experience",
  `Mitarth Pathak's experience, as listed on his GitHub profile. ` +
    profile.experience
      .map((e) => `${e.role} at ${e.company} (${e.period}, ${e.location}).${e.note ? " " + e.note : ""}`)
      .join(" ") +
    ` Education: ${profile.education.degree} at ${profile.education.school}.`,
  PROFILE_URL,
  "experience",
  "experience"
);

const groups = [...new Set(profile.skills.map((s) => s.group))];
add(
  "profile-skills",
  "GitHub profile — Skills",
  `Mitarth Pathak's skills, each with the projects that use it. ` +
    groups
      .map((g) => {
        const list = profile.skills
          .filter((s) => s.group === g)
          .map((s) => {
            const used = projectsForSkill(s);
            return used.length ? `${s.name} (${used.join(", ")})` : s.name;
          });
        return `${g}: ${list.join("; ")}.`;
      })
      .join(" ") +
    ` Tools he uses: ${profile.tools.join(", ")}.`,
  PROFILE_URL,
  "skills",
  "skills"
);

add(
  "profile-contact",
  "GitHub profile — Contact",
  `Mitarth Pathak can be contacted by email at ${profile.links.emailAddress}, on LinkedIn at ${profile.links.linkedin} and on GitHub at ${profile.links.github}. The terminal's contact command prints these links.`,
  PROFILE_URL,
  "contact",
  "contact"
);

// ---- Case studies, one or more chunks per section ----
for (const p of projects) {
  const base = `/work/${p.slug}`;
  const lead = `${p.title} (${p.date}): ${p.oneLiner}`;
  const t = (id) => `${p.title} — ${sectionLabel[id]}`;

  // Short sections carry the project's summary or stack as context, so every
  // passage is readable on its own and lands near the 80-word floor.
  add(`${p.slug}-problem`, t("problem"), `${lead} The problem: ${p.problem} What it does: ${p.summary}`, `${base}#problem`, "problem");
  add(`${p.slug}-role`, t("role"), `${lead} Mitarth's role: ${p.myRole} Role: ${p.roleShort}. Year: ${p.year}. Stack: ${p.stack.join(", ")}. Status: ${p.status}.`, `${base}#role`, "role");

  let built = `${lead} ${p.summary} Stack: ${p.stack.join(", ")}. Features: ${p.features.join(" ")}`;
  if (p.products) built += " Products: " + p.products.map((x) => `${x.name}: ${x.text}`).join(" ");
  add(`${p.slug}-built`, t("built"), built, `${base}#built`, "built");

  if (p.endpoints) {
    add(
      `${p.slug}-endpoints`,
      `${p.title} — Endpoints`,
      `${p.title} REST endpoints: ` + p.endpoints.map((e) => `${e.method} ${e.path} (${e.auth ? "needs a Bearer token" : "public"}): ${e.note}.`).join(" "),
      `${base}#built`,
      "endpoints"
    );
  }

  if (p.ai) {
    // Two focused passages rather than one long one: how it works, then how
    // it was checked and where it stops.
    const ai = p.ai;
    add(
      `${p.slug}-ai`,
      `${p.title} — How the AI works`,
      `${p.title} AI details. Model and approach: ${ai.approach} Data: ${ai.data}`,
      `${base}#built`,
      "ai"
    );
    add(
      `${p.slug}-ai-limits`,
      `${p.title} — AI quality, limits and safety`,
      `${p.title} AI quality and limits. How quality was checked: ${ai.quality} Limits: ${ai.limits}${ai.safety ? " Safety guardrails: " + ai.safety : ""}`,
      `${base}#built`,
      "quality"
    );
  }

  const nodeName = (id) => p.architecture.nodes.find((n) => n.id === id)?.label ?? id;
  add(
    `${p.slug}-architecture`,
    t("architecture"),
    `${lead} Architecture: ${p.architecture.text} Components: ${p.architecture.nodes.map((n) => `${n.label} (${n.note})`).join(", ")}. Connections: ${p.architecture.edges.map(([a, b, l]) => `${nodeName(a)} to ${nodeName(b)} via ${l}`).join("; ")}.`,
    `${base}#architecture`,
    "architecture"
  );

  add(
    `${p.slug}-decisions`,
    t("decisions"),
    `${p.title} key decisions. ` + p.decisions.map((d) => `Decision: ${d.decision} Why: ${d.why} Trade-off: ${d.tradeoff}`).join(" "),
    `${base}#decisions`,
    "decisions"
  );

  add(`${p.slug}-results`, t("results"), `${lead} ${p.summary} Results: ${p.results.join(" ")} Status: ${p.status}. Links: ${[p.links.live, ...p.links.code.map((c) => c.href)].filter(Boolean).join(", ")}.`, `${base}#results`, "results");
  add(`${p.slug}-learned`, t("learned"), `${lead} What Mitarth learned building ${p.title}: ${p.learnings.join(" ")}`, `${base}#learned`, "learned");
}

// Guards: no phone numbers, and no first person, may enter the knowledge base.
for (const c of chunks) {
  for (const field of ["title", "text", "url"]) {
    if (hasPhoneNumber(c[field])) throw new Error(`Chunk ${c.id} (${field}) looks like it contains a phone number.`);
  }
  const fp = c.text.match(new RegExp(`[^.!?]*${FIRST_PERSON.source}[^.!?]*`));
  if (fp) throw new Error(`Chunk ${c.id} is still in the first person; rewrite it in content/ or extend toThirdPerson: "${fp[0].trim()}"`);
}

await mkdir(join(root, "lib/ask"), { recursive: true });
await writeFile(join(root, "lib/ask/knowledge.json"), JSON.stringify({ chunks }, null, 2) + "\n");

// ---- Installed versions of the site's own stack (npm ls --depth=0) ----
const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const names = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})].sort();
const versions = {};
for (const name of names) {
  try {
    const installed = JSON.parse(await readFile(join(root, "node_modules", name, "package.json"), "utf8"));
    versions[name] = installed.version;
  } catch {
    versions[name] = (pkg.dependencies?.[name] ?? pkg.devDependencies?.[name]).replace(/^[\^~]/, "");
  }
}
await writeFile(join(root, "lib/stack-versions.json"), JSON.stringify({ name: pkg.name, version: pkg.version, versions }, null, 2) + "\n");

// ---- Files the terminal can link to (checked here, so it never probes for them) ----
const exists = (path) =>
  access(join(root, path)).then(
    () => true,
    () => false
  );
await writeFile(
  join(root, "lib/site-files.json"),
  JSON.stringify({ resume: (await exists("public/resume.pdf")) ? "/resume.pdf" : null }, null, 2) + "\n"
);

const counts = chunks.map((c) => words(c.text));
console.log(
  `knowledge: ${chunks.length} chunks, ${Math.min(...counts)}–${Math.max(...counts)} words (median ${counts.sort((a, b) => a - b)[Math.floor(counts.length / 2)]}) → lib/ask/knowledge.json`
);
