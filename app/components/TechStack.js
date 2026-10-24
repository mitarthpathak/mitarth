"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { OrbitControls, Line, Html, Stars, Edges, Grid } from "@react-three/drei";
import { Vector3 } from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import useIsMobile from "../hooks/useIsMobile";
import LazyTerminal from "./terminal/LazyTerminal";

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

// Glow-friendly palette for the language graph only, one clearly separate hue
// per language so neighbouring planets never blur together. The IDE-mockup
// file icons elsewhere keep their true brand colors via FILE_ICONS.
const LANG_COLORS = {
  js: "#F5C451",
  ts: "#4D8DFF",
  next: "#E6EAF2",
  html: "#FF5A5F",
  css: "#2ED3C6",
  java: "#F28C3B",
  py: "#8C8CFF",
  cpp: "#5BE38A",
  kt: "#D17BFF",
  rs: "#FF8EC7",
};

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
const darken = (hex, amount) => mixWith(hex, 0, amount);

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
// missed in the graph, so this lists every public repo on the profile (the
// Kahani-Studio fork too, since Mitarth has commits in it). Byte counts are
// GitHub Linguist's per-repo `/languages` numbers, TSX counted as TypeScript
// the way GitHub does, measured on each default branch in October 2026.
// Next.js isn't a GitHub "language": see NEXTJS_REPOS below.
const LANG_NAME_TO_KEY = {
  JavaScript: "js",
  TypeScript: "ts",
  Java: "java",
  "C++": "cpp",
  Python: "py",
  HTML: "html",
  CSS: "css",
  Kotlin: "kt",
  Rust: "rs",
};

const MAJOR_KEYS = ["js", "ts", "next", "html", "css", "java", "py", "cpp", "kt", "rs"];
const LANG_LABELS = {
  js: "JavaScript",
  ts: "TypeScript",
  next: "Next.js",
  html: "HTML",
  css: "CSS",
  java: "Java",
  py: "Python",
  cpp: "C++",
  kt: "Kotlin",
  rs: "Rust",
};
// Every repo whose package.json depends on `next`: their JS/TS byte counts
// roll into the Next.js node instead of the raw-language nodes.
const NEXTJS_REPOS = [
  "mitarth",
  "yap-render",
  "TestAI",
  "supportagent-agent",
  "Kahani-Studio",
  "citysnc-app",
  "citysync-landing-page-design",
];

const REPO_DATA = [
  { name: "Swasthya-Neeti", label: "Swasthya-Neeti", big: true, langs: { TypeScript: 272040, JavaScript: 121831, CSS: 99984, HTML: 678 } },
  { name: "Run-Neeti", label: "Run-Neeti", big: true, langs: { TypeScript: 139032, JavaScript: 41473, CSS: 1658, HTML: 1226 } },
  { name: "DevTask", label: "DevTask", big: true, langs: { Java: 26688 } },
  { name: "mitarth", label: "Mitarth", big: true, langs: { JavaScript: 321049, CSS: 129273, Python: 617 } },
  { name: "yap-render", label: "Yap-Render", big: true, langs: { JavaScript: 1881908, TypeScript: 461970, CSS: 106866, Python: 52896, Dockerfile: 471 } },
  { name: "PeerLink", label: "PeerLink", big: true, langs: { "C++": 29450 } },
  { name: "CitySync", label: "CitySync", big: true, langs: { JavaScript: 363240, CSS: 57358, HTML: 1211 } },
  { name: "Doxentra", label: "Doxentra", big: true, langs: { JavaScript: 929280, TypeScript: 378594, CSS: 6723, HTML: 1168 } },
  { name: "Glyph", label: "Glyph", big: false, langs: { JavaScript: 719927, TypeScript: 335309, CSS: 5484, HTML: 1162 } },
  { name: "TestAI", label: "TestAI", big: false, langs: { JavaScript: 349812, CSS: 1334 } },
  { name: "supportagent-agent", label: "supportagent-agent", big: false, langs: { TypeScript: 177697, CSS: 2945, JavaScript: 94 } },
  { name: "Kahani-Studio", label: "Kahani-Studio", big: false, langs: { TypeScript: 368673, CSS: 3152, JavaScript: 559 }, fork: true },
  { name: "citysnc-app", label: "citysnc-app", big: false, langs: { CSS: 24160, TypeScript: 17660, JavaScript: 325 } },
  { name: "citysync-landing-page-design", label: "citysync-landing-page-design", big: false, langs: { TypeScript: 14916, CSS: 13974, JavaScript: 325 } },
  { name: "myFirstReactApp", label: "myFirstReactApp", big: false, langs: { JavaScript: 4618, CSS: 456, HTML: 367 } },
  { name: "weatherApp", label: "weatherApp", big: false, langs: { JavaScript: 2995, CSS: 1525, HTML: 595 } },
  { name: "Java_DSA", label: "Java_DSA", big: false, langs: { Java: 6591 } },
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

// The graph is drawn as a small "code city", the classic way to picture a
// codebase: every repo is a building whose height is its size in bytes and
// whose floors are its languages, stacked biggest first. Each building stands
// in the district of its main language. World units throughout.
const CELL = 0.66; // one building plot
const STREET = 1.05; // gap between districts, where their name tags sit
const LOT_PAD = 0.26; // margin inside a district
const CITY_WIDTH = 9.5; // districts wrap onto a new block past this width

function round2(n) {
  return Math.round(n * 100) / 100;
}

// Log scale, so one huge repo doesn't flatten everything else to the minimum.
function logScale(value, min, max, lo, hi) {
  const a = Math.log10(min + 1);
  const b = Math.log10(max + 1);
  const t = b > a ? (Math.log10(value + 1) - a) / (b - a) : 0.5;
  return lo + t * (hi - lo);
}

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const len = (a) => Math.hypot(a[0], a[1], a[2]);

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

const LANG_SUM = Object.values(LANG_TOTALS).reduce((a, b) => a + b, 0);

const LANG_NODES = MAJOR_KEYS.map((key) => {
  const share = (LANG_TOTALS[key] / LANG_SUM) * 100;
  return {
    key,
    name: LANG_LABELS[key],
    pct: Math.round(share),
    pctLabel: share < 1 ? "<1%" : `${Math.round(share)}%`,
  };
});

const LANG_BY_KEY = LANG_NODES.reduce((acc, n) => ({ ...acc, [n.key]: n }), {});

const PROJECT_NODES = REPO_DATA.map((repo) => {
  const majorEntries = repoMajorEntries(repo).sort((a, b) => b[1] - a[1]);
  const total = majorEntries.reduce((sum, [, bytes]) => sum + bytes, 0);
  return {
    ...repo,
    total,
    size: repo.big ? 0.56 : 0.4,
    majorKeys: majorEntries.map(([key]) => key),
    shares: majorEntries.map(([key, bytes]) => [key, total ? bytes / total : 0]),
    extra: Object.keys(repo.langs).filter((n) => !LANG_NAME_TO_KEY[n]),
    dominant: majorEntries[0]?.[0] || null,
    url: `https://github.com/mitarthpathak/${repo.name}`,
  };
});

const PROJECT_BY_NAME = PROJECT_NODES.reduce((acc, n) => ({ ...acc, [n.name]: n }), {});

const REPO_TOTALS = PROJECT_NODES.map((p) => p.total).filter(Boolean);
const REPO_MIN = Math.min(...REPO_TOTALS);
const REPO_MAX = Math.max(...REPO_TOTALS);

// Floors: one block per language, biggest at the bottom. Even a sliver of a
// language keeps a floor thick enough to see.
PROJECT_NODES.forEach((p) => {
  const height = p.total ? logScale(p.total, REPO_MIN, REPO_MAX, 0.4, 3.4) : 0.14;
  let y = 0;
  p.floors = p.shares.map(([key, share]) => {
    const h = Math.max(share * height, 0.07);
    const floor = { key, y: round2(y + h / 2), h: round2(h - 0.03) };
    y += h;
    return floor;
  });
  p.height = round2(y || height);
});

// One district per language that is some repo's main language, plus a lot
// for the README-only profile repo, which GitHub gives no language at all.
const DISTRICTS = [
  ...LANG_NODES.map((lang) => ({ key: lang.key, lang, repos: PROJECT_NODES.filter((p) => p.dominant === lang.key) })),
  { key: null, lang: null, repos: PROJECT_NODES.filter((p) => !p.dominant) },
].filter((d) => d.repos.length);

DISTRICTS.forEach((d) => {
  d.repos.sort((a, b) => b.height - a.height);
  d.cols = Math.ceil(Math.sqrt(d.repos.length));
  d.rows = Math.ceil(d.repos.length / d.cols);
  d.w = d.cols * CELL + LOT_PAD * 2;
  d.d = d.rows * CELL + LOT_PAD * 2;
});

// Shelf packing: the busiest districts first, left to right, wrapping into
// blocks; each block is centered, the first one furthest from the camera.
{
  const blocks = [];
  let block = null;
  [...DISTRICTS]
    .sort((a, b) => b.repos.length - a.repos.length || (b.lang?.pct ?? 0) - (a.lang?.pct ?? 0))
    .forEach((d) => {
      if (!block || block.width + STREET + d.w > CITY_WIDTH) {
        block = { districts: [], width: -STREET, depth: 0 };
        blocks.push(block);
      }
      block.districts.push(d);
      block.width += STREET + d.w;
      block.depth = Math.max(block.depth, d.d);
    });
  const cityDepth = blocks.reduce((sum, b) => sum + b.depth, 0) + STREET * (blocks.length - 1);
  let z = -cityDepth / 2;
  blocks.forEach((b) => {
    let x = -b.width / 2;
    b.districts.forEach((d) => {
      d.x = round2(x + d.w / 2);
      d.z = round2(z + b.depth - d.d / 2);
      x += d.w + STREET;
    });
    z += b.depth + STREET;
  });
}

// Plots inside each district: tallest buildings at the back, so the short
// ones in front never hide behind them.
DISTRICTS.forEach((d) => {
  if (d.lang) d.lang.district = d;
  d.repos.forEach((p, i) => {
    p.x = round2(d.x - d.w / 2 + LOT_PAD + CELL * ((i % d.cols) + 0.5));
    p.z = round2(d.z - d.d / 2 + LOT_PAD + CELL * (Math.floor(i / d.cols) + 0.5));
  });
});

// Edges carry the actual byte weight of that language inside that repo, so a
// beam's thickness reads as "how much of this repo is this language".
const GRAPH_EDGES = PROJECT_NODES.flatMap((p) =>
  repoMajorEntries(p).map(([key, bytes]) => ({ project: p.name, key, bytes }))
);

const EDGE_BYTE_VALUES = GRAPH_EDGES.map((e) => e.bytes);
const EDGE_MIN = Math.min(...EDGE_BYTE_VALUES);
const EDGE_MAX = Math.max(...EDGE_BYTE_VALUES);

// A data beam: an arc lifted over the streets from a building's roof to
// the district of another language it's written in.
function beamPoints(from, to, segments = 32) {
  const mid = scale(add(from, to), 0.5);
  const ctrl = [mid[0], Math.max(from[1], to[1]) + len(sub(to, from)) * 0.3 + 0.6, mid[2]];
  return Array.from({ length: segments + 1 }, (_, i) => {
    const t = i / segments;
    const u = 1 - t;
    return [0, 1, 2].map((k) => round2(u * u * from[k] + 2 * u * t * ctrl[k] + t * t * to[k]));
  });
}

GRAPH_EDGES.forEach((e) => {
  e.width = round2(logScale(e.bytes, EDGE_MIN, EDGE_MAX, 0.8, 2.6));
  const project = PROJECT_BY_NAME[e.project];
  const district = LANG_BY_KEY[e.key].district;
  // A repo's own district is right under it, so only other languages get a beam.
  e.points =
    district && project.dominant !== e.key
      ? beamPoints([project.x, project.height + 0.04, project.z], [district.x, 0.04, district.z])
      : null;
});

const BEAM_EDGES = GRAPH_EDGES.filter((e) => e.points);

// A beam with a dashed "data flow" running from the repo to the language.
function Beam3D({ edge }) {
  const lineRef = useRef(null);

  useFrame((_, delta) => {
    const material = lineRef.current?.material;
    if (material) material.dashOffset -= delta * 1.4;
  });

  return (
    <Line
      ref={lineRef}
      points={edge.points}
      color={LANG_COLORS[edge.key]}
      transparent
      opacity={0.95}
      depthWrite={false}
      lineWidth={edge.width}
      dashed
      dashSize={0.2}
      gapSize={0.12}
    />
  );
}

// Slowly circles the camera around the city on its own — used instead of
// OrbitControls on touch devices so there's nothing here to capture a
// finger swipe that's actually meant to scroll the page. It stops for good,
// right where it is, once the visitor taps the graph.
function AutoOrbitCamera({ enabled, radius = 22, height = 13, speed = 0.12 }) {
  useFrame(({ camera, clock }) => {
    if (!enabled) return;
    const t = clock.elapsedTime * speed;
    camera.position.x = Math.sin(t) * radius;
    camera.position.z = Math.cos(t) * radius;
    camera.position.y = height;
    camera.lookAt(0, 0.7, 0);
  });
  return null;
}

// Billboarded name tag pinned to a point in the city. Tags on the far side
// fade back, so the ones in front stay readable while the city turns.
function NodeLabel({ anchor, offset, variant, color, dim, focus, children }) {
  const ref = useRef(null);
  const point = useMemo(() => new Vector3(...anchor), [anchor]);
  useFrame(({ camera }) => {
    const el = ref.current;
    if (!el) return;
    const depth = camera.position.distanceTo(point) - camera.position.length();
    const fade = Math.min(1, Math.max(0, (depth + 1.5) / 7));
    el.style.opacity = ((1 - fade * 0.7) * (dim ? 0.3 : 1)).toFixed(2);
  });
  return (
    <Html position={offset} center distanceFactor={10} zIndexRange={[40, 0]} style={{ pointerEvents: "none" }}>
      <span
        ref={ref}
        className={`lg3d-label lg3d-label-${variant}${focus ? " is-focus" : ""}`}
        style={{ "--c": color }}
      >
        {children}
      </span>
    </Html>
  );
}

function pointerHandlers(onHover, onLeave, onSelect) {
  return {
    onPointerOver: (e) => {
      e.stopPropagation();
      onHover();
    },
    onPointerOut: (e) => {
      e.stopPropagation();
      onLeave();
    },
    onClick: (e) => {
      e.stopPropagation();
      onSelect();
    },
  };
}

const README_COLOR = "#8b93a7";

// A language's district: a glowing lot on the city grid, named at its front.
function District3D({ district, isActive, isFocus, onHover, onLeave, onSelect }) {
  const color = district.lang ? LANG_COLORS[district.key] : README_COLOR;
  const handlers = district.lang ? pointerHandlers(onHover, onLeave, onSelect) : {};
  const count = district.repos.length;

  return (
    <group position={[district.x, 0, district.z]}>
      <mesh position={[0, 0.015, 0]} {...handlers}>
        <boxGeometry args={[district.w, 0.03, district.d]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isFocus ? 0.6 : 0.15}
          transparent
          opacity={isFocus ? 0.3 : isActive ? 0.1 : 0.03}
          depthWrite={false}
        />
        <Edges color={color} lineWidth={isFocus ? 2 : 1.2} transparent opacity={isActive ? 0.85 : 0.15} />
      </mesh>
      <NodeLabel
        anchor={[district.x, 0, district.z]}
        offset={[0, 0.02, district.d / 2 + 0.3]}
        variant="lang"
        color={color}
        dim={!isActive}
        focus={isFocus}
      >
        {district.lang ? district.lang.name : "README"}
        <b>
          {district.lang ? `${district.lang.pctLabel} · ` : ""}
          {count} repo{count === 1 ? "" : "s"}
        </b>
      </NodeLabel>
    </group>
  );
}

// A repo: a tower of language floors with neon edges, like a stack of blocks.
function Building3D({ node, isActive, isFocus, focusLang, showLabel, onHover, onLeave, onSelect }) {
  const fade = isActive ? 1 : 0.12;
  const roofColor = LANG_COLORS[node.dominant] || README_COLOR;

  return (
    <group position={[node.x, 0, node.z]} {...pointerHandlers(onHover, onLeave, onSelect)}>
      {node.floors.length ? (
        node.floors.map((f) => {
          const color = LANG_COLORS[f.key];
          const lit = isFocus || focusLang === f.key;
          return (
            <mesh key={f.key} position={[0, f.y, 0]}>
              <boxGeometry args={[node.size, f.h, node.size]} />
              <meshStandardMaterial
                color={darken(color, 0.55)}
                emissive={color}
                emissiveIntensity={lit ? 0.75 : 0.2}
                roughness={0.45}
                metalness={0.25}
                transparent
                opacity={0.92 * fade}
              />
              <Edges color={lit ? lighten(color, 0.35) : color} lineWidth={lit ? 1.8 : 1} transparent opacity={fade} />
            </mesh>
          );
        })
      ) : (
        <mesh position={[0, node.height / 2, 0]}>
          <boxGeometry args={[node.size, node.height, node.size]} />
          <meshStandardMaterial color={darken(README_COLOR, 0.5)} transparent opacity={0.92 * fade} />
          <Edges color={README_COLOR} lineWidth={1} transparent opacity={fade} />
        </mesh>
      )}
      {showLabel && (
        <NodeLabel
          anchor={[node.x, node.height, node.z]}
          offset={[0, node.height + 0.26, 0]}
          variant="repo"
          color={roofColor}
          dim={!isActive}
          focus={isFocus}
        >
          {node.label}
          {node.fork && <b>fork</b>}
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
  // The city turns on its own until the visitor first clicks or drags in the
  // graph; after that it stays exactly where they left it.
  const [spinning, setSpinning] = useState(true);
  const stopSpinning = () => setSpinning(false);

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
          ["Share of repos", s.pctLabel],
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
          ["Tier", p.fork ? "Fork" : p.big ? "Featured" : "Repo"],
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

      <div className="lang-graph-body" onPointerDown={stopSpinning}>
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
              <span className="lang-graph-row-pct">{s.pctLabel}</span>
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
            camera={{ position: [10, 9.5, 13], fov: 38 }}
            gl={{ alpha: true, antialias: !isMobile }}
            dpr={isMobile ? 1 : [1, 2]}
            onPointerMissed={() => setPinned(null)}
          >
            <fog attach="fog" args={["#05060a", 18, 36]} />
            <ambientLight intensity={0.35} />
            <directionalLight position={[6, 12, 8]} intensity={0.8} />
            <pointLight position={[-8, 4, -6]} intensity={0.5} color="#5b7cff" />
            <pointLight position={[7, 3, 7]} intensity={0.3} color="#ff9d5b" />

            <Stars radius={45} depth={25} count={isMobile ? 400 : 1200} factor={2} saturation={0} fade speed={0.3} />
            <Grid
              position={[0, -0.001, 0]}
              args={[40, 40]}
              cellSize={CELL / 2}
              cellThickness={0.6}
              cellColor="#131a2a"
              sectionSize={CELL * 2}
              sectionThickness={1}
              sectionColor="#24304d"
              fadeDistance={26}
              fadeStrength={1.6}
              infiniteGrid
            />

            {DISTRICTS.map((d) => (
              <District3D
                key={d.key ?? "readme"}
                district={d}
                isActive={d.lang ? langActive(d.key) : !active && !searching}
                isFocus={!!d.lang && active?.type === "lang" && active.key === d.key}
                onHover={() => hoverLang(d.key)}
                onLeave={clearHover}
                onSelect={() => selectLang(d.key)}
              />
            ))}

            {PROJECT_NODES.map((p) => (
              <Building3D
                key={p.name}
                node={p}
                isActive={projectActive(p.name)}
                isFocus={active?.type === "project" && active.name === p.name}
                focusLang={active?.type === "lang" ? active.key : null}
                showLabel={p.big || (active?.type === "project" && active.name === p.name)}
                onHover={() => hoverProject(p.name)}
                onLeave={clearHover}
                onSelect={() => selectProject(p.name)}
              />
            ))}

            {BEAM_EDGES.filter(edgeFocused).map((edge) => (
              <Beam3D key={`${edge.project}-${edge.key}`} edge={edge} />
            ))}

            {isMobile ? (
              // A drag-to-orbit control would fight the page's own vertical
              // swipe-to-scroll on a touchscreen, so mobile gets a purely
              // cosmetic auto-orbit instead — no pointer capture at all.
              <AutoOrbitCamera enabled={spinning} />
            ) : (
              <OrbitControls
                target={[0, 0.7, 0]}
                enablePan={false}
                minDistance={7}
                maxDistance={30}
                minPolarAngle={0.3}
                maxPolarAngle={1.32}
                rotateSpeed={0.6}
                zoomSpeed={0.8}
                autoRotate={spinning}
                autoRotateSpeed={0.5}
                onStart={stopSpinning}
                makeDefault
              />
            )}

            {!isMobile && (
              <EffectComposer multisampling={0}>
                <Bloom luminanceThreshold={0.25} luminanceSmoothing={0.3} intensity={0.7} mipmapBlur radius={0.6} />
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

// Pane 03 is the real terminal: commands over the site's content, plus
// `ask`, answered by the AI from the case studies with sources.
function FrameworkPane() {
  return (
    <div className="ide-terminal-pane">
      <LazyTerminal embedded />
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

      // While the visitor is typing in the terminal (pane 03), the pane stays
      // put: a phone keyboard or a stray scroll must not swap it away.
      const typing = document.activeElement?.closest?.(".term");
      if (index !== activeIndexRef.current && !typing) {
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
      {/* /#terminal scrolls to where pane 03 (the terminal) is showing */}
      <span id="terminal" className="tech-terminal-anchor" aria-hidden="true" />
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
              <div
                className={`ide-sidebar ${active.mode === "terminal" || active.mode === "ls" ? "is-collapsed" : ""} ${
                  active.mode === "grid" ? "is-collapsed-phone" : ""
                }`}
              >
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

              <div className={`ide-main${active.mode === "grid" ? " ide-main-terminal" : ""}`}>
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
