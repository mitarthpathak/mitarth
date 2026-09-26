// Builds the knowledge base for the "ask about my work" agent.
//
// Chunks content/profile.js and every case-study section of
// content/projects.js into passages of roughly 80–200 words. Each chunk is
// { id, title, text, url } where url is the exact page anchor the passage
// comes from (e.g. /work/devtask#architecture). Writes lib/ask/knowledge.json.
//
// Also writes lib/stack-versions.json: the versions of the site's own
// dependencies as actually installed, for the IDE's "Framework & Tools" pane.
//
// Runs from `prebuild` and via `npm run knowledge`.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { projects, sectionOrder } = await import(pathToFileURL(join(root, "content/projects.js")).href);
const { profile, projectsForSkill } = await import(pathToFileURL(join(root, "content/profile.js")).href);

const MAX_WORDS = 200;
const PROFILE_URL = "https://github.com/mitarthpathak";

const words = (s) => s.split(/\s+/).filter(Boolean).length;
const stripTicks = (s) => s.replace(/`([^`]+)`/g, "$1");
const sectionLabel = Object.fromEntries(sectionOrder.map((s) => [s.id, s.label]));

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

const chunks = [];
function add(id, title, text, url) {
  const parts = split(stripTicks(text.replace(/\s+/g, " ").trim()));
  parts.forEach((part, i) => {
    chunks.push({ id: parts.length > 1 ? `${id}-${i + 1}` : id, title, text: part, url });
  });
}

// ---- Profile ----
add("profile-summary", "Mitarth Pathak — Profile", `${profile.summary} He lives in ${profile.location}. His stated focus areas are ${profile.focus.join(", ")}.`, "/");

add(
  "profile-experience",
  "Mitarth Pathak — Experience",
  `Mitarth Pathak's experience, as listed on his GitHub profile. ` +
    profile.experience
      .map((e) => `${e.role} at ${e.company} (${e.period}, ${e.location}).${e.note ? " " + e.note : ""}`)
      .join(" ") +
    ` Education: ${profile.education.degree} at ${profile.education.school}.`,
  PROFILE_URL
);

const groups = [...new Set(profile.skills.map((s) => s.group))];
add(
  "profile-skills",
  "Mitarth Pathak — Skills",
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
  PROFILE_URL
);

add(
  "profile-contact",
  "Mitarth Pathak — Contact",
  `Mitarth Pathak can be contacted by email at ${profile.links.emailAddress}, on LinkedIn at ${profile.links.linkedin} and on GitHub at ${profile.links.github}. The terminal's contact command prints these links.`,
  "/"
);

// ---- Case studies, one or more chunks per section ----
for (const p of projects) {
  const base = `/work/${p.slug}`;
  const lead = `${p.title} (${p.date}): ${p.oneLiner}`;
  const t = (id) => `${p.title} — ${sectionLabel[id]}`;

  // Short sections carry the project's summary or stack as context, so every
  // passage is readable on its own and lands near the 80-word floor.
  add(`${p.slug}-problem`, t("problem"), `${lead} The problem: ${p.problem} What it does: ${p.summary}`, `${base}#problem`);
  add(`${p.slug}-role`, t("role"), `${lead} Mitarth's role: ${p.myRole} Role: ${p.roleShort}. Year: ${p.year}. Stack: ${p.stack.join(", ")}. Status: ${p.status}.`, `${base}#role`);

  let built = `${lead} ${p.summary} Stack: ${p.stack.join(", ")}. Features: ${p.features.join(" ")}`;
  if (p.products) built += " Products: " + p.products.map((x) => `${x.name}: ${x.text}`).join(" ");
  add(`${p.slug}-built`, t("built"), built, `${base}#built`);

  if (p.endpoints) {
    add(
      `${p.slug}-endpoints`,
      `${p.title} — Endpoints`,
      `${p.title} REST endpoints: ` + p.endpoints.map((e) => `${e.method} ${e.path} (${e.auth ? "needs a Bearer token" : "public"}): ${e.note}.`).join(" "),
      `${base}#built`
    );
  }

  if (p.ai) {
    const ai = p.ai;
    add(
      `${p.slug}-ai`,
      `${p.title} — How the AI works`,
      `${p.title} AI details. Model and approach: ${ai.approach} Data: ${ai.data} Quality checks: ${ai.quality} Limits: ${ai.limits}${ai.safety ? " Safety guardrails: " + ai.safety : ""}`,
      `${base}#built`
    );
  }

  const nodeName = (id) => p.architecture.nodes.find((n) => n.id === id)?.label ?? id;
  add(
    `${p.slug}-architecture`,
    t("architecture"),
    `${lead} Architecture: ${p.architecture.text} Components: ${p.architecture.nodes.map((n) => `${n.label} (${n.note})`).join(", ")}. Connections: ${p.architecture.edges.map(([a, b, l]) => `${nodeName(a)} to ${nodeName(b)} via ${l}`).join("; ")}.`,
    `${base}#architecture`
  );

  add(
    `${p.slug}-decisions`,
    t("decisions"),
    `${p.title} key decisions. ` + p.decisions.map((d) => `Decision: ${d.decision} Why: ${d.why} Trade-off: ${d.tradeoff}`).join(" "),
    `${base}#decisions`
  );

  add(`${p.slug}-results`, t("results"), `${lead} ${p.summary} Results: ${p.results.join(" ")} Status: ${p.status}. Links: ${[p.links.live, ...p.links.code.map((c) => c.href)].filter(Boolean).join(", ")}.`, `${base}#results`);
  add(`${p.slug}-learned`, t("learned"), `${lead} What Mitarth learned building ${p.title}: ${p.learnings.join(" ")}`, `${base}#learned`);
}

// Guard: no phone numbers may ever enter the knowledge base.
const PHONE = /(\+?\d[\d\s().-]{8,}\d)/;
for (const c of chunks) {
  const hit = c.text.match(PHONE);
  if (hit && hit[0].replace(/\D/g, "").length >= 10) {
    throw new Error(`Chunk ${c.id} looks like it contains a phone number: ${hit[0]}`);
  }
}

await mkdir(join(root, "lib/ask"), { recursive: true });
await writeFile(join(root, "lib/ask/knowledge.json"), JSON.stringify({ chunks }, null, 2) + "\n");

// ---- Installed versions of the site's own stack ----
const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const wanted = ["next", "react", "react-dom", "gsap", "motion", "three", "@react-three/fiber", "@react-three/drei", "ai", "minisearch", "tailwindcss"];
const versions = {};
for (const name of wanted) {
  if (!pkg.dependencies?.[name] && !pkg.devDependencies?.[name]) continue;
  try {
    const installed = JSON.parse(await readFile(join(root, "node_modules", name, "package.json"), "utf8"));
    versions[name] = installed.version;
  } catch {
    versions[name] = (pkg.dependencies?.[name] ?? pkg.devDependencies?.[name]).replace(/^[\^~]/, "");
  }
}
await writeFile(join(root, "lib/stack-versions.json"), JSON.stringify({ name: pkg.name, versions }, null, 2) + "\n");

const counts = chunks.map((c) => words(c.text));
console.log(
  `knowledge: ${chunks.length} chunks, ${Math.min(...counts)}–${Math.max(...counts)} words (median ${counts.sort((a, b) => a - b)[Math.floor(counts.length / 2)]}) → lib/ask/knowledge.json`
);
