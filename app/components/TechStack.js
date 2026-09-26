"use client";

import { useEffect, useRef, useState } from "react";
import {
  SiTypescript,
  SiJavascript,
  SiHtml5,
  SiCss,
  SiClaude,
  SiPython,
  SiCplusplus,
  SiNextdotjs,
} from "react-icons/si";
import { RiOpenaiFill } from "react-icons/ri";
import { FaJava } from "react-icons/fa6";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Html, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import useIsMobile from "../hooks/useIsMobile";
import stackVersions from "../../lib/stack-versions.json";
import { profile } from "../../content/profile.js";
import { COMMANDS } from "./terminal/commands.js";

const FILE_ICONS = {
  ts: { Icon: SiTypescript, color: "#3178C6" },
  tsx: { Icon: SiTypescript, color: "#3178C6" },
  js: { Icon: SiJavascript, color: "#F7DF1E" },
  jsx: { Icon: SiJavascript, color: "#F7DF1E" },
  java: { Icon: FaJava, color: "#ED8B00" },
  css: { Icon: SiCss, color: "#3A7BC8" },
  html: { Icon: SiHtml5, color: "#E34F26" },
  py: { Icon: SiPython, color: "#3776AB" },
  cpp: { Icon: SiCplusplus, color: "#00599C" },
  next: { Icon: SiNextdotjs, color: "#ffffff" },
};

// Deeper jewel-tone palette for the language graph only — the IDE-mockup file
// icons elsewhere keep their true brand colors via FILE_ICONS.
const LANG_COLORS = {
  js: "#D9A441",
  ts: "#3E63DD",
  next: "#C7CCD6",
  html: "#D2543A",
  css: "#2FA8A0",
  java: "#B5542E",
  py: "#6366B8",
  cpp: "#3E8E63",
};

// Idle edges read as a neutral gray mesh; only the hovered/pinned node's own
// edges pick up their language color (see is-flowing below).
const NEUTRAL_EDGE = "#aab2c2";

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixWith(hex, target, amount) {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c) => Math.round(c + (target - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

const lighten = (hex, amount) => mixWith(hex, 255, amount);

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "svg", "webp"];

function extOf(name) {
  return name.includes(".") ? name.split(".").pop() : "";
}

function FileIcon({ name }) {
  const ext = extOf(name);
  const meta = FILE_ICONS[ext];
  if (meta) {
    const { Icon, color } = meta;
    return <Icon color={color} />;
  }
  if (IMAGE_EXTS.includes(ext)) {
    return <span className="ide-file-image-icon">&#128444;</span>;
  }
  return <span className="ide-file-dot" />;
}

// Real folder shapes taken from each repo's own README/structure section.
const PROJECTS = [
  {
    name: "Swasthya-Neeti",
    entries: [
      { type: "folder", name: "src" },
      { type: "folder", name: "components" },
      { type: "file", name: "App.jsx" },
      { type: "file", name: "index.css" },
      { type: "file", name: "package.json" },
    ],
  },
  {
    name: "Run-Neeti",
    entries: [
      { type: "folder", name: "src" },
      { type: "folder", name: "components" },
      { type: "file", name: "package.json" },
    ],
  },
  {
    name: "Yap-Render",
    entries: [
      { type: "folder", name: "app" },
      { type: "folder", name: "components/avatar" },
      { type: "file", name: "AvatarPlayer.tsx" },
      { type: "file", name: "islTranslator.ts" },
      { type: "file", name: "package.json" },
    ],
  },
  {
    name: "DevTask",
    entries: [
      { type: "folder", name: "controller" },
      { type: "folder", name: "securityConfig" },
      { type: "folder", name: "service" },
      { type: "file", name: "TaskController.java" },
      { type: "file", name: "pom.xml" },
    ],
  },
];

const STACK = [
  {
    label: "Languages",
    featured: "Swasthya-Neeti",
    mode: "ls",
    langMode: "JavaScript",
    files: [
      { name: "App.jsx", add: 48, del: 6 },
      { name: "index.css", add: 12, del: 0 },
    ],
  },
  {
    label: "Backend & Database",
    featured: "DevTask",
    mode: "terminal",
    langMode: "Java",
    files: [
      { name: "TaskController.java", add: 86, del: 4 },
      { name: "SecurityConfig.java", add: 40, del: 2 },
      { name: "pom.xml", add: 6, del: 0 },
    ],
  },
  {
    label: "Framework & Tools",
    featured: "Yap-Render",
    mode: "grid",
    langMode: "TypeScript",
    files: [
      { name: "AvatarPlayer.tsx", add: 12, del: 3 },
      { name: "package.json", add: 4, del: 0 },
    ],
  },
];

const SEGMENTS = STACK.length;

const AGENT_CARDS = [
  {
    title: "yap-render",
    color: "#3fb950",
    branch: "main",
    kind: "agent",
    agentName: "Codex",
    status: "Thinking",
    time: "(18s)",
    activityIcon: "codex",
  },
  {
    title: "devtask",
    color: "#3fb950",
    branch: "fix/readme-repo-polish",
    kind: "agent",
    agentName: "Claude Code",
    status: "Nesting",
    time: "(34s)",
    icon: "claude",
    activityIcon: "claude",
  },
];

// "Framework & Tools" pane: real information only. Versions are the ones
// actually installed, written to lib/stack-versions.json at build time by
// scripts/build-knowledge.mjs; the tools list comes from content/profile.js.
const STACK_LINES = [
  `${stackVersions.name}@${stackVersions.version}`,
  ...Object.entries(stackVersions.versions).map(
    ([name, version], i, all) => `${i === all.length - 1 ? "└──" : "├──"} ${name}@${version}`
  ),
];

// Illustrative source-control list for the IDE mock-up (decorative, like the
// agent cards); pane 03's terminals are the parts that show real data.
const SCM_FILES = [
  { name: "package-lock.json", path: "", status: "M" },
  { name: "package.json", path: "", status: "M" },
  { name: "globals.css", path: "app", status: "M" },
  { name: "page.js", path: "app", status: "M" },
  { name: "TechStack.js", path: "app\\components", status: "U" },
  { name: "devtask.png", path: "public", status: "U" },
  { name: "yap-render.png", path: "public", status: "U" },
];

function TerminalChrome({ name, children, draggable, titlebarProps, bodyClassName, cardClassName }) {
  return (
    <div className={`ide-terminal-card ${draggable ? "is-draggable" : ""} ${cardClassName || ""}`}>
      <div className="ide-terminal-titlebar" {...titlebarProps}>
        <span className="tech-dot tech-dot-red" />
        <span className="tech-dot tech-dot-yellow" />
        <span className="tech-dot tech-dot-green" />
        <span className="ide-terminal-name">{name}</span>
      </div>
      <div className={`ide-terminal-body ${bodyClassName || ""}`}>{children}</div>
    </div>
  );
}

function TermLine({ line }) {
  if (line.cmd) {
    return (
      <div className="term-line">
        <span className="term-prompt">$</span> <span className="term-cmd">{line.cmd}</span>
      </div>
    );
  }
  if (line.ls) {
    return (
      <div className="term-line">
        <div className="ls-row">
          {line.ls.map((f) => {
            const color = FILE_ICONS[extOf(f)]?.color || "rgba(255,255,255,0.55)";
            return (
              <span className="ls-file" style={{ color }} key={f}>
                {f}
              </span>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <div className="term-line">
      <span className="term-out">{line.text}</span>
    </div>
  );
}

// Real data pulled from github.com/mitarthpathak — one repo missed here is one
// missed in the graph, so this mirrors `gh api users/mitarthpathak/repos` + per-repo
// `/languages` exactly (byte counts), except Next.js which GitHub doesn't report
// as a "language" — it's tagged on manually for the mitarth (portfolio) repo.
const LANG_NAME_TO_KEY = {
  JavaScript: "js",
  TypeScript: "ts",
  Java: "java",
  "C++": "cpp",
  Python: "py",
  HTML: "html",
  CSS: "css",
};

const MAJOR_KEYS = ["js", "ts", "next", "html", "css", "java", "py", "cpp"];
const LANG_LABELS = {
  js: "JavaScript",
  ts: "TypeScript",
  next: "Next.js",
  html: "HTML",
  css: "CSS",
  java: "Java",
  py: "Python",
  cpp: "C++",
};
// Both are Next.js apps under the hood — their JS/TS byte counts roll into the
// Next.js node instead of the raw-language nodes.
const NEXTJS_REPOS = ["mitarth", "Swasthya-Neeti"];

const REPO_DATA = [
  { name: "Swasthya-Neeti", label: "Swasthya-Neeti", big: true, langs: { TypeScript: 272040, JavaScript: 120660, CSS: 99984, HTML: 678 } },
  { name: "Run-Neeti", label: "Run-Neeti", big: true, langs: { TypeScript: 127503, JavaScript: 15751, CSS: 1413, HTML: 638 } },
  { name: "DevTask", label: "DevTask", big: true, langs: { Java: 26688 } },
  { name: "mitarth", label: "Mitarth", big: true, langs: { JavaScript: 99645, CSS: 65968, Python: 617 } },
  { name: "yap-render", label: "Yap-Render", big: true, langs: { JavaScript: 505621, TypeScript: 75368, CSS: 41634 } },
  { name: "PeerLink", label: "PeerLink", big: true, langs: { "C++": 29450 } },
  { name: "Cognizant", label: "Cognizant", big: false, langs: { Python: 107615 } },
  { name: "ecom", label: "ecom", big: false, langs: { Java: 7156 } },
  { name: "Lottery---Raffle-Contract", label: "Lottery-Raffle-Contract", big: false, langs: { Rust: 2928, Makefile: 171 } },
  { name: "mitarthpathak", label: "mitarthpathak", big: false, langs: {} },
  { name: "OAuthExample", label: "OAuthExample", big: false, langs: { Java: 2130 } },
  { name: "SAGACITY", label: "SAGACITY", big: false, langs: { TypeScript: 85271, JavaScript: 30239, CSS: 938 }, drop: ["JavaScript"] },
  { name: "ScholarGuru", label: "ScholarGuru", big: false, langs: { HTML: 1293149, CSS: 320760, JavaScript: 194879, TypeScript: 145532, Batchfile: 1189, Shell: 1134 } },
  { name: "spring-security", label: "spring-security", big: false, langs: { Java: 18332 } },
  { name: "SpringJPA", label: "SpringJPA", big: false, langs: { Java: 4352 } },
  { name: "studentManagement", label: "studentManagement", big: false, langs: { Java: 2810 } },
  { name: "yap-render-APP", label: "yap-render-APP", big: false, langs: { JavaScript: 516130, Kotlin: 401299, TypeScript: 17466, HTML: 2358 }, drop: ["JavaScript"] },
  { name: "yap-render-extension", label: "yap-render-extension", big: false, langs: { JavaScript: 548473, CSS: 8046, HTML: 6351 }, drop: ["JavaScript"] },
];

function bytesToRadius(bytes, allBytes, min, max) {
  const lo = Math.log10(min + 1);
  const hi = Math.log10(max + 1);
  const t = hi > lo ? (Math.log10(bytes + 1) - lo) / (hi - lo) : 0.5;
  return round2(15 + t * 19);
}

const GRAPH_CUBE = 640;
const GRAPH_CENTER = { x: 330, y: 240, z: GRAPH_CUBE / 2 };
const WORLD_SCALE = 60;
const LANG_RING = 95;
const BIG_RING = 172;
const SMALL_RING = 224;

function round2(n) {
  return Math.round(n * 100) / 100;
}

function polar(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: round2(cx + r * Math.cos(rad)), y: round2(cy + r * Math.sin(rad)) };
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Stretches the settled node cloud to fill the target cube. X, Y and Z are
// normalized independently (not a single uniform scale) so the cluster
// always uses the full volume instead of leaving empty margins when the
// organic shape doesn't match the cube's proportions — node radii are
// untouched, so spheres stay spheres.
function fitNodesToBounds3D(nodes, size, padding) {
  const axes = ["x", "y", "z"];
  const bounds = {};
  axes.forEach((axis) => {
    const vals = nodes.map((n) => n[axis]);
    bounds[axis] = { min: Math.min(...vals), span: Math.max(Math.max(...vals) - Math.min(...vals), 1) };
  });
  nodes.forEach((n) => {
    axes.forEach((axis) => {
      const { min, span } = bounds[axis];
      const scale = (size - padding * 2) / span;
      n[axis] = round2(padding + (n[axis] - min) * scale);
    });
  });
}

// Force-directed relaxation in real 3D: languages act as heavier cluster hubs,
// repos get pulled toward the languages they use and pushed apart from
// everything else, in x/y/z all at once — a true volumetric node cloud
// instead of a flat graph, like a scene laid out in a 3D app. Seeded PRNG
// keeps the layout identical between server render and client hydration.
function relaxForceLayout(langNodes, projectNodes, edges, center, cube) {
  const rand = mulberry32(20260919);
  const sims = [
    ...langNodes.map((ref) => ({ ref, r: ref.r, mass: 2.2 })),
    ...projectNodes.map((ref) => ({ ref, r: ref.r, mass: ref.big ? 1.5 : 1 })),
  ];
  sims.forEach((n) => {
    // x/y start from the old polar seed (still a good basin to relax from);
    // z has no natural seed, so it starts spread randomly through the cube.
    n.x = n.ref.x + (rand() - 0.5) * 8;
    n.y = n.ref.y + (rand() - 0.5) * 8;
    n.z = center.z + (rand() - 0.5) * cube * 0.5;
  });

  const simByLang = {};
  langNodes.forEach((n, i) => (simByLang[n.key] = sims[i]));
  const simByProject = {};
  projectNodes.forEach((n, i) => (simByProject[n.name] = sims[langNodes.length + i]));

  const links = edges.map((e) => ({
    a: simByProject[e.project],
    b: simByLang[e.key],
    dist: e.big ? 76 : 122,
  }));

  let alpha = 1;
  for (let iter = 0; iter < 420; iter++) {
    for (let i = 0; i < sims.length; i++) {
      for (let j = i + 1; j < sims.length; j++) {
        const a = sims[i];
        const b = sims[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let dz = a.z - b.z;
        let d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < 0.02) {
          dx = rand() - 0.5;
          dy = rand() - 0.5;
          dz = rand() - 0.5;
          d2 = 0.02;
        }
        const d = Math.sqrt(d2);
        const force = (2100 / d2) * alpha;
        const fx = (dx / d) * force;
        const fy = (dy / d) * force;
        const fz = (dz / d) * force;
        a.x += fx / a.mass;
        a.y += fy / a.mass;
        a.z += fz / a.mass;
        b.x -= fx / b.mass;
        b.y -= fy / b.mass;
        b.z -= fz / b.mass;
      }
    }
    links.forEach(({ a, b, dist }) => {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dz = b.z - a.z;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.02;
      const diff = ((d - dist) * 0.035 * alpha) / d;
      const fx = dx * diff;
      const fy = dy * diff;
      const fz = dz * diff;
      a.x += fx / a.mass;
      a.y += fy / a.mass;
      a.z += fz / a.mass;
      b.x -= fx / b.mass;
      b.y -= fy / b.mass;
      b.z -= fz / b.mass;
    });
    sims.forEach((n) => {
      n.x += (center.x - n.x) * 0.012 * alpha;
      n.y += (center.y - n.y) * 0.012 * alpha;
      n.z += (center.z - n.z) * 0.012 * alpha;
    });
    alpha *= 0.988;
  }

  for (let pass = 0; pass < 22; pass++) {
    for (let i = 0; i < sims.length; i++) {
      for (let j = i + 1; j < sims.length; j++) {
        const a = sims[i];
        const b = sims[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.02;
        const minDist = (a.r + b.r) * 1.4 + 12;
        if (d < minDist) {
          const overlap = (minDist - d) / 2;
          const nx = dx / d;
          const ny = dy / d;
          const nz = dz / d;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          a.z -= nz * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;
          b.z += nz * overlap;
        }
      }
    }
  }

  fitNodesToBounds3D(sims, cube, 40);

  sims.forEach((n) => {
    n.ref.x = n.x;
    n.ref.y = n.y;
    n.ref.z = n.z;
  });
}

// Converts a node's simulated x/y/z (pixel-ish units, 0..GRAPH_CUBE) into
// Three.js world-space coordinates centered on the origin. Y is flipped so
// "up" in the data reads as "up" in the 3D scene.
function toWorld(n) {
  const half = GRAPH_CUBE / 2;
  return [
    round2((n.x - half) / WORLD_SCALE),
    round2(-(n.y - half) / WORLD_SCALE),
    round2((n.z - half) / WORLD_SCALE),
  ];
}

function repoMajorEntries(repo) {
  const isNext = NEXTJS_REPOS.includes(repo.name);
  let nextBytes = 0;
  const entries = [];
  for (const [ghName, bytes] of Object.entries(repo.langs)) {
    if (repo.drop?.includes(ghName)) continue;
    const key = LANG_NAME_TO_KEY[ghName];
    if (!key) continue;
    if (isNext && (key === "js" || key === "ts")) {
      nextBytes += bytes;
      continue;
    }
    entries.push([key, bytes]);
  }
  if (isNext) entries.push(["next", nextBytes]);
  return entries;
}

const LANG_TOTALS = MAJOR_KEYS.reduce((acc, key) => {
  acc[key] = REPO_DATA.reduce((sum, repo) => {
    const entry = repoMajorEntries(repo).find(([k]) => k === key);
    return sum + (entry ? entry[1] : 0);
  }, 0);
  return acc;
}, {});

const LANG_TOTAL_VALUES = Object.values(LANG_TOTALS);
const LANG_MIN = Math.min(...LANG_TOTAL_VALUES);
const LANG_MAX = Math.max(...LANG_TOTAL_VALUES);
const LANG_SUM = LANG_TOTAL_VALUES.reduce((a, b) => a + b, 0);

const LANG_NODES = MAJOR_KEYS.map((key, i) => {
  const angle = -90 + i * (360 / MAJOR_KEYS.length);
  const { x, y } = polar(GRAPH_CENTER.x, GRAPH_CENTER.y, LANG_RING, angle);
  const bytes = LANG_TOTALS[key];
  return {
    key,
    name: LANG_LABELS[key],
    angle,
    x,
    y,
    pct: Math.round((bytes / LANG_SUM) * 100),
    r: bytesToRadius(bytes, LANG_TOTAL_VALUES, LANG_MIN, LANG_MAX),
  };
});

const LANG_BY_KEY = LANG_NODES.reduce((acc, n) => ({ ...acc, [n.key]: n }), {});

let bigIdx = 0;
let smallIdx = 0;
const PROJECT_NODES = REPO_DATA.map((repo) => {
  const majorEntries = repoMajorEntries(repo);
  const extra = Object.keys(repo.langs).filter((n) => !LANG_NAME_TO_KEY[n]);
  const dominant = majorEntries.sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  let angle;
  if (repo.big) {
    angle = -60 + bigIdx * (360 / 6);
    bigIdx += 1;
  } else {
    angle = -15 + smallIdx * (360 / 12);
    smallIdx += 1;
  }
  const { x, y } = polar(GRAPH_CENTER.x, GRAPH_CENTER.y, repo.big ? BIG_RING : SMALL_RING, angle);

  return {
    ...repo,
    angle,
    x,
    y,
    r: repo.big ? 7.5 : 3.5,
    majorKeys: majorEntries.map(([key]) => key),
    extra,
    dominant,
    url: `https://github.com/mitarthpathak/${repo.name}`,
  };
});

const PROJECT_BY_NAME = PROJECT_NODES.reduce((acc, n) => ({ ...acc, [n.name]: n }), {});

// Edges carry the actual byte weight of that language inside that repo, so
// line thickness reads as "how much of this repo is this language" — the
// priority signal the graph is drawn from — instead of a flat width.
const GRAPH_EDGES = PROJECT_NODES.flatMap((p) =>
  repoMajorEntries(p).map(([key, bytes]) => ({ project: p.name, key, big: p.big, bytes }))
);

const EDGE_BYTE_VALUES = GRAPH_EDGES.map((e) => e.bytes);
const EDGE_MIN = Math.min(...EDGE_BYTE_VALUES);
const EDGE_MAX = Math.max(...EDGE_BYTE_VALUES);
GRAPH_EDGES.forEach((e) => {
  const lo = Math.log10(EDGE_MIN + 1);
  const hi = Math.log10(EDGE_MAX + 1);
  const t = hi > lo ? (Math.log10(e.bytes + 1) - lo) / (hi - lo) : 0.5;
  e.width = round2(1 + t * 3.6);
});

// Quiet background mesh: languages that co-occur inside the same repo get a
// faint static link between them, so the scene reads as a dense web instead
// of a bare hub-and-spoke — grounded in real data (how often two languages
// actually appear together), not decoration.
const LANG_LINK_COUNTS = new Map();
PROJECT_NODES.forEach((p) => {
  const keys = p.majorKeys;
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const pairKey = [keys[i], keys[j]].sort().join("|");
      LANG_LINK_COUNTS.set(pairKey, (LANG_LINK_COUNTS.get(pairKey) || 0) + 1);
    }
  }
});
const LANG_LINKS = Array.from(LANG_LINK_COUNTS.entries()).map(([pairKey, count]) => {
  const [a, b] = pairKey.split("|");
  return { a, b, count };
});

// Replaces the fixed ring placement above with an organic, clustered 3D layout.
relaxForceLayout(LANG_NODES, PROJECT_NODES, GRAPH_EDGES, GRAPH_CENTER, GRAPH_CUBE);

LANG_NODES.forEach((n) => {
  const [wx, wy, wz] = toWorld(n);
  n.wx = wx;
  n.wy = wy;
  n.wz = wz;
  n.wr = round2(n.r / WORLD_SCALE);
});
PROJECT_NODES.forEach((n) => {
  const [wx, wy, wz] = toWorld(n);
  n.wx = wx;
  n.wy = wy;
  n.wz = wz;
  n.wr = round2(n.r / WORLD_SCALE);
});

// A straight 3D edge between a repo and a language hub. Idle edges are a
// neutral gray; the hovered/pinned node's own edges light up in its
// language color and get an animated dashed "flow" running through them.
function EdgeLine3D({ edge, from, to, isActive, isFocused }) {
  const lineRef = useRef(null);

  useFrame((_, delta) => {
    const material = lineRef.current?.material;
    if (isFocused && material) {
      material.dashOffset -= delta * 1.6;
    }
  });

  return (
    <Line
      ref={lineRef}
      points={[
        [from.wx, from.wy, from.wz],
        [to.wx, to.wy, to.wz],
      ]}
      color={isFocused ? LANG_COLORS[edge.key] : NEUTRAL_EDGE}
      transparent
      opacity={isFocused ? 0.95 : isActive ? 0.4 : 0.05}
      lineWidth={isFocused ? edge.width + 1.3 : edge.width}
      dashed={isFocused}
      dashSize={0.14}
      gapSize={0.1}
    />
  );
}

// Slowly circles the camera around the scene on its own — used instead of
// OrbitControls on touch devices so there's nothing here to capture a
// finger swipe that's actually meant to scroll the page.
function AutoOrbitCamera({ radius = 16, height = 6, speed = 0.12 }) {
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime * speed;
    camera.position.x = Math.sin(t) * radius;
    camera.position.z = Math.cos(t) * radius;
    camera.position.y = height;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// Static, non-interactive thread between two languages that co-occur in a
// repo — always faint, never highlighted. Purely adds background density so
// the scene reads as a real web instead of a bare hub-and-spoke.
function BackgroundLink3D({ a, b, count }) {
  return (
    <Line
      points={[
        [a.wx, a.wy, a.wz],
        [b.wx, b.wy, b.wz],
      ]}
      color={NEUTRAL_EDGE}
      transparent
      opacity={0.08 + Math.min(count, 4) * 0.025}
      lineWidth={0.6}
    />
  );
}

// Billboarded name tag floating just above a node, screen-projected from its
// 3D position so it stays readable at any orbit angle.
function NodeLabel({ position, color, big, children }) {
  return (
    <Html position={position} center distanceFactor={8} style={{ pointerEvents: "none" }}>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: big ? "12px" : "10.5px",
          fontWeight: big ? 700 : 600,
          color,
          whiteSpace: "nowrap",
          textShadow: "0 1px 4px rgba(0,0,0,0.9)",
        }}
      >
        {children}
      </span>
    </Html>
  );
}

function LangSphere3D({ node, isActive, isFocus, onHover, onLeave, onSelect }) {
  const color = LANG_COLORS[node.key];
  return (
    <group>
      <mesh
        position={[node.wx, node.wy, node.wz]}
        scale={isFocus ? 1.12 : 1}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onLeave();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <sphereGeometry args={[node.wr, 32, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.35}
          metalness={0.2}
          emissive={color}
          emissiveIntensity={isFocus ? 0.85 : 0.28}
          transparent
          opacity={isActive ? 1 : 0.18}
        />
      </mesh>
      <NodeLabel
        position={[node.wx, node.wy + node.wr + 0.16, node.wz]}
        color={isActive ? "#ffffff" : "rgba(255,255,255,0.4)"}
        big
      >
        {node.name}
      </NodeLabel>
    </group>
  );
}

function ProjectSphere3D({ node, isActive, isFocus, showLabel, onHover, onLeave, onSelect }) {
  const fillColor =
    node.big && node.dominant
      ? LANG_COLORS[node.dominant]
      : node.dominant
        ? lighten(LANG_COLORS[node.dominant], 0.55)
        : "#c7ccd6";
  const labelColor = node.dominant
    ? lighten(LANG_COLORS[node.dominant], node.big ? 0.32 : 0.18)
    : "rgba(255,255,255,0.6)";

  return (
    <group>
      <mesh
        position={[node.wx, node.wy, node.wz]}
        scale={isFocus ? 1.25 : 1}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onLeave();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <sphereGeometry args={[node.wr, 24, 24]} />
        <meshStandardMaterial
          color={fillColor}
          roughness={0.4}
          metalness={node.big ? 0.25 : 0.05}
          emissive={fillColor}
          emissiveIntensity={isFocus ? 0.9 : node.big ? 0.22 : 0.1}
          transparent
          opacity={isActive ? 1 : 0.15}
        />
      </mesh>
      {showLabel && (
        <NodeLabel position={[node.wx, node.wy + node.wr + 0.1, node.wz]} color={labelColor} big={node.big}>
          {node.label}
        </NodeLabel>
      )}
    </group>
  );
}

function LanguagesPane() {
  const isMobile = useIsMobile();
  const [hovered, setHovered] = useState(null);
  const [pinned, setPinned] = useState(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("network");

  const active = hovered || pinned;

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const searchLangKeys = new Set();
  const searchProjectNames = new Set();
  if (searching) {
    LANG_NODES.forEach((l) => {
      if (l.name.toLowerCase().includes(q)) searchLangKeys.add(l.key);
    });
    PROJECT_NODES.forEach((p) => {
      if (p.label.toLowerCase().includes(q)) searchProjectNames.add(p.name);
    });
    searchProjectNames.forEach((name) =>
      PROJECT_BY_NAME[name].majorKeys.forEach((key) => searchLangKeys.add(key))
    );
    Array.from(searchLangKeys).forEach((key) =>
      PROJECT_NODES.forEach((p) => {
        if (p.majorKeys.includes(key)) searchProjectNames.add(p.name);
      })
    );
  }

  const selectLang = (key) => setPinned((p) => (p?.type === "lang" && p.key === key ? null : { type: "lang", key }));
  const selectProject = (name) =>
    setPinned((p) => (p?.type === "project" && p.name === name ? null : { type: "project", name }));
  const hoverLang = (key) => setHovered({ type: "lang", key });
  const hoverProject = (name) => setHovered({ type: "project", name });
  const clearHover = () => setHovered(null);

  const langActive = (key) => {
    if (searching) return searchLangKeys.has(key);
    return (
      !active ||
      (active.type === "lang" && active.key === key) ||
      (active.type === "project" && PROJECT_BY_NAME[active.name].majorKeys.includes(key))
    );
  };

  const projectActive = (name) => {
    if (searching) return searchProjectNames.has(name);
    return (
      !active ||
      (active.type === "project" && active.name === name) ||
      (active.type === "lang" && PROJECT_BY_NAME[name].majorKeys.includes(active.key))
    );
  };

  const edgeActive = (edge) => {
    if (searching) return searchLangKeys.has(edge.key) && searchProjectNames.has(edge.project);
    return (
      !active ||
      (active.type === "lang" && active.key === edge.key) ||
      (active.type === "project" && active.name === edge.project)
    );
  };

  const edgeFocused = (edge) => !!active && edgeActive(edge);

  const detail = (() => {
    if (active?.type === "lang") {
      const s = LANG_BY_KEY[active.key];
      const usedIn = PROJECT_NODES.filter((p) => p.majorKeys.includes(active.key));
      return {
        title: s.name,
        rows: [
          ["Share of repos", `${s.pct}%`],
          ["Used in", `${usedIn.length} project${usedIn.length === 1 ? "" : "s"}`],
        ],
        chips: usedIn.map((p) => p.label),
        link: null,
      };
    }
    if (active?.type === "project") {
      const p = PROJECT_BY_NAME[active.name];
      return {
        title: p.label,
        rows: [
          ["Languages", `${p.majorKeys.length + p.extra.length}`],
          ["Tier", p.big ? "Featured" : "Repo"],
        ],
        chips: [
          ...p.majorKeys.map((key) => LANG_BY_KEY[key].name),
          ...(NEXTJS_REPOS.includes(p.name) ? [] : p.extra),
        ],
        link: p.url,
      };
    }
    return {
      title: "mitarthpathak/*",
      rows: [
        ["Languages", `${LANG_NODES.length}`],
        ["Repos", `${PROJECT_NODES.length}`],
        ["Primary", LANG_NODES.slice().sort((a, b) => b.pct - a.pct)[0].name],
      ],
      chips: [],
      link: "https://github.com/mitarthpathak?tab=repositories",
    };
  })();

  return (
    <div className="lang-graph">
      <div className="lang-graph-header">
        <label className="lang-graph-search">
          <span className="lang-graph-search-icon">&#9906;</span>
          <input
            type="text"
            className="lang-graph-search-input"
            placeholder="Find language, repo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        <span className="lang-graph-filters">Filters &#9662;</span>
        <div className="lang-graph-tabs">
          <span
            className={`lang-graph-tab ${tab === "network" ? "is-active" : ""}`}
            onClick={() => setTab("network")}
          >
            Network
          </span>
          <span
            className={`lang-graph-tab ${tab === "list" ? "is-active" : ""}`}
            onClick={() => setTab("list")}
          >
            List
          </span>
        </div>
        <span className="lang-graph-info">&#8505;</span>
      </div>

      <div className="lang-graph-body">
        <div className="lang-graph-sidebar">
          <p className="lang-graph-group-label">Languages ({LANG_NODES.length})</p>
          {LANG_NODES.map((s) => (
            <div
              key={s.key}
              className={`lang-graph-row ${langActive(s.key) ? "" : "is-dim"} ${active?.type === "lang" && active.key === s.key ? "is-focus" : ""}`}
              onMouseEnter={() => hoverLang(s.key)}
              onMouseLeave={clearHover}
              onClick={() => selectLang(s.key)}
            >
              <span className="lang-graph-row-dot" style={{ background: LANG_COLORS[s.key] }} />
              <span className="lang-graph-row-name">{s.name}</span>
              <span className="lang-graph-row-bar">
                <span
                  className="lang-graph-row-bar-fill"
                  style={{ width: `${s.pct}%`, background: LANG_COLORS[s.key] }}
                />
              </span>
              <span className="lang-graph-row-pct">{s.pct}%</span>
            </div>
          ))}

          <p className="lang-graph-group-label lang-graph-group-label-spaced">
            Repos ({PROJECT_NODES.length})
          </p>
          {PROJECT_NODES.map((p) => (
            <div
              key={p.name}
              className={`lang-graph-row ${projectActive(p.name) ? "" : "is-dim"} ${p.big ? "is-big-row" : ""} ${active?.type === "project" && active.name === p.name ? "is-focus" : ""}`}
              onMouseEnter={() => hoverProject(p.name)}
              onMouseLeave={clearHover}
              onClick={() => selectProject(p.name)}
            >
              <span className="ide-folder-dot" />
              <span className="lang-graph-row-name">{p.label}</span>
              <span className="lang-graph-row-chips">
                {p.majorKeys.map((key) => (
                  <span key={key} className="lang-graph-row-chipdot" style={{ background: LANG_COLORS[key] }} />
                ))}
              </span>
            </div>
          ))}
        </div>

        <div className="lang-graph-canvas" style={{ cursor: isMobile ? "default" : "grab" }}>
          <Canvas
            camera={{ position: [9, 6, 13], fov: 40 }}
            gl={{ alpha: true, antialias: !isMobile }}
            dpr={isMobile ? 1 : [1, 2]}
            onPointerMissed={() => setPinned(null)}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[6, 9, 7]} intensity={0.95} />
            <pointLight position={[-7, -4, -5]} intensity={0.4} color="#5b7cff" />
            <pointLight position={[4, -6, 6]} intensity={0.25} color="#ff9d5b" />

            <Stars radius={40} depth={30} count={isMobile ? 450 : 1400} factor={2.4} saturation={0} fade speed={0.4} />

            {LANG_LINKS.map((link, i) => (
              <BackgroundLink3D key={i} a={LANG_BY_KEY[link.a]} b={LANG_BY_KEY[link.b]} count={link.count} />
            ))}

            {GRAPH_EDGES.map((edge, i) => {
              const from = PROJECT_BY_NAME[edge.project];
              const to = LANG_BY_KEY[edge.key];
              return (
                <EdgeLine3D
                  key={i}
                  edge={edge}
                  from={from}
                  to={to}
                  isActive={edgeActive(edge)}
                  isFocused={edgeFocused(edge)}
                />
              );
            })}

            {PROJECT_NODES.map((p) => (
              <ProjectSphere3D
                key={p.name}
                node={p}
                isActive={projectActive(p.name)}
                isFocus={active?.type === "project" && active.name === p.name}
                showLabel={p.big || (active?.type === "project" && active.name === p.name)}
                onHover={() => hoverProject(p.name)}
                onLeave={clearHover}
                onSelect={() => selectProject(p.name)}
              />
            ))}

            {LANG_NODES.map((s) => (
              <LangSphere3D
                key={s.key}
                node={s}
                isActive={langActive(s.key)}
                isFocus={active?.type === "lang" && active.key === s.key}
                onHover={() => hoverLang(s.key)}
                onLeave={clearHover}
                onSelect={() => selectLang(s.key)}
              />
            ))}

            {isMobile ? (
              // A drag-to-orbit control would fight the page's own vertical
              // swipe-to-scroll on a touchscreen, so mobile gets a purely
              // cosmetic auto-orbit instead — no pointer capture at all.
              <AutoOrbitCamera />
            ) : (
              <OrbitControls
                enablePan={false}
                minDistance={8}
                maxDistance={30}
                rotateSpeed={0.6}
                zoomSpeed={0.8}
                autoRotate
                autoRotateSpeed={0.5}
                makeDefault
              />
            )}

            {!isMobile && (
              <EffectComposer multisampling={0}>
                <Bloom luminanceThreshold={0.22} luminanceSmoothing={0.3} intensity={0.75} mipmapBlur radius={0.6} />
              </EffectComposer>
            )}
          </Canvas>
        </div>

        <div className="lang-graph-detail">
          <p className="lang-graph-detail-label">Selected</p>
          <p className="lang-graph-detail-title">{detail.title}</p>
          <div className="lang-graph-detail-rows">
            {detail.rows.map(([k, v]) => (
              <div className="lang-graph-detail-row" key={k}>
                <span>{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
          {detail.chips.length > 0 && (
            <div className="lang-graph-detail-chips">
              {detail.chips.map((c) => (
                <span className="lang-graph-detail-chip" key={c}>
                  {c}
                </span>
              ))}
            </div>
          )}
          {detail.link && (
            <a className="lang-graph-detail-link" href={detail.link} target="_blank" rel="noopener noreferrer">
              View on GitHub &#8599;
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

const SAKILA_TABLES = [
  "actor", "address", "category", "city", "country", "customer", "film",
  "film_actor", "film_actor2", "film_category", "inventory", "language",
  "payment", "rental", "staff", "store", "test",
];

const FILM_ROWS = [
  [1, "ACE GOLDFINGER", "4.99", "G", "2006", "48", "Horror", "FAWCETT, GUINESS, ZELLWEGER, DEPP"],
  [2, "AIRPLANE SIERRA", "4.99", "PG-13", "2006", "62", "Comedy", "PENN, KILMER, MOSTEL, BOLGER, HOPPER"],
  [3, "AIRPORT POLLOCK", "4.99", "R", "2006", "54", "Horror", "WILLIS, KILMER, DAVIS, DEE"],
  [4, "ALADDIN CALENDAR", "4.99", "NC-17", "2006", "63", "Sports", "RYDER, BOLGER, TRACY, JOHANSSON, MALDEN, DUKAKIS, WAYNE, CHASE"],
  [5, "ALI FOREVER", "4.99", "PG", "2006", "150", "Horror", "TORN, BERRY, MCCONAUGHEY, MCDORMAND, CHASE"],
  [6, "AMELIE HELLFIGHTERS", "4.99", "R", "2006", "79", "Music", "HUNT, TANDY, TORN, MANSFIELD, GOODING, BRODY"],
  [7, "AMERICAN CIRCUS", "4.99", "R", "2006", "129", "Action", "TOMEI, JACKMAN, BLOOM, CROWE, CRAWFORD"],
  [8, "ANTHEM LUKE", "4.99", "PG-13", "2006", "91", "Comedy", "KEITEL, KILMER"],
  [9, "APACHE DIVINE", "4.99", "NC-17", "2006", "92", "Family", "CRONYN, OLIVIER, BERRY, WAHLBERG"],
  [10, "APOCALYPSE FLAMINGOS", "4.99", "R", "2006", "119", "New", "CLOSE, HOFFMAN, BASINGER, KILMER, WILSON"],
  [11, "ATTACKS HATE", "4.99", "PG-13", "2006", "113", "Sci-Fi", "KEITEL, TEMPLE, TORN, DUNST"],
  [12, "ATTRACTION NEWTON", "4.99", "PG-13", "2006", "83", "New", "WOOD, WEST, PENN, TAUTOU, HUDSON"],
  [13, "AUTUMN CROW", "4.99", "G", "2006", "108", "Games", "PITT, TAUTOU, JOHANSSON, WAHLBERG, DEAN"],
];

const QUERY_LINES = [
  [{ t: "SELECT", c: "kw" }],
  [{ t: "    f.title," }],
  [{ t: "    f.rental_rate," }],
  [{ t: "    f.rating," }],
  [{ t: "    f.release_year," }],
  [{ t: "    f.length," }],
  [{ t: "    c.name " }, { t: "AS", c: "kw" }, { t: " category_name," }],
  [
    { t: "    " },
    { t: "STRING_AGG", c: "fn" },
    { t: "(a.last_name, " },
    { t: "', '", c: "str" },
    { t: ") " },
    { t: "AS", c: "kw" },
    { t: " actors" },
  ],
  [{ t: "FROM", c: "kw" }],
  [{ t: "    film f" }],
  [{ t: "JOIN", c: "kw" }],
  [{ t: "    film_actor fa " }, { t: "ON", c: "kw" }, { t: " f.film_id = fa.film_id" }],
  [{ t: "JOIN", c: "kw" }],
  [{ t: "    actor a " }, { t: "ON", c: "kw" }, { t: " fa.actor_id = a.actor_id" }],
  [{ t: "JOIN", c: "kw" }],
];

function DbReplicaBackground() {
  return (
    <div className="db-replica">
      <div className="dbrep-tabbar">
        <div className="dbrep-tabbar-left">
          <button type="button" className="dbrep-tab is-active">Databases</button>
          <button type="button" className="dbrep-tab">Scripts</button>
          <button type="button" className="dbrep-tab">&#9733; Favorites</button>
        </div>
        <div className="dbrep-tabbar-right">
          <button type="button" className="dbrep-querytab is-active">
            4: Top rental actors{" "}
            <span className="dbrep-tab-close">&times;</span>
          </button>
        </div>
      </div>

      <div className="dbrep-toolbar">
        <div className="dbrep-toolbar-icons">
          <button type="button" className="dbrep-icon dbrep-icon-run" title="Execute">&#9654;</button>
          {["▷", "⏹", "↺", "↻", "⌕", "▦", "▧", "⋮"].map((g, i) => (
            <button type="button" className="dbrep-icon" key={i}>
              {g}
            </button>
          ))}
        </div>
        <div className="dbrep-toolbar-conn">
          <label className="dbrep-check">
            <input type="checkbox" /> Sticky
          </label>
          <span className="dbrep-conn-label">Database Connection</span>
          <button type="button" className="dbrep-dd">&#128031; PostgreSQL 14.1</button>
          <button type="button" className="dbrep-dd">&#128451; sakila</button>
          <span className="dbrep-conn-label">Schema</span>
          <button type="button" className="dbrep-dd">&#128273; public</button>
          <span className="dbrep-conn-label">Max Rows</span>
          <span className="dbrep-input">1000</span>
          <span className="dbrep-conn-label">Max Chars</span>
          <span className="dbrep-input">-1</span>
        </div>
      </div>

      <div className="dbrep-body">
        <div className="dbrep-sidebar">
          <button type="button" className="dbrep-tree-row lvl0">&#128451; PostgreSQL 14.1</button>
          <button type="button" className="dbrep-tree-row lvl1">Databases</button>
          <button type="button" className="dbrep-tree-row lvl2">&#128451; sakila</button>
          <button type="button" className="dbrep-tree-row lvl3">Schemas</button>
          <button type="button" className="dbrep-tree-row lvl4">information_schema</button>
          <button type="button" className="dbrep-tree-row lvl4">other</button>
          <button type="button" className="dbrep-tree-row lvl4">pg_catalog</button>
          <button type="button" className="dbrep-tree-row lvl4">pg_toast</button>
          <button type="button" className="dbrep-tree-row lvl4">public</button>
          <button type="button" className="dbrep-tree-row lvl5">Tables</button>
          {SAKILA_TABLES.map((t) => (
            <button
              type="button"
              className={`dbrep-tree-row lvl6 ${t === "category" ? "is-selected" : ""}`}
              key={t}
            >
              {t}
            </button>
          ))}
          <button type="button" className="dbrep-tree-row lvl5">Foreign Tables</button>
          <button type="button" className="dbrep-tree-row lvl5">Views</button>
          <button type="button" className="dbrep-tree-row lvl5">Materialized Views</button>
          <button type="button" className="dbrep-tree-row lvl5">Indexes</button>
          <button type="button" className="dbrep-tree-row lvl5">Triggers</button>
        </div>

        <div className="dbrep-main">
          <div className="dbrep-editor">
            {QUERY_LINES.map((tokens, i) => (
              <div className="dbrep-editor-line" key={i}>
                <span className="dbrep-ln">{i + 1}</span>
                <span className="dbrep-code">
                  {tokens.map((tok, j) => (
                    <span key={j} className={tok.c ? `dbrep-tok-${tok.c}` : undefined}>
                      {tok.t}
                    </span>
                  ))}
                  {i === QUERY_LINES.length - 1 && <span className="dbrep-caret" />}
                </span>
              </div>
            ))}
          </div>
          <div className="dbrep-editor-status">
            <span>8 / 15&nbsp;&nbsp;[130]&nbsp;&nbsp;INS</span>
            <span>LF&nbsp;&nbsp;Auto Commit: ON&nbsp;&nbsp;UTF-8&nbsp;&nbsp;Untitled*</span>
          </div>

          <div className="dbrep-resulttabs">
            <button type="button" className="dbrep-resulttab">Log</button>
            <button type="button" className="dbrep-resulttab is-active">
              1: film [657] <span className="dbrep-tab-close">&times;</span>
            </button>
          </div>

          <div className="dbrep-grid-wrap">
            <table className="dbrep-grid">
              <thead>
                <tr>
                  <th>#</th>
                  <th>title</th>
                  <th>rental_rate</th>
                  <th>rating</th>
                  <th>release_year</th>
                  <th>length</th>
                  <th>category_name</th>
                  <th>actors</th>
                </tr>
              </thead>
              <tbody>
                {FILM_ROWS.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => (
                      <td key={i}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dbrep-grid-status">
            <span>Format: &lt;Select a Cell&gt;</span>
            <span>0.104/0.004 sec&nbsp;&nbsp;657/7&nbsp;&nbsp;1-14</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const WHOAMI_ROWS = [
  { label: "Database", value: "PostgreSQL, MongoDB Atlas" },
  { label: "Backend", value: "Spring Boot, JWT" },
  { label: "Tools", value: "IntelliJ IDEA" },
];

function BackendPane() {

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef(null);

  const onPointerDown = (e) => {
    drag.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!drag.current) return;
    setPos({
      x: drag.current.origX + (e.clientX - drag.current.startX),
      y: drag.current.origY + (e.clientY - drag.current.startY),
    });
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  return (
    <div className="ide-terminal-stage">
      <DbReplicaBackground />
      <div
        className="ide-terminal-float ide-terminal-float-whoami"
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      >
        <TerminalChrome
          name="whoami — bash"
          draggable
          bodyClassName="ide-terminal-body-compact"
          cardClassName="ide-terminal-card-wide"
          titlebarProps={{
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerCancel: onPointerUp,
          }}
        >
          <TermLine line={{ cmd: "whoami" }} />
          <div className="whoami-rows">
            {WHOAMI_ROWS.map((row) => (
              <div className="whoami-row" key={row.label}>
                <span className="whoami-label">{row.label}</span>
                <span className="whoami-value">{row.value}</span>
              </div>
            ))}
          </div>
        </TerminalChrome>
      </div>
    </div>
  );
}

function TerminalActionBar({ shell }) {
  return (
    <div className="ide-vs-terminal-actions">
      <span className="ide-vs-terminal-shell">{shell}</span>
      <button type="button" className="ide-vs-terminal-icon" title="New Terminal">
        +
      </button>
      <button type="button" className="ide-vs-terminal-icon" title="Split Terminal">
        &#10697;
      </button>
      <button type="button" className="ide-vs-terminal-icon" title="Kill Terminal">
        &#128465;
      </button>
      <button type="button" className="ide-vs-terminal-icon" title="More Actions">
        &#8942;
      </button>
    </div>
  );
}

function PaneTerminal({ title, shell, cmd, children }) {
  return (
    <div className="ide-vs-terminal">
      <div className="ide-vs-terminal-head">
        <span className="ide-vs-terminal-chevron">&#8964;</span>
        <span className="ide-vs-terminal-title">{title}</span>
        <TerminalActionBar shell={shell} />
      </div>
      <div className="ide-vs-terminal-body">
        <div className="term-line">
          <span className="term-prompt">$</span> <span className="term-cmd">{cmd}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

// The first commands of the real terminal's `help`, straight from its command table.
const HELP_PREVIEW = COMMANDS.filter((c) => ["whoami", "projects", "open", "ask"].includes(c.name));

function FrameworkPane() {
  return (
    <div className="ide-agent-grid">
      <div className="ide-agent-pane">
        <PaneTerminal title="Tools I use" shell="zsh" cmd="cat ~/tools.txt">
          {profile.tools.map((tool) => (
            <div className="term-line" key={tool}>
              <span className="term-out term-out-wrap">{tool}</span>
            </div>
          ))}
        </PaneTerminal>
      </div>
      <div className="ide-agent-pane ide-agent-pane-cta">
        <PaneTerminal title="Real terminal" shell="zsh" cmd="help">
          {HELP_PREVIEW.map((c) => (
            <div className="term-line" key={c.name}>
              <span className="term-out term-out-wrap">
                <span className="term-help-usage">{c.usage}</span> {c.desc}
              </span>
            </div>
          ))}
          <div className="term-line">
            <span className="term-out term-out-wrap">…and more. This pane is a picture; the terminal below runs.</span>
          </div>
          <a href="#terminal" className="ide-terminal-cta">
            Try the real terminal <span aria-hidden="true">↓</span>
          </a>
        </PaneTerminal>
      </div>
      <div className="ide-agent-pane ide-agent-pane-tall">
        <PaneTerminal title="This site" shell="npm" cmd="npm ls --depth=0">
          {STACK_LINES.map((line) => (
            <div className="term-line" key={line}>
              <span className="term-out">{line}</span>
            </div>
          ))}
        </PaneTerminal>
      </div>
    </div>
  );
}

function AgentCard({ card }) {
  return (
    <div className="ide-agent-card">
      <div className="ide-agent-card-head">
        {card.icon === "claude" ? (
          <SiClaude className="ide-agent-card-icon ide-agent-card-icon-claude" color="#D97757" />
        ) : (
          <span className="ide-agent-card-icon" />
        )}
        <span className="ide-agent-card-title">{card.title}</span>
        <span className="ide-agent-card-actions">&#8942; +</span>
      </div>
      <div className="ide-agent-card-branch-row">
        <span className="ide-agent-card-status-dot" style={{ background: card.color }} />
        <span className="ide-agent-card-branch">{card.branch}</span>
        <span className="ide-agent-card-pill">primary</span>
      </div>
      <div className="ide-agent-card-branch-muted">{card.branch}</div>
      <div className="ide-agent-card-activity">
        {card.activityIcon === "claude" ? (
          <SiClaude className="ide-agent-card-activity-icon ide-agent-card-activity-icon-claude" color="#D97757" />
        ) : card.activityIcon === "codex" ? (
          <RiOpenaiFill className="ide-agent-card-activity-icon ide-agent-card-activity-icon-codex" color="#ffffff" />
        ) : (
          <span className="ide-agent-card-spark">&#10022;</span>
        )}
        <span className="ide-agent-card-activity-text">
          {card.agentName} · {card.status}&hellip;
        </span>
        <span className="ide-agent-card-time">{card.time}</span>
      </div>
    </div>
  );
}

function StatusBar({ langMode }) {
  return (
    <div className="ide-status-bar">
      <div className="ide-status-left">
        <span className="ide-status-item">&#9095; main</span>
        <span className="ide-status-item">&#8635;</span>
        <span className="ide-status-item">&#8855; 0 &#9888; 0</span>
      </div>
      <div className="ide-status-right">
        <span className="ide-status-item">{langMode}</span>
        <span className="ide-status-item ide-status-optional">UTF-8</span>
        <span className="ide-status-item ide-status-optional">LF</span>
        <span className="ide-status-item ide-status-live">&#9679; Go Live</span>
        <span className="ide-status-item">&#128276;</span>
      </div>
    </div>
  );
}

export default function TechStack() {
  const wrapRef = useRef(null);
  const trackFillRef = useRef(null);
  const edgeFillRef = useRef(null);
  const sceneRef = useRef(null);
  const hintRef = useRef(null);
  const rafRef = useRef(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualOpenProject, setManualOpenProject] = useState(undefined);
  const [syncedIndex, setSyncedIndex] = useState(0);

  // Reset any manual folder pick once the scroll-driven category changes.
  if (activeIndex !== syncedIndex) {
    setSyncedIndex(activeIndex);
    setManualOpenProject(undefined);
  }

  const openProject =
    manualOpenProject !== undefined ? manualOpenProject : STACK[activeIndex].featured;

  useEffect(() => {
    const lerp = (start, end, factor) => start + (end - start) * factor;
    let targetProgress = 0;
    let currentProgress = 0;
    let targetEntrance = 0;
    let currentEntrance = 0;

    const computeTarget = () => {
      const el = wrapRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight;

      // Reveal the IDE window as its section scrolls up into place, before it pins.
      targetEntrance = Math.min(1, Math.max(0, 1 - rect.top / (viewH * 0.6)));

      const scrollable = rect.height - viewH;
      if (scrollable <= 0) {
        targetProgress = 0;
        return;
      }

      const traveled = -rect.top;
      targetProgress = Math.min(1, Math.max(0, traveled / scrollable));
    };

    const applyProgress = (progress, entrance, indexProgress) => {
      // Index tracks the real (unsmoothed) scroll progress so the visible
      // pane is never behind when the section unpins — the lerp below is
      // purely cosmetic for the track fill / entrance transform.
      const index = Math.min(SEGMENTS - 1, Math.floor(indexProgress * SEGMENTS));

      if (trackFillRef.current) {
        trackFillRef.current.style.transform = `scaleY(${progress})`;
      }

      if (edgeFillRef.current) {
        edgeFillRef.current.style.transform = `scaleY(${progress})`;
      }

      if (sceneRef.current) {
        sceneRef.current.style.opacity = entrance;
        sceneRef.current.style.transform = `translateY(${(1 - entrance) * 64}px) scale(${0.92 + entrance * 0.08})`;
      }

      if (hintRef.current) {
        // Nudges the visitor once the window has faded in, then gets out of
        // the way as soon as they actually start scrolling through it.
        const hintFade = Math.max(0, 1 - progress * 5);
        hintRef.current.style.opacity = (entrance * hintFade).toFixed(3);
      }

      if (index !== activeIndexRef.current) {
        activeIndexRef.current = index;
        setActiveIndex(index);
      }
    };

    const tick = () => {
      computeTarget();
      currentProgress = lerp(currentProgress, targetProgress, 0.12);
      if (Math.abs(currentProgress - targetProgress) < 0.0005) {
        currentProgress = targetProgress;
      }
      currentEntrance = lerp(currentEntrance, targetEntrance, 0.1);
      if (Math.abs(currentEntrance - targetEntrance) < 0.0005) {
        currentEntrance = targetEntrance;
      }
      applyProgress(currentProgress, currentEntrance, targetProgress);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const active = STACK[activeIndex];

  return (
    <section className="tech-stack-section" ref={wrapRef}>
      <div className="tech-stack-sticky">
        <div className="tech-stack-scene">
          <div className="tech-scroll-hint" ref={hintRef}>
            <span className="tech-scroll-hint-chevron">&#8595;</span>
            Scroll to continue
          </div>
          <div className="tech-window" ref={sceneRef}>
            <div className="tech-window-edge-track">
              <span className="tech-window-edge-fill" ref={edgeFillRef} />
            </div>
            <div className="tech-window-titlebar">
              <div className="tech-dots">
                <span className="tech-dot tech-dot-red" />
                <span className="tech-dot tech-dot-yellow" />
                <span className="tech-dot tech-dot-green" />
              </div>
              <div className="ide-tabs">
                {PROJECTS.map((p) => (
                  <span
                    key={p.name}
                    className={`ide-tab ${p.name === active.featured ? "is-active" : ""}`}
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="ide-breadcrumb">
              {active.featured} <span className="ide-breadcrumb-sep">&#8250;</span>{" "}
              {active.files[0].name}
            </div>

            <div className="tech-window-body">
              <div className={`ide-sidebar ${active.mode === "terminal" || active.mode === "ls" ? "is-collapsed" : ""}`}>
                <p className="ide-sidebar-caption">Explorer</p>

                <div className="ide-sidebar-section ide-sidebar-section-agents">
                  <p className="ide-sidebar-label">Open Agents</p>
                  <div className="ide-agent-cards">
                    {AGENT_CARDS.map((c) => (
                      <AgentCard card={c} key={c.title} />
                    ))}
                  </div>
                </div>

                <div className="ide-sidebar-section">
                  <p className="ide-sidebar-label">Portfolio</p>
                  {PROJECTS.map((project) => {
                    const isOpen = openProject === project.name;
                    return (
                      <div className="ide-tree-group" key={project.name}>
                        <button
                          type="button"
                          className="ide-tree-row"
                          onClick={() => setManualOpenProject(isOpen ? "" : project.name)}
                        >
                          <span className={`ide-chevron ${isOpen ? "is-open" : ""}`}>&#9656;</span>
                          <span className="ide-folder-dot" />
                          <span>{project.name}</span>
                        </button>
                        {isOpen && (
                          <div className="ide-tree-children">
                            {project.entries.map((entry) => (
                              <div className="ide-tree-file" key={entry.name}>
                                {entry.type === "folder" ? (
                                  <span className="ide-folder-dot ide-folder-dot-sm" />
                                ) : (
                                  <FileIcon name={entry.name} />
                                )}
                                <span>{entry.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="ide-main">
                {active.mode === "ls" && <LanguagesPane />}
                {active.mode === "terminal" && <BackendPane />}
                {active.mode === "grid" && <FrameworkPane />}
              </div>

              <div className="ide-right-panel">
                <div className="ide-right-nav">
                  <div className="ide-right-nav-track">
                    <span className="ide-right-nav-track-fill" ref={trackFillRef} />
                  </div>
                  <ul className="ide-right-nav-list">
                    {STACK.map((category, i) => (
                      <li
                        key={category.label}
                        className={`ide-right-nav-item ${i === activeIndex ? "is-active" : ""}`}
                      >
                        <span className="ide-right-nav-index">0{i + 1}</span>
                        {category.label}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Fake git/SCM flourish — decorative only, dropped on mobile to keep the panel to just the functional 01/02/03 nav. */}
                <div className="ide-right-panel-extra">
                  <div className="ide-right-divider" />

                  <p className="ide-right-panel-label">Changes</p>
                  <div className="ide-file-stats">
                    {active.files.map((f) => (
                      <div className="ide-file-stat-row" key={f.name}>
                        <FileIcon name={f.name} />
                        <span className="ide-file-stat-name">{f.name}</span>
                        <span className="ide-file-stat-nums">
                          {f.add > 0 && <span className="ide-stat-add">+{f.add}</span>}
                          {f.del > 0 && <span className="ide-stat-del">-{f.del}</span>}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="ide-right-divider" />

                  <p className="ide-right-panel-label">Source Control</p>
                  <div className="ide-scm-commit-box">
                    <textarea
                      className="ide-scm-commit-input"
                      placeholder="Commit message"
                      rows={1}
                    />
                    <button type="button" className="ide-scm-commit-btn">
                      &#10003; Commit <span className="ide-scm-commit-caret">&#8964;</span>
                    </button>
                  </div>
                  <div className="ide-scm-changes-head">
                    <span>Changes</span>
                    <span className="ide-scm-count">{SCM_FILES.length}</span>
                  </div>
                  <div className="ide-scm-file-list">
                    {SCM_FILES.map((f) => (
                      <div className="ide-scm-file-row" key={f.name}>
                        <FileIcon name={f.name} />
                        <span className="ide-scm-file-name">{f.name}</span>
                        {f.path && <span className="ide-scm-file-path">{f.path}</span>}
                        <span className={`ide-scm-status ide-scm-status-${f.status}`}>{f.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <StatusBar langMode={active.langMode} />
          </div>
        </div>
      </div>
    </section>
  );
}
