"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { OrbitControls, Line, Html, Stars, Edges, Grid, Environment, Lightformer } from "@react-three/drei";
import {
  BufferGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Float32BufferAttribute,
  Object3D,
  Quaternion,
  TubeGeometry,
  Vector3,
} from "three";
import { EffectComposer, Bloom, DepthOfField, N8AO } from "@react-three/postprocessing";
import { createPortal } from "react-dom";
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

// Lots and buildings that have no language (the README-only profile repo).
const README_COLOR = "#8b93a7";

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

// Pane 02 is drawn as a small "code city", the classic way to picture a
// codebase: buildings standing in districts on a grid. World units throughout.
const CELL = 0.66; // one building plot
const LOT_PAD = 0.26; // margin inside a district

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
    majorKeys: majorEntries.map(([key]) => key),
    shares: majorEntries.map(([key, bytes]) => [key, total ? bytes / total : 0]),
    extra: Object.keys(repo.langs).filter((n) => !LANG_NAME_TO_KEY[n]),
    dominant: majorEntries[0]?.[0] || null,
    url: `https://github.com/mitarthpathak/${repo.name}`,
  };
});

const PROJECT_BY_NAME = PROJECT_NODES.reduce((acc, n) => ({ ...acc, [n.name]: n }), {});

// A data beam: an arc lifted over the streets from a building's roof to
// whatever it's wired to.
function beamPoints(from, to, segments = 32) {
  const mid = scale(add(from, to), 0.5);
  const ctrl = [mid[0], Math.max(from[1], to[1]) + len(sub(to, from)) * 0.3 + 0.6, mid[2]];
  return Array.from({ length: segments + 1 }, (_, i) => {
    const t = i / segments;
    const u = 1 - t;
    return [0, 1, 2].map((k) => round2(u * u * from[k] + 2 * u * t * ctrl[k] + t * t * to[k]));
  });
}

// A beam between a building and what it's connected to. A focused beam
// carries a dashed "data flow"; resting ones are faint static threads, and
// the rest fade almost out while something else is in focus.
function Beam3D({ edge, state = "focus" }) {
  const lineRef = useRef(null);
  const flowing = state === "focus";

  useFrame((_, delta) => {
    const material = lineRef.current?.material;
    if (flowing && material) material.dashOffset -= delta * 1.4;
  });

  return (
    <Line
      ref={lineRef}
      points={edge.points}
      color={edge.color}
      transparent
      opacity={flowing ? 0.95 : state === "rest" ? 0.22 : 0.04}
      depthWrite={false}
      lineWidth={flowing ? edge.width : Math.max(0.7, edge.width * 0.6)}
      dashed={flowing}
      dashSize={0.2}
      gapSize={0.12}
    />
  );
}

// Slowly circles the camera around the city on its own — used instead of
// OrbitControls on touch devices so there's nothing here to capture a
// finger swipe that's actually meant to scroll the page. It stops for good,
// right where it is, once the visitor taps the graph.
function AutoOrbitCamera({ enabled, target, radius = 22, height = 13, speed = 0.12 }) {
  useFrame(({ camera, clock, size }) => {
    if (!enabled) return;
    const t = clock.elapsedTime * speed;
    // A tall, narrow screen (a phone in full screen) sees less sideways, so
    // the camera backs off to keep the whole scene in frame.
    const fit = Math.max(1, 0.62 / (size.width / size.height));
    camera.position.x = Math.sin(t) * radius * fit;
    camera.position.z = Math.cos(t) * radius * fit;
    camera.position.y = height * fit;
    camera.lookAt(target[0], target[1], target[2]);
  });
  return null;
}

// Billboarded name tag pinned to a point in the city. Tags on the far side
// fade back, so the ones in front stay readable while the city turns.
function NodeLabel({ anchor, offset, variant, color, dim, focus, swatch, distanceFactor = 10, children }) {
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
    <Html position={offset} center distanceFactor={distanceFactor} zIndexRange={[40, 0]} style={{ pointerEvents: "none" }}>
      <span
        ref={ref}
        className={`lg3d-label lg3d-label-${variant}${focus ? " is-focus" : ""}${swatch ? " has-swatch" : ""}`}
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

// A district: a glowing lot on the city grid, named at its edge.
function District3D({ district, isActive, isFocus, onHover, onLeave, onSelect }) {
  const { color } = district;
  const handlers = district.interactive ? pointerHandlers(onHover, onLeave, onSelect) : {};

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
        offset={district.labelOffset || [0, 0.02, district.d / 2 + 0.3]}
        variant="lang"
        color={color}
        dim={!isActive}
        focus={isFocus}
      >
        {district.title}
        <b>{district.meta}</b>
      </NodeLabel>
    </group>
  );
}

// A repo: a tower of floors with neon edges, like a stack of blocks. A floor
// lights up when it's in focus itself (focusKey) or its whole building is.
function Building3D({ node, isActive, isFocus, focusKey, showLabel, onHover, onLeave, onSelect }) {
  const fade = isActive ? 1 : 0.12;

  return (
    <group position={[node.x, 0, node.z]} {...pointerHandlers(onHover, onLeave, onSelect)}>
      {node.floors.length ? (
        node.floors.map((f) => {
          const lit = isFocus || focusKey === f.key;
          return (
            <mesh key={f.key} position={[0, f.y, 0]}>
              <boxGeometry args={[node.size, f.h, node.size]} />
              <meshStandardMaterial
                color={darken(f.color, 0.62)}
                emissive={f.color}
                emissiveIntensity={lit ? 0.7 : 0.14}
                roughness={0.3}
                metalness={0.55}
                transparent
                opacity={0.92 * fade}
              />
              <Edges color={lit ? lighten(f.color, 0.35) : f.color} lineWidth={lit ? 1.8 : 0.9} transparent opacity={fade} />
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
          color={node.roofColor}
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

// The stage both city panes share: the night grid, lights and stars, the
// camera controls and the bloom that makes the neon edges glow.
function CityScene({
  isMobile,
  spinning,
  onStopSpinning,
  onMissed,
  camera,
  target = [0, 0.7, 0],
  fog = [18, 36],
  mobileOrbit,
  children,
}) {
  return (
    <Canvas
      camera={{ position: camera, fov: 38 }}
      gl={{ alpha: true, antialias: !isMobile }}
      resize={{ offsetSize: true }}
      dpr={isMobile ? 1 : [1, 2]}
      onPointerMissed={onMissed}
    >
      <fog attach="fog" args={["#05060a", ...fog]} />
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
        cellColor="#121a2c"
        sectionSize={CELL * 2}
        sectionThickness={1}
        sectionColor={ACCENT.navy}
        fadeDistance={26}
        fadeStrength={1.6}
        infiniteGrid
      />

      {children}

      {isMobile ? (
        // A drag-to-orbit control would fight the page's own vertical
        // swipe-to-scroll on a touchscreen, so mobile gets a purely
        // cosmetic auto-orbit instead — no pointer capture at all.
        <AutoOrbitCamera enabled={spinning} target={target} {...mobileOrbit} />
      ) : (
        <OrbitControls
          target={target}
          enablePan={false}
          minDistance={7}
          maxDistance={30}
          minPolarAngle={0.3}
          maxPolarAngle={1.32}
          rotateSpeed={0.6}
          zoomSpeed={0.8}
          autoRotate={spinning}
          autoRotateSpeed={0.5}
          onStart={onStopSpinning}
          makeDefault
        />
      )}

      {!isMobile && (
        <EffectComposer multisampling={0}>
          <Bloom luminanceThreshold={0.25} luminanceSmoothing={0.3} intensity={0.7} mipmapBlur radius={0.6} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

// Pane 01 is a structural study rather than a chart: an engineered sphere of
// broken concentric shells around a dense core. The ten languages are
// cylindrical chambers in the inner shells, sized by their share of all the
// code; the eight featured repos are faceted monoliths in the outer shells,
// layered by the languages inside them; every other repo is a small cube in
// the grids on the outermost shell. Braided conduits run from each language
// to every repo layer that uses it. One language is always active — the most
// used, until the visitor picks another. Monochrome with two quiet accents,
// so the form still reads first.
// World units; it's all generated from fixed seeds, so every visit (and the
// server render) builds the same structure.
const MONO = {
  metal: "#c4c9d1",
  plate: "#7b818c",
  dark: "#3b4049",
  line: "#9aa3b2",
};
// The accents: ice blue for what's live (the core, the active language, its
// conduits, the readouts) and champagne gold for the fittings (filaments,
// chamber rings, name plates, one shell's rods); one shell's bands are navy.
const ACCENT = {
  ice: "#9fd4ff",
  iceLight: "#dff1ff",
  iceGlow: "#4fa8ff",
  gold: "#d6b56f",
  goldDeep: "#a8894f",
  navy: "#2a3a57",
};
const SHELL_RADII = [1.05, 1.55, 2.15, 2.75, 3.35, 3.95];
const CORE_R = 0.55;
const BLOCK_RING = 3.05; // repo monoliths hang between shells 4 and 5
const CUBE_RING = 4.08; // the other repos sit just outside the last shell
const STRUCT_SEED = 20261025;

const unit = (a) => scale(a, 1 / (len(a) || 1));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function randomDir(rand) {
  const z = rand() * 2 - 1;
  const t = rand() * Math.PI * 2;
  const s = Math.sqrt(1 - z * z);
  return [s * Math.cos(t), z, s * Math.sin(t)];
}

// Two unit vectors spanning the plane tangent to the sphere at direction n.
function tangentBasis(n) {
  const u = unit(cross(Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], n));
  return [u, cross(n, u)];
}

// A point on the sphere of radius r, offset (x, y) world units from the
// direction n along its tangent plane.
function onSphere(n, u, v, r, x, y) {
  return scale(unit(add(n, add(scale(u, x / r), scale(v, y / r)))), r);
}

// Each shell: two or three great circles broken into rods and flat bands
// with gaps between them, plus plates floating on its surface. Shells turn
// slowly on their own axes.
const SHELLS = SHELL_RADII.map((r, i) => {
  const rand = mulberry32(STRUCT_SEED + i * 101);
  const outer = i >= 3;
  const rings = Array.from({ length: i === 0 ? 2 : 3 }, () => {
    const rotation = [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI];
    const arcs = [];
    let a = rand() * Math.PI * 2;
    const end = a + Math.PI * 2;
    while (a < end - 0.4) {
      const length = Math.min(0.35 + rand() * 1.15, end - a - 0.2);
      arcs.push({
        start: a,
        length,
        band: rand() < (outer ? 0.45 : 0.3),
        width: 0.04 + rand() * (outer ? 0.1 : 0.05),
        tube: (outer ? 0.016 : 0.01) + rand() * 0.012,
      });
      a += length + 0.12 + rand() * 0.45;
    }
    return { rotation, arcs };
  });
  const plates = Array.from({ length: outer ? 26 : 14 }, () => ({
    pos: scale(randomDir(rand), r + (rand() - 0.5) * 0.06),
    spin: rand() * Math.PI,
    size: [0.08 + rand() * (outer ? 0.32 : 0.18), 0.05 + rand() * 0.16, 0.012],
  }));
  plates.forEach((p) => (p.normal = unit(p.pos)));
  return { r, rings, plates, axis: randomDir(rand), spin: (rand() < 0.5 ? -1 : 1) * (0.015 + rand() * 0.03) };
});

// The core: a knot of small blocks packed tighter toward the middle.
const CORE_BLOCKS = (() => {
  const rand = mulberry32(STRUCT_SEED + 3);
  return Array.from({ length: 70 }, () => {
    const s = 0.04 + rand() * 0.12;
    const pos = scale(randomDir(rand), CORE_R * Math.pow(rand(), 1.8));
    return { pos, normal: randomDir(rand), spin: rand() * Math.PI, size: [s, s * (0.4 + rand()), s * (0.4 + rand())] };
  });
})();

const CORE_KNOTS = [
  { r: 0.32, p: 2, q: 3, rotation: [0.3, 0.2, 0] },
  { r: 0.36, p: 3, q: 4, rotation: [1.2, 0.4, 0.6] },
  { r: 0.28, p: 2, q: 5, rotation: [-0.5, 1.1, 0.3] },
  { r: 0.4, p: 3, q: 5, rotation: [0.8, -0.9, 1.4] },
];

// The detail layer: radial streaks, struts between shells, tick-mark arcs,
// lines that branch and merge, tiny cube grids and readout plates.
const STRUCT_DETAIL = (() => {
  const rand = mulberry32(STRUCT_SEED + 7);
  const streaks = [];
  const scaffold = [];
  const seg = (arr, a, b) => arr.push(...a, ...b);

  for (let i = 0; i < 150; i++) {
    const n = randomDir(rand);
    const r0 = CORE_R + rand() * 3.2;
    seg(streaks, scale(n, r0), scale(n, Math.min(r0 + 0.25 + rand() * 1.6, 4.9)));
  }

  for (let i = 0; i < SHELL_RADII.length - 1; i++) {
    for (let k = 0; k < 16; k++) {
      const n = randomDir(rand);
      const m = unit(add(n, scale(randomDir(rand), 0.12)));
      seg(scaffold, scale(n, SHELL_RADII[i]), scale(m, SHELL_RADII[i + 1]));
    }
  }

  for (let i = 0; i < 9; i++) {
    const [u, v] = tangentBasis(randomDir(rand));
    const r = SHELL_RADII[1 + Math.floor(rand() * 5)] + 0.08;
    const t0 = rand() * Math.PI * 2;
    const steps = Math.round((0.5 + rand()) / 0.05);
    for (let s = 0; s < steps; s++) {
      const a = t0 + s * 0.05;
      const pa = add(scale(u, Math.cos(a)), scale(v, Math.sin(a)));
      const pb = add(scale(u, Math.cos(a + 0.05)), scale(v, Math.sin(a + 0.05)));
      seg(scaffold, scale(pa, r), scale(pb, r));
      seg(scaffold, scale(pa, r), scale(pa, r + (s % 5 === 0 ? 0.1 : 0.045)));
    }
  }

  for (let i = 0; i < 10; i++) {
    const n = randomDir(rand);
    const [u, v] = tangentBasis(n);
    const r = SHELL_RADII[2 + Math.floor(rand() * 4)] + 0.04;
    const L = 0.18 + rand() * 0.12;
    const W = 0.08 + rand() * 0.08;
    const P = ([x, y]) => onSphere(n, u, v, r, x, y);
    const pts = [[0, 0], [L, 0], [2 * L, W], [2 * L, -W], [3 * L, 0], [4 * L, 0], [2.6 * L, 2 * W]];
    [[0, 1], [1, 2], [1, 3], [2, 4], [3, 4], [4, 5], [2, 6]].forEach(([a, b]) => seg(scaffold, P(pts[a]), P(pts[b])));
  }

  const cubes = [];
  for (let i = 0; i < 7; i++) {
    const n = randomDir(rand);
    const [u, v] = tangentBasis(n);
    const r = SHELL_RADII[1 + Math.floor(rand() * 5)] + 0.1;
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 4; y++) {
        if (rand() < 0.28) continue;
        cubes.push({ pos: onSphere(n, u, v, r, x * 0.075, y * 0.075), normal: n, size: [0.038, 0.038, 0.038] });
      }
    }
  }

  const readouts = [];
  const bars = [];
  for (let i = 0; i < 26; i++) {
    const n = randomDir(rand);
    const [u, v] = tangentBasis(n);
    const r = SHELL_RADII[1 + Math.floor(rand() * 5)] + 0.14;
    readouts.push({ pos: scale(n, r), normal: n, size: [0.15, 0.075, 0.008] });
    for (let b = 0; b < 3; b++) {
      const w = 0.03 + rand() * 0.08;
      bars.push({
        pos: add(onSphere(n, u, v, r, -0.06 + w / 2, 0.022 - b * 0.022), scale(n, 0.006)),
        normal: n,
        size: [w, 0.008, 0.004],
      });
    }
  }

  return { streaks, scaffold, cubes, readouts, bars };
})();

const TOP_LANG = [...LANG_NODES].sort((a, b) => LANG_TOTALS[b.key] - LANG_TOTALS[a.key])[0].key;

// Language chambers on a squashed Fibonacci sphere across the three inner
// shells; the busiest languages take the slots nearest the equator.
{
  const rand = mulberry32(STRUCT_SEED + 31);
  const n = LANG_NODES.length;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const yaw = rand() * Math.PI * 2;
  const slots = Array.from({ length: n }, (_, i) => {
    const y = 1 - ((i + 0.5) / n) * 2;
    const ring = Math.sqrt(1 - y * y);
    return [Math.cos(i * golden + yaw) * ring, y * 0.85, Math.sin(i * golden + yaw) * ring];
  }).sort((a, b) => Math.abs(a[1]) - Math.abs(b[1]));
  const max = LANG_TOTALS[TOP_LANG];
  [...LANG_NODES]
    .sort((a, b) => LANG_TOTALS[b.key] - LANG_TOTALS[a.key])
    .forEach((lang, i) => {
      const size = Math.sqrt(LANG_TOTALS[lang.key] / max);
      lang.pos = scale(unit(slots[i]), [1.45, 1.9, 2.3][i % 3]).map(round2);
      lang.chamberR = round2(0.06 + 0.3 * size);
      lang.chamberH = round2(0.2 + 0.8 * size);
      lang.ringR = round2(lang.chamberR * 1.9 + 0.06);
      lang.ringTilt = [round2((rand() - 0.5) * 0.7), 0, round2((rand() - 0.5) * 0.7)];
      const start = rand() * Math.PI * 2;
      lang.ringArcs = [0, 1, 2].map((k) => ({ start: start + (k * 2 * Math.PI) / 3, length: 1.6 + rand() * 0.3 }));
    });
}

// Each repo gets its own anodised-metal tint, so the monoliths and cubes
// read as different pieces; ice blue stays reserved for the active state.
const REPO_TINTS = [
  "#D9A38F", // rose gold
  "#6F8FE0", // sapphire
  "#7CC4A4", // jade
  "#B49AD8", // amethyst
  "#E0C48A", // champagne
  "#C8835E", // copper
  "#C9707F", // garnet
  "#CDB79E", // sand
];
PROJECT_NODES.filter((p) => p.big)
  .concat(PROJECT_NODES.filter((p) => !p.big))
  .forEach((p, i) => (p.tint = REPO_TINTS[i % REPO_TINTS.length]));

// Where a conduit plugs into a layer of a monolith (its inner face) or into
// a repo cube (its inner side).
const ZAXIS = new Vector3(0, 0, 1);
const FEATURED = PROJECT_NODES.filter((p) => p.big);
const FEATURED_TOTALS = FEATURED.map((p) => p.total);

FEATURED.forEach((p, i) => {
  const rand = mulberry32(STRUCT_SEED + 50 + i);
  const n = FEATURED.length;
  const y = -0.55 + 1.1 * ((i * 0.618 + 0.3) % 1);
  const t = 0.4 + (i * 2 * Math.PI) / n + (rand() - 0.5) * 0.3;
  const dir = unit([Math.cos(t) * Math.sqrt(1 - y * y), y, Math.sin(t) * Math.sqrt(1 - y * y)]);
  const H = logScale(p.total, Math.min(...FEATURED_TOTALS), Math.max(...FEATURED_TOTALS), 0.95, 1.85);
  const W = 0.36 + rand() * 0.12;
  const D = 0.17;
  const raw = p.shares.map(([, share]) => Math.max(share, 0.06));
  const rawSum = raw.reduce((a, b) => a + b, 0);
  const gap = 0.025;
  let yCursor = -H / 2;
  const layers = p.shares.map(([key], k) => {
    const h = (raw[k] / rawSum) * (H - gap * (p.shares.length - 1));
    const layer = { key, y: round2(yCursor + h / 2), h: round2(h), inset: k % 2 ? 0.93 : 1 };
    yCursor += h + gap;
    return layer;
  });
  const facing = Math.atan2(dir[0], dir[2]);
  // Local -z is the inner face; rotate (0, ly, -D/2) by `facing` into the world.
  const plug = (ly) =>
    add(scale(dir, BLOCK_RING), [Math.sin(facing) * (-D / 2), ly, Math.cos(facing) * (-D / 2)]).map(round2);
  p.block = {
    pos: scale(dir, BLOCK_RING).map(round2),
    facing: round2(facing),
    H: round2(H),
    W: round2(W),
    D,
    silhouette: i % 4,
    layers,
    plugs: Object.fromEntries(layers.map((l) => [l.key, plug(l.y)])),
  };
});

// The other repos: three grids of cubes on the outermost shell.
{
  const rand = mulberry32(STRUCT_SEED + 70);
  const rest = PROJECT_NODES.filter((p) => !p.big);
  const per = Math.ceil(rest.length / 3);
  [[0.35, 0.95], [-0.25, 3.05], [0.15, 5.0]].forEach(([y, t], g) => {
    const n = unit([Math.cos(t + (rand() - 0.5) * 0.3), y, Math.sin(t + (rand() - 0.5) * 0.3)]);
    const [u, v] = tangentBasis(n);
    rest.slice(g * per, (g + 1) * per).forEach((p, k) => {
      const pos = onSphere(n, u, v, CUBE_RING, ((k % 3) - 1) * 0.2, (Math.floor(k / 3) - 1) * 0.2).map(round2);
      const q = new Quaternion().setFromUnitVectors(ZAXIS, new Vector3(...unit(pos)));
      p.cube = {
        pos,
        quat: [q.x, q.y, q.z, q.w].map((c) => Math.round(c * 1e4) / 1e4),
        plug: scale(unit(pos), CUBE_RING - 0.07).map(round2),
      };
    });
  });
}

// A conduit leaves its chamber outward, bows through the gap between the
// shells and comes in to its plug from the inside. Three strands braid
// around that path and pull together at both ends.
function conduitStrands(start, end, bulge) {
  const a = unit(start);
  const b = unit(end);
  const sum = add(a, b);
  const midDir = len(sum) > 0.2 ? unit(sum) : tangentBasis(a)[0];
  const mid = scale(midDir, (len(start) + len(end)) / 2 + bulge);
  const curve = new CatmullRomCurve3(
    [start, scale(a, len(start) + 0.35), mid, scale(b, len(end) - 0.4), end].map((p) => new Vector3(...p)),
    false,
    "centripetal"
  );
  const N = 90;
  const frames = curve.computeFrenetFrames(N, false);
  const turns = Math.max(3, Math.round(curve.getLength() * 2.2));
  return [0, 1, 2].map((k) =>
    Array.from({ length: N + 1 }, (_, j) => {
      const t = j / N;
      const p = curve.getPointAt(t);
      const angle = t * turns * Math.PI * 2 + (k * 2 * Math.PI) / 3;
      const r = 0.03 * Math.sqrt(Math.sin(Math.PI * t));
      const o = frames.normals[j].clone().multiplyScalar(Math.cos(angle) * r).add(frames.binormals[j].clone().multiplyScalar(Math.sin(angle) * r));
      return [p.x + o.x, p.y + o.y, p.z + o.z].map((c) => Math.round(c * 1000) / 1000);
    })
  );
}

const STRUCT_EDGES = PROJECT_NODES.flatMap((p, i) =>
  p.majorKeys.map((key) => {
    const lang = LANG_BY_KEY[key];
    const end = p.block ? p.block.plugs[key] : p.cube.plug;
    return { project: p.name, key, big: p.big, strands: conduitStrands(lang.pos, end, 0.35 + ((i * 7) % 5) * 0.08) };
  })
);

// Boxes that share one material, drawn in a single call.
function InstancedBoxes({ items, color, emissive = "#000000", emissiveIntensity = 0, metalness = 0.5, roughness = 0.45 }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new Object3D();
    const normal = new Vector3();
    items.forEach((it, i) => {
      dummy.position.set(...it.pos);
      dummy.quaternion.setFromUnitVectors(ZAXIS, normal.set(...it.normal));
      dummy.rotateZ(it.spin || 0);
      dummy.scale.set(...it.size);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        metalness={metalness}
        roughness={roughness}
      />
    </instancedMesh>
  );
}

function LineCloud({ positions, opacity }) {
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return g;
  }, [positions]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={MONO.line} transparent opacity={opacity} depthWrite={false} />
    </lineSegments>
  );
}

function Shell3D({ shell, index, spinning }) {
  const ref = useRef(null);
  const axis = useMemo(() => new Vector3(...shell.axis).normalize(), [shell]);

  useFrame((_, delta) => {
    if (spinning && ref.current) ref.current.rotateOnWorldAxis(axis, shell.spin * delta);
  });

  return (
    <group ref={ref}>
      {shell.rings.map((ring, i) => (
        <group key={i} rotation={ring.rotation}>
          {ring.arcs.map((a, j) =>
            a.band ? (
              <mesh key={j}>
                <ringGeometry
                  args={[shell.r - a.width / 2, shell.r + a.width / 2, Math.max(8, Math.round(a.length * 24)), 1, a.start, a.length]}
                />
                <meshStandardMaterial
                  color={index === 4 ? ACCENT.navy : MONO.plate}
                  metalness={index === 4 ? 0.75 : 0.6}
                  roughness={index === 4 ? 0.35 : 0.42}
                  side={DoubleSide}
                />
              </mesh>
            ) : (
              <mesh key={j} rotation={[0, 0, a.start]}>
                <torusGeometry args={[shell.r, a.tube, 4, Math.max(8, Math.round(a.length * 28)), a.length]} />
                <meshStandardMaterial
                  color={index === 2 ? ACCENT.gold : MONO.metal}
                  metalness={index === 2 ? 0.85 : 0.7}
                  roughness={index === 2 ? 0.28 : 0.32}
                />
              </mesh>
            )
          )}
        </group>
      ))}
      <InstancedBoxes items={shell.plates} color={MONO.plate} metalness={0.55} roughness={0.5} />
    </group>
  );
}

function Core3D({ spinning }) {
  const ref = useRef(null);
  useFrame((_, delta) => {
    if (spinning && ref.current) ref.current.rotation.y += delta * 0.06;
  });
  return (
    <group ref={ref}>
      <mesh>
        <icosahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color={MONO.metal} metalness={0.75} roughness={0.28} flatShading />
      </mesh>
      <InstancedBoxes
        items={CORE_BLOCKS}
        color={ACCENT.ice}
        emissive={ACCENT.iceGlow}
        emissiveIntensity={0.35}
        metalness={0.45}
        roughness={0.3}
      />
      {CORE_KNOTS.map((k, i) => (
        <mesh key={i} rotation={k.rotation}>
          <torusKnotGeometry args={[k.r, 0.006, 220, 5, k.p, k.q]} />
          <meshStandardMaterial color={ACCENT.gold} metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

// A language: a vertical chamber with a charge inside, capped by rings and
// held in its own broken gold ring. The active language's charge burns ice blue.
function LangChamber3D({ node, isActive, isHot, onHover, onLeave, onSelect }) {
  const { chamberR: r, chamberH: h, ringR } = node;
  const fade = isActive ? 1 : 0.25;

  return (
    <group position={node.pos}>
      <mesh {...pointerHandlers(onHover, onLeave, onSelect)}>
        <cylinderGeometry args={[r, r, h, 12, 1, true]} />
        <meshStandardMaterial
          color={MONO.metal}
          metalness={0.7}
          roughness={0.3}
          side={DoubleSide}
          transparent
          opacity={0.8 * fade}
        />
        <Edges threshold={10} color={isHot ? ACCENT.ice : MONO.line} lineWidth={isHot ? 1.4 : 0.8} transparent opacity={fade} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[r * 0.5, r * 0.5, h * 0.86, 16]} />
        <meshStandardMaterial
          color={isHot ? ACCENT.iceLight : MONO.dark}
          emissive={ACCENT.iceGlow}
          emissiveIntensity={isHot ? 2.2 : 0.08}
          metalness={0.3}
          roughness={0.5}
          transparent
          opacity={fade}
        />
      </mesh>
      {[h / 2, -h / 2].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r * 1.06, Math.max(0.008, r * 0.08), 6, 28]} />
          <meshStandardMaterial color={ACCENT.gold} metalness={0.85} roughness={0.28} transparent opacity={fade} />
        </mesh>
      ))}
      <group rotation={node.ringTilt}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          {node.ringArcs.map((a, i) => (
            <mesh key={i} rotation={[0, 0, a.start]}>
              <torusGeometry args={[ringR, 0.014, 4, 24, a.length]} />
              <meshStandardMaterial
                color={isHot ? ACCENT.gold : ACCENT.goldDeep}
                emissive={ACCENT.gold}
                emissiveIntensity={isHot ? 0.5 : 0}
                metalness={0.85}
                roughness={0.32}
                transparent
                opacity={fade}
              />
            </mesh>
          ))}
        </group>
      </group>
      <NodeLabel anchor={node.pos} offset={[0, -h / 2 - 0.2, 0]} variant="plate" distanceFactor={6} dim={!isActive} focus={isHot}>
        {node.name}
        <b>{node.pctLabel}</b>
      </NodeLabel>
    </group>
  );
}

// A featured repo: a faceted monolith whose stacked layers are its
// languages, biggest at the bottom, with an engraved plate beneath it.
function RepoMonolith3D({ node, isActive, isHot, hotKey, onHover, onLeave, onSelect }) {
  const b = node.block;
  const fade = isActive ? 1 : 0.22;
  const top = b.H / 2;
  const { tint } = node;

  return (
    <group position={b.pos} rotation={[0, b.facing, 0]} {...pointerHandlers(onHover, onLeave, onSelect)}>
      {b.layers.map((l, k) => {
        const lit = isHot || hotKey === l.key;
        return (
          <mesh key={l.key} position={[0, l.y, 0]} scale={[(b.W / 2) * l.inset, l.h, b.D / 2]}>
            <cylinderGeometry args={[1, 1, 1, 6]} />
            <meshStandardMaterial
              color={lit ? ACCENT.iceLight : k % 2 ? lighten(tint, 0.12) : tint}
              emissive={ACCENT.iceGlow}
              emissiveIntensity={lit ? 0.9 : 0}
              metalness={0.75}
              roughness={0.28}
              transparent
              opacity={0.95 * fade}
            />
            <Edges threshold={15} color={lit ? ACCENT.ice : darken(tint, 0.45)} lineWidth={lit ? 1.4 : 0.8} transparent opacity={fade} />
          </mesh>
        );
      })}
      {b.silhouette === 1 && (
        <mesh position={[0, top + 0.09, 0]} scale={[b.W / 2, 0.16, b.D / 2]}>
          <cylinderGeometry args={[0.55, 1, 1, 6]} />
          <meshStandardMaterial color={tint} metalness={0.75} roughness={0.28} transparent opacity={0.95 * fade} />
        </mesh>
      )}
      {b.silhouette === 2 && (
        <mesh position={[0, top + 0.08, 0]} scale={[b.W * 0.27, 0.14, b.D * 0.4]}>
          <cylinderGeometry args={[1, 1, 1, 6]} />
          <meshStandardMaterial color={tint} metalness={0.75} roughness={0.28} transparent opacity={0.95 * fade} />
        </mesh>
      )}
      {b.silhouette === 3 && (
        <mesh position={[b.W * 0.22, top + 0.15, 0]}>
          <boxGeometry args={[b.W * 0.12, 0.3, b.D * 0.5]} />
          <meshStandardMaterial color={tint} metalness={0.75} roughness={0.28} transparent opacity={0.95 * fade} />
        </mesh>
      )}
      <mesh position={[0, -top - 0.1, 0]}>
        <boxGeometry args={[b.W * 0.95, 0.07, 0.03]} />
        <meshStandardMaterial color={ACCENT.goldDeep} metalness={0.85} roughness={0.3} transparent opacity={fade} />
      </mesh>
      <NodeLabel
        anchor={b.pos}
        offset={[0, -top - 0.24, 0]}
        variant="plate"
        color={tint}
        swatch
        distanceFactor={6}
        dim={!isActive}
        focus={isHot}
      >
        {node.label}
      </NodeLabel>
    </group>
  );
}

// Any other repo: a small cube in a grid on the outermost shell.
function RepoCube3D({ node, isActive, isHot, showLabel, onHover, onLeave, onSelect }) {
  const c = node.cube;
  return (
    <group position={c.pos} quaternion={c.quat}>
      <mesh {...pointerHandlers(onHover, onLeave, onSelect)}>
        <boxGeometry args={[0.11, 0.11, 0.11]} />
        <meshStandardMaterial
          color={isHot ? ACCENT.iceLight : node.tint}
          emissive={ACCENT.iceGlow}
          emissiveIntensity={isHot ? 0.9 : 0}
          metalness={0.75}
          roughness={0.3}
          transparent
          opacity={isActive ? 1 : 0.25}
        />
        <Edges color={isHot ? ACCENT.ice : darken(node.tint, 0.45)} lineWidth={0.8} />
      </mesh>
      {showLabel && (
        <NodeLabel anchor={c.pos} offset={[0, 0.16, 0]} variant="plate" color={node.tint} swatch distanceFactor={6} focus={isHot}>
          {node.label}
        </NodeLabel>
      )}
    </group>
  );
}

// An active conduit: three braided ice-blue tubes with a pulse running along
// them from the language to the repo.
function HotConduit3D({ edge }) {
  const geometries = useMemo(
    () =>
      edge.strands.map(
        (pts) => new TubeGeometry(new CatmullRomCurve3(pts.map((p) => new Vector3(...p))), 96, edge.big ? 0.009 : 0.006, 6, false)
      ),
    [edge]
  );
  const path = useMemo(() => new CatmullRomCurve3(edge.strands[0].map((p) => new Vector3(...p))), [edge]);
  const pulseRef = useRef(null);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  useFrame(({ clock }) => {
    if (pulseRef.current) pulseRef.current.position.copy(path.getPointAt((clock.elapsedTime * 0.35) % 1));
  });

  return (
    <group>
      {geometries.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial color={ACCENT.ice} emissive={ACCENT.iceGlow} emissiveIntensity={0.6} metalness={0.4} roughness={0.35} />
        </mesh>
      ))}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[edge.big ? 0.028 : 0.018, 12, 12]} />
        <meshBasicMaterial color={ACCENT.iceLight} />
      </mesh>
    </group>
  );
}

// A resting conduit: two thin braided threads that recede.
function Conduit3D({ edge, dim }) {
  return edge.strands.slice(0, 2).map((pts, i) => (
    <Line key={i} points={pts} color={MONO.line} lineWidth={0.8} transparent opacity={dim ? 0.07 : 0.3} depthWrite={false} />
  ));
}

// The stage for pane 01: a 3/4 hero angle from slightly below, monochrome
// light from soft panels, and on desktop ambient occlusion, a little bloom
// for the active state and depth of field focused on the core.
function StructureScene({ isMobile, spinning, onStopSpinning, onMissed, children }) {
  return (
    <Canvas
      camera={{ position: [9.6, -3.2, 12.5], fov: 34 }}
      gl={{ alpha: true, antialias: !isMobile }}
      resize={{ offsetSize: true }}
      dpr={isMobile ? 1 : [1, 1.5]}
      onPointerMissed={onMissed}
    >
      <color attach="background" args={["#05060a"]} />
      <fog attach="fog" args={["#05060a", 13, 25]} />
      <ambientLight intensity={0.18} />
      <directionalLight position={[5, 8, 6]} intensity={1.4} />
      <directionalLight position={[-6, -2, -5]} intensity={0.7} color="#cfd8ff" />
      <pointLight position={[0, -6, 3]} intensity={0.4} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 6, 4]} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={1.1} position={[-6, 1, -4]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="ring" intensity={1.4} position={[5, -3, 6]} scale={3} />
      </Environment>
      <Stars radius={45} depth={25} count={isMobile ? 300 : 900} factor={1.8} saturation={0} fade speed={0.2} />

      {children}

      {isMobile ? (
        <AutoOrbitCamera enabled={spinning} target={[0, 0, 0]} radius={17} height={-2.8} />
      ) : (
        <OrbitControls
          target={[0, 0, 0]}
          enablePan={false}
          minDistance={8}
          maxDistance={22}
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI - 0.15}
          rotateSpeed={0.6}
          zoomSpeed={0.8}
          autoRotate={spinning}
          autoRotateSpeed={0.4}
          onStart={onStopSpinning}
          makeDefault
        />
      )}

      {!isMobile && (
        <EffectComposer multisampling={0}>
          <N8AO halfRes quality="performance" aoRadius={0.6} intensity={2.2} distanceFalloff={0.6} />
          <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.15} intensity={0.6} mipmapBlur radius={0.5} />
          <DepthOfField target={[0, 0, 0]} worldFocusRange={4.5} bokehScale={2.2} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

// Full screen for a graph pane: the real Fullscreen API where the browser
// has it, and on iPhone (where only videos may go full screen) an overlay
// portalled to <body> instead, closed by the button or Escape.
function useGraphFullscreen(ref) {
  const [mode, setMode] = useState(null); // null | "native" | "overlay"

  useEffect(() => {
    const onChange = () => {
      const el = document.fullscreenElement || document.webkitFullscreenElement;
      setMode((m) => (el && el === ref.current ? "native" : m === "native" ? null : m));
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [ref]);

  useEffect(() => {
    if (mode !== "overlay") return;
    const onKey = (e) => {
      if (e.key === "Escape") setMode(null);
    };
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mode]);

  const toggle = () => {
    if (mode === "native") {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
      return;
    }
    if (mode === "overlay") {
      setMode(null);
      return;
    }
    const el = ref.current;
    const request = el?.requestFullscreen || el?.webkitRequestFullscreen;
    if (!request) {
      setMode("overlay");
      return;
    }
    Promise.resolve(request.call(el)).catch(() => setMode("overlay"));
  };

  return [mode, toggle];
}

// The small corner button that toggles a graph pane in and out of full
// screen. It keeps its press to itself, so it doesn't stop the auto-turn.
function FullscreenButton({ mode, onToggle }) {
  const label = mode ? "Exit full screen" : "Full screen";
  return (
    <button
      type="button"
      className="lang-graph-fullscreen"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onToggle}
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={mode ? "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" : "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"} />
      </svg>
    </button>
  );
}

function LanguagesPane() {
  const isMobile = useIsMobile();
  const rootRef = useRef(null);
  const [fullscreen, toggleFullscreen] = useGraphFullscreen(rootRef);
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

  // In 3D one language is always "hot": the hovered or pinned one, a picked
  // repo's languages, the search matches, or else the most used language.
  const hotKey = searching || active?.type === "project" ? null : active?.type === "lang" ? active.key : TOP_LANG;
  const hotEdge = (e) => {
    if (searching) return searchLangKeys.has(e.key) && searchProjectNames.has(e.project);
    if (active?.type === "project") return e.project === active.name;
    return e.key === hotKey;
  };
  const hotLang = (key) =>
    searching
      ? searchLangKeys.has(key)
      : active?.type === "project"
        ? PROJECT_BY_NAME[active.name].majorKeys.includes(key)
        : key === hotKey;
  const hotProject = (name) =>
    searching ? searchProjectNames.has(name) : active?.type === "project" ? active.name === name : PROJECT_BY_NAME[name].majorKeys.includes(hotKey);
  const dimming = searching || !!active;

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

  const graph = (
    <div
      ref={rootRef}
      className={`lang-graph${fullscreen ? " is-fullscreen" : ""}${fullscreen === "overlay" ? " is-overlay" : ""}`}
    >
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
              <span className="ide-folder-dot" style={{ background: p.tint }} />
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
          <FullscreenButton mode={fullscreen} onToggle={toggleFullscreen} />
          <StructureScene
            isMobile={isMobile}
            spinning={spinning}
            onStopSpinning={stopSpinning}
            onMissed={() => setPinned(null)}
          >
            <Core3D spinning={spinning} />
            {SHELLS.map((shell, i) => (
              <Shell3D key={i} index={i} shell={shell} spinning={spinning} />
            ))}
            <LineCloud positions={STRUCT_DETAIL.streaks} opacity={0.16} />
            <LineCloud positions={STRUCT_DETAIL.scaffold} opacity={0.34} />
            <InstancedBoxes items={STRUCT_DETAIL.cubes} color={MONO.metal} metalness={0.6} roughness={0.4} />
            <InstancedBoxes items={STRUCT_DETAIL.readouts} color={MONO.dark} metalness={0.4} roughness={0.6} />
            <InstancedBoxes items={STRUCT_DETAIL.bars} color={ACCENT.ice} emissive={ACCENT.iceGlow} emissiveIntensity={0.5} />

            {LANG_NODES.map((s) => (
              <LangChamber3D
                key={s.key}
                node={s}
                isActive={langActive(s.key)}
                isHot={hotLang(s.key)}
                onHover={() => hoverLang(s.key)}
                onLeave={clearHover}
                onSelect={() => selectLang(s.key)}
              />
            ))}

            {FEATURED.map((p) => (
              <RepoMonolith3D
                key={p.name}
                node={p}
                isActive={projectActive(p.name)}
                isHot={active?.type === "project" && active.name === p.name}
                hotKey={hotKey}
                onHover={() => hoverProject(p.name)}
                onLeave={clearHover}
                onSelect={() => selectProject(p.name)}
              />
            ))}

            {PROJECT_NODES.filter((p) => p.cube).map((p) => (
              <RepoCube3D
                key={p.name}
                node={p}
                isActive={projectActive(p.name)}
                isHot={hotProject(p.name)}
                showLabel={dimming && hotProject(p.name)}
                onHover={() => hoverProject(p.name)}
                onLeave={clearHover}
                onSelect={() => selectProject(p.name)}
              />
            ))}

            {STRUCT_EDGES.map((edge) =>
              hotEdge(edge) ? (
                <HotConduit3D key={`${edge.project}-${edge.key}-hot`} edge={edge} />
              ) : edge.big ? (
                <Conduit3D key={`${edge.project}-${edge.key}`} edge={edge} dim={dimming} />
              ) : null
            )}
          </StructureScene>
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

  return fullscreen === "overlay" ? createPortal(graph, document.body) : graph;
}

// Pane 02 reads the same code city for backend and data. Every public repo
// with a server or a database is a building in the district of its backend,
// and its floors are its stack: the data layer at the bottom (one floor per
// database, in that database's color), then the framework, then auth. The
// databases stand as silos in the middle, wired to the buildings that use
// them. Found by reading each repo's manifests (package.json, pom.xml,
// Gradle, Cargo) and the code that imports them, October 2026; `bytes` is
// the size of each repo's backend source only.
// A curated palette rather than brand colours: metals for the backends,
// muted gemstones for the databases, champagne gold for auth, matching the
// accents of pane 01.
const BACKENDS = {
  express: { name: "Express", note: "Node.js", color: "#DADFE6" }, // platinum
  spring: { name: "Spring Boot", note: "Java", color: "#93B88C" }, // sage
  nextapi: { name: "Next.js API", note: "Route handlers", color: ACCENT.ice },
  hono: { name: "Hono", note: "Node.js", color: "#C9825B" }, // copper
  soroban: { name: "Soroban", note: "Stellar smart contract", color: "#B8A2E3" }, // amethyst
  device: { name: "On-device", note: "No server", color: "#8E97A6" }, // pewter
};

const DATABASES = {
  mongodb: { name: "MongoDB", type: "Document database", color: "#4FBF8F" }, // emerald
  postgres: { name: "PostgreSQL", type: "Relational database", color: "#5B7FE0" }, // sapphire
  h2: { name: "H2", type: "In-memory SQL", color: "#7FD1D6" }, // aquamarine
  supabase: { name: "Supabase Storage", type: "Object storage", color: "#3FA99A" }, // jade
  redis: { name: "Redis", type: "Key-value (Upstash)", color: "#D0606E" }, // garnet
  cloudinary: { name: "Cloudinary", type: "Media storage", color: "#E4A6C0" }, // rose quartz
  sqlite: { name: "SQLite", type: "On-device SQL (Room)", color: "#D9C7A3" }, // pearl
  ledger: { name: "Stellar ledger", type: "On-chain storage", color: "#E0A845" }, // amber
};

const AUTH_COLOR = ACCENT.gold;

// data: [database, the library that talks to it]; auth: how people sign in.
const BACKEND_REPOS = [
  { name: "Swasthya-Neeti", big: true, backend: "express", data: [["mongodb", "Mongoose"]], auth: "scrypt passwords", bytes: 121831 },
  { name: "Run-Neeti", big: true, backend: "express", data: [["mongodb", "Mongoose"]], auth: "scrypt passwords", bytes: 41473 },
  { name: "Doxentra", big: true, backend: "express", data: [["mongodb", "Mongoose"], ["supabase", "Storage API"]], auth: "scrypt passwords", bytes: 775689 },
  { name: "Glyph", backend: "express", data: [["mongodb", "Mongoose"], ["supabase", "Storage API"]], auth: "scrypt passwords", bytes: 601784 },
  { name: "CitySync", big: true, backend: "express", data: [], bytes: 206290 },
  { name: "DevTask", big: true, backend: "spring", data: [["postgres", "Spring Data JPA"]], auth: "Spring Security + JWT", bytes: 26244 },
  { name: "spring-security", backend: "spring", data: [["postgres", "Spring Data JPA"]], auth: "Spring Security + JWT", bytes: 18106 },
  { name: "OAuthExample", backend: "spring", data: [], auth: "OAuth2 (Google)", bytes: 1903 },
  { name: "SpringJPA", backend: "spring", data: [["h2", "Spring Data JPA"]], bytes: 4130 },
  { name: "ecom", backend: "spring", data: [["h2", "Spring Data JPA"]], bytes: 6948 },
  { name: "studentManagement", backend: "spring", data: [["h2", "Spring Data JPA"]], bytes: 2597 },
  { name: "mitarth", label: "Mitarth", big: true, backend: "nextapi", data: [["redis", "Upstash"]], bytes: 32013 },
  { name: "yap-render", label: "Yap-Render", big: true, backend: "nextapi", data: [], bytes: 10947 },
  { name: "Kahani-Studio", fork: true, backend: "nextapi", data: [["postgres", "Prisma"], ["cloudinary", "Cloudinary SDK"]], auth: "Admin passcode", bytes: 47286 },
  { name: "supportagent-agent", backend: "nextapi", data: [], auth: "Better Auth (Vercel)", bytes: 2533 },
  { name: "ScholarGuru", backend: "hono", data: [["postgres", "Neon driver"]], auth: "Auth.js", bytes: 8208 },
  { name: "Lottery---Raffle-Contract", label: "Lottery-Raffle-Contract", backend: "soroban", data: [["ledger", "Soroban storage"]], bytes: 2928 },
  { name: "yap-render-APP", backend: "device", data: [["sqlite", "Room"]], bytes: 48518 },
];

// Public repos with neither a server nor a database: frontends, a CLI, a
// console app and practice code.
const NO_BACKEND_REPOS = REPO_DATA.filter((r) => !BACKEND_REPOS.some((b) => b.name === r.name)).map((r) => r.label);

const SILO_R = 0.3;
const SILO_RING = 2.1; // the silos stand on a circle this wide in the middle
const DISTRICT_RING = 5.7; // and the districts around them, this far out

const BE_BYTES = BACKEND_REPOS.map((r) => r.bytes);
const BE_MIN = Math.min(...BE_BYTES);
const BE_MAX = Math.max(...BE_BYTES);

const BE_NODES = BACKEND_REPOS.map((r) => {
  const backend = BACKENDS[r.backend];
  const layers = [
    ...r.data.map(([key, lib]) => ({ key, color: DATABASES[key].color, lib })),
    { key: r.backend, color: backend.color },
    ...(r.auth ? [{ key: "auth", color: AUTH_COLOR }] : []),
  ];
  const height = logScale(r.bytes, BE_MIN, BE_MAX, 0.5, 3.2);
  const h = height / layers.length;
  return {
    ...r,
    label: r.label || r.name,
    size: r.big ? 0.56 : 0.4,
    dbs: r.data.map(([key]) => key),
    floors: layers.map((layer, i) => ({ ...layer, y: round2(h * (i + 0.5)), h: round2(h - 0.03) })),
    height: round2(height),
    roofColor: backend.color,
    url: `https://github.com/mitarthpathak/${r.name}`,
  };
});

const BE_BY_NAME = BE_NODES.reduce((acc, n) => ({ ...acc, [n.name]: n }), {});

// Districts ring the silos, busy ones alternating with small ones so the
// ring stays balanced; inside each, the tallest buildings stand outermost
// so they never hide the silos.
const BE_DISTRICTS = (() => {
  const all = Object.entries(BACKENDS)
    .map(([key, b]) => ({ key, ...b, repos: BE_NODES.filter((p) => p.backend === key) }))
    .filter((d) => d.repos.length)
    .sort((a, b) => b.repos.length - a.repos.length);
  const half = Math.ceil(all.length / 2);
  const ordered = all.slice(0, half).flatMap((d, i) => (all[half + i] ? [d, all[half + i]] : [d]));
  return ordered.map((d, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / ordered.length;
    const dir = [Math.cos(angle), Math.sin(angle)];
    const cols = Math.ceil(Math.sqrt(d.repos.length));
    const rows = Math.ceil(d.repos.length / cols);
    const w = cols * CELL + LOT_PAD * 2;
    const depth = rows * CELL + LOT_PAD * 2;
    const x = round2(dir[0] * DISTRICT_RING);
    const z = round2(dir[1] * DISTRICT_RING);
    const cells = Array.from({ length: cols * rows }, (_, c) => [
      round2(x - w / 2 + LOT_PAD + CELL * ((c % cols) + 0.5)),
      round2(z - depth / 2 + LOT_PAD + CELL * (Math.floor(c / cols) + 0.5)),
    ]).sort((a, b) => Math.hypot(b[0], b[1]) - Math.hypot(a[0], a[1]));
    [...d.repos]
      .sort((a, b) => b.height - a.height)
      .forEach((p, c) => {
        [p.x, p.z] = cells[c];
      });
    const count = d.repos.length;
    return {
      ...d,
      title: d.name,
      meta: `${count} repo${count === 1 ? "" : "s"}`,
      interactive: true,
      x,
      z,
      w,
      d: depth,
      // Name tags sit on the outer side of each lot, facing away from the middle.
      labelOffset: [round2(dir[0] * (w / 2 + 0.45)), 0.02, round2(dir[1] * (depth / 2 + 0.45))],
    };
  });
})();

// Each silo stands at the point of the ring nearest the buildings that use
// it, so most wires run short. Taller silos serve more repos.
const SILOS = (() => {
  const list = Object.entries(DATABASES)
    .map(([key, db]) => {
      const users = BE_NODES.filter((p) => p.dbs.includes(key));
      const mx = users.reduce((s, p) => s + p.x, 0) / (users.length || 1);
      const mz = users.reduce((s, p) => s + p.z, 0) / (users.length || 1);
      return { key, ...db, users, count: users.length, want: Math.atan2(mz, mx) };
    })
    .filter((s) => s.count)
    .sort((a, b) => a.want - b.want);
  return list.map((s, i) => {
    const angle = list[0].want + (i * 2 * Math.PI) / list.length;
    return {
      ...s,
      x: round2(Math.cos(angle) * SILO_RING),
      z: round2(Math.sin(angle) * SILO_RING),
      h: round2(0.55 + 0.32 * s.count),
    };
  });
})();

const SILO_BY_KEY = SILOS.reduce((acc, s) => ({ ...acc, [s.key]: s }), {});

// One wire per repo per database it uses, from the roof to the silo top.
const BE_EDGES = BE_NODES.flatMap((p) =>
  p.dbs.map((key) => {
    const silo = SILO_BY_KEY[key];
    return {
      project: p.name,
      key,
      color: DATABASES[key].color,
      width: 1.6,
      points: beamPoints([p.x, p.height + 0.04, p.z], [silo.x, silo.h + 0.04, silo.z]),
    };
  })
);

const MAX_BACKEND_REPOS = Math.max(...BE_DISTRICTS.map((d) => d.repos.length));
const MAX_DB_USERS = Math.max(...SILOS.map((s) => s.count));

// Everything tied to one selection: a repo's backend and databases, a
// backend's repos and their databases, a database's repos and their backends.
function backendRelations(sel) {
  const repos = BE_NODES.filter((p) =>
    sel.type === "project" ? p.name === sel.name : sel.type === "backend" ? p.backend === sel.key : p.dbs.includes(sel.key)
  );
  return {
    repos: new Set(repos.map((p) => p.name)),
    backends: new Set(sel.type === "backend" ? [sel.key] : repos.map((p) => p.backend)),
    dbs: new Set(sel.type === "db" ? [sel.key] : repos.flatMap((p) => p.dbs)),
  };
}

// A database: a silo shaped like the classic database icon — a cylinder
// with stacked disks — in its own gemstone colour, banded in gold.
function Silo3D({ silo, isActive, isFocus, onHover, onLeave, onSelect }) {
  const fade = isActive ? 1 : 0.15;
  const { color, h } = silo;

  return (
    <group position={[silo.x, 0, silo.z]} {...pointerHandlers(onHover, onLeave, onSelect)}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[SILO_R, SILO_R, h, 40, 1]} />
        <meshStandardMaterial
          color={darken(color, 0.6)}
          emissive={color}
          emissiveIntensity={isFocus ? 0.7 : 0.16}
          roughness={0.3}
          metalness={0.55}
          transparent
          opacity={0.9 * fade}
        />
        <Edges
          color={isFocus ? lighten(color, 0.35) : color}
          lineWidth={isFocus ? 1.8 : 1.1}
          threshold={20}
          transparent
          opacity={fade}
        />
      </mesh>
      {[h / 3, (2 * h) / 3].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[SILO_R + 0.004, 0.012, 8, 48]} />
          <meshBasicMaterial color={ACCENT.gold} transparent opacity={0.9 * fade} />
        </mesh>
      ))}
      <NodeLabel
        anchor={[silo.x, h, silo.z]}
        offset={[0, h + 0.24, 0]}
        variant="silo"
        color={color}
        dim={!isActive}
        focus={isFocus}
      >
        {silo.name}
        <b>{silo.count}</b>
      </NodeLabel>
    </group>
  );
}

function BackendPane() {
  const isMobile = useIsMobile();
  const rootRef = useRef(null);
  const [fullscreen, toggleFullscreen] = useGraphFullscreen(rootRef);
  const [hovered, setHovered] = useState(null);
  const [pinned, setPinned] = useState(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("network");
  // Same rule as pane 01: it turns until the first click or drag, then stays.
  const [spinning, setSpinning] = useState(true);
  const stopSpinning = () => setSpinning(false);

  const active = hovered || pinned;

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  let lit = null;
  if (searching) {
    const matches = [
      ...Object.entries(BACKENDS)
        .filter(([, b]) => b.name.toLowerCase().includes(q))
        .map(([key]) => ({ type: "backend", key })),
      ...SILOS.filter((s) => s.name.toLowerCase().includes(q)).map((s) => ({ type: "db", key: s.key })),
      ...BE_NODES.filter((p) => p.label.toLowerCase().includes(q)).map((p) => ({ type: "project", name: p.name })),
    ];
    lit = { repos: new Set(), backends: new Set(), dbs: new Set() };
    matches.forEach((m) => {
      const r = backendRelations(m);
      r.repos.forEach((x) => lit.repos.add(x));
      r.backends.forEach((x) => lit.backends.add(x));
      r.dbs.forEach((x) => lit.dbs.add(x));
    });
  } else if (active) {
    lit = backendRelations(active);
  }

  const backendActive = (key) => !lit || lit.backends.has(key);
  const dbActive = (key) => !lit || lit.dbs.has(key);
  const projectActive = (name) => !lit || lit.repos.has(name);
  const edgeState = (e) => (!lit ? "rest" : lit.repos.has(e.project) && lit.dbs.has(e.key) ? "focus" : "dim");

  const isSel = (type, id) => active?.type === type && (active.key ?? active.name) === id;
  const toggle = (sel) =>
    setPinned((p) => (p?.type === sel.type && (p.key ?? p.name) === (sel.key ?? sel.name) ? null : sel));
  const clearHover = () => setHovered(null);

  const detail = (() => {
    if (active?.type === "backend") {
      const b = BACKENDS[active.key];
      const repos = BE_NODES.filter((p) => p.backend === active.key);
      const dbs = new Set(repos.flatMap((p) => p.dbs));
      return {
        title: b.name,
        rows: [
          ["Runs on", b.note],
          ["Repos", `${repos.length}`],
          ["Databases", `${dbs.size}`],
        ],
        chips: repos.map((p) => p.label),
        link: null,
      };
    }
    if (active?.type === "db") {
      const s = SILO_BY_KEY[active.key];
      return {
        title: s.name,
        rows: [
          ["Type", s.type],
          ["Used by", `${s.count} repo${s.count === 1 ? "" : "s"}`],
        ],
        chips: s.users.map((p) => p.label),
        link: null,
      };
    }
    if (active?.type === "project") {
      const p = BE_BY_NAME[active.name];
      return {
        title: p.label,
        rows: [
          ["Backend", BACKENDS[p.backend].name],
          ["Data layer", p.data.map(([, lib]) => lib).join(", ") || "—"],
          ["Auth", p.auth || "—"],
          ["Backend code", `${Math.max(1, Math.round(p.bytes / 1024))} KB`],
        ],
        chips: p.dbs.map((key) => DATABASES[key].name),
        link: p.url,
      };
    }
    const top = SILOS.filter((s) => s.count === MAX_DB_USERS).map((s) => s.name);
    return {
      title: "Backend & data",
      rows: [
        ["Backends", `${BE_DISTRICTS.length}`],
        ["Databases", `${SILOS.length}`],
        ["Repos", `${BE_NODES.length} of ${REPO_DATA.length}`],
        ["Most used", top.join(", ")],
      ],
      chips: [],
      link: "https://github.com/mitarthpathak?tab=repositories",
    };
  })();

  const graph = (
    <div
      ref={rootRef}
      className={`lang-graph${fullscreen ? " is-fullscreen" : ""}${fullscreen === "overlay" ? " is-overlay" : ""}`}
    >
      <div className="lang-graph-header">
        <label className="lang-graph-search">
          <span className="lang-graph-search-icon">&#9906;</span>
          <input
            type="text"
            className="lang-graph-search-input"
            placeholder="Find backend, database, repo…"
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
          <p className="lang-graph-group-label">Backends ({BE_DISTRICTS.length})</p>
          {BE_DISTRICTS.map((d) => (
            <div
              key={d.key}
              className={`lang-graph-row ${backendActive(d.key) ? "" : "is-dim"} ${isSel("backend", d.key) ? "is-focus" : ""}`}
              onMouseEnter={() => setHovered({ type: "backend", key: d.key })}
              onMouseLeave={clearHover}
              onClick={() => toggle({ type: "backend", key: d.key })}
            >
              <span className="lang-graph-row-dot" style={{ background: d.color }} />
              <span className="lang-graph-row-name">{d.name}</span>
              <span className="lang-graph-row-bar">
                <span
                  className="lang-graph-row-bar-fill"
                  style={{ width: `${(d.repos.length / MAX_BACKEND_REPOS) * 100}%`, background: d.color }}
                />
              </span>
              <span className="lang-graph-row-pct">{d.repos.length}</span>
            </div>
          ))}

          <p className="lang-graph-group-label lang-graph-group-label-spaced">Databases ({SILOS.length})</p>
          {SILOS.map((s) => (
            <div
              key={s.key}
              className={`lang-graph-row ${dbActive(s.key) ? "" : "is-dim"} ${isSel("db", s.key) ? "is-focus" : ""}`}
              onMouseEnter={() => setHovered({ type: "db", key: s.key })}
              onMouseLeave={clearHover}
              onClick={() => toggle({ type: "db", key: s.key })}
            >
              <span className="lang-graph-row-dot" style={{ background: s.color }} />
              <span className="lang-graph-row-name">{s.name}</span>
              <span className="lang-graph-row-bar">
                <span
                  className="lang-graph-row-bar-fill"
                  style={{ width: `${(s.count / MAX_DB_USERS) * 100}%`, background: s.color }}
                />
              </span>
              <span className="lang-graph-row-pct">{s.count}</span>
            </div>
          ))}

          <p className="lang-graph-group-label lang-graph-group-label-spaced">Repos ({BE_NODES.length})</p>
          {BE_NODES.map((p) => (
            <div
              key={p.name}
              className={`lang-graph-row ${projectActive(p.name) ? "" : "is-dim"} ${p.big ? "is-big-row" : ""} ${isSel("project", p.name) ? "is-focus" : ""}`}
              onMouseEnter={() => setHovered({ type: "project", name: p.name })}
              onMouseLeave={clearHover}
              onClick={() => toggle({ type: "project", name: p.name })}
            >
              <span className="ide-folder-dot" />
              <span className="lang-graph-row-name">{p.label}</span>
              <span className="lang-graph-row-chips">
                {[BACKENDS[p.backend].color, ...p.dbs.map((key) => DATABASES[key].color)].map((c, i) => (
                  <span key={i} className="lang-graph-row-chipdot" style={{ background: c }} />
                ))}
              </span>
            </div>
          ))}

          <p className="lang-graph-group-label lang-graph-group-label-spaced">
            No backend ({NO_BACKEND_REPOS.length})
          </p>
          {NO_BACKEND_REPOS.map((label) => (
            <div key={label} className="lang-graph-row is-dim is-static">
              <span className="ide-folder-dot" />
              <span className="lang-graph-row-name">{label}</span>
            </div>
          ))}
        </div>

        <div className="lang-graph-canvas" style={{ cursor: isMobile ? "default" : "grab" }}>
          <FullscreenButton mode={fullscreen} onToggle={toggleFullscreen} />
          <CityScene
            isMobile={isMobile}
            spinning={spinning}
            onStopSpinning={stopSpinning}
            onMissed={() => setPinned(null)}
            camera={[12.5, 12.5, 16.5]}
            target={[0, 0.5, 0]}
            fog={[24, 44]}
            mobileOrbit={{ radius: 21, height: 14 }}
          >
            {/* The data center: the pad the silos stand on. */}
            <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[SILO_RING + 0.62, SILO_RING + 0.68, 96]} />
              <meshBasicMaterial color={ACCENT.goldDeep} transparent opacity={0.55} />
            </mesh>

            {BE_DISTRICTS.map((d) => (
              <District3D
                key={d.key}
                district={d}
                isActive={backendActive(d.key)}
                isFocus={isSel("backend", d.key)}
                onHover={() => setHovered({ type: "backend", key: d.key })}
                onLeave={clearHover}
                onSelect={() => toggle({ type: "backend", key: d.key })}
              />
            ))}

            {SILOS.map((s) => (
              <Silo3D
                key={s.key}
                silo={s}
                isActive={dbActive(s.key)}
                isFocus={isSel("db", s.key)}
                onHover={() => setHovered({ type: "db", key: s.key })}
                onLeave={clearHover}
                onSelect={() => toggle({ type: "db", key: s.key })}
              />
            ))}

            {BE_NODES.map((p) => (
              <Building3D
                key={p.name}
                node={p}
                isActive={projectActive(p.name)}
                isFocus={isSel("project", p.name)}
                focusKey={active && active.type !== "project" ? active.key : null}
                showLabel={p.big || isSel("project", p.name)}
                onHover={() => setHovered({ type: "project", name: p.name })}
                onLeave={clearHover}
                onSelect={() => toggle({ type: "project", name: p.name })}
              />
            ))}

            {BE_EDGES.map((edge) => (
              <Beam3D key={`${edge.project}-${edge.key}-${edgeState(edge)}`} edge={edge} state={edgeState(edge)} />
            ))}
          </CityScene>
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

  return fullscreen === "overlay" ? createPortal(graph, document.body) : graph;
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
        trackFillRef.current.style.transform = `scaleX(${progress})`;
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
              <span className="ide-breadcrumb-path">
                {active.featured} <span className="ide-breadcrumb-sep">&#8250;</span> {active.files[0].name}
              </span>
              {/* Which of the three panes is showing; the line under it fills as the section scrolls. */}
              <nav className="ide-stack-nav" aria-label="Tech stack sections">
                <ol className="ide-stack-nav-list">
                  {STACK.map((category, i) => (
                    <li
                      key={category.label}
                      className={`ide-stack-nav-item ${i === activeIndex ? "is-active" : ""}`}
                      aria-current={i === activeIndex ? "step" : undefined}
                    >
                      <span className="ide-stack-nav-index">0{i + 1}</span>
                      <span className="ide-stack-nav-label">{category.label}</span>
                    </li>
                  ))}
                </ol>
                <span className="ide-stack-nav-track">
                  <span className="ide-stack-nav-track-fill" ref={trackFillRef} />
                </span>
              </nav>
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

              <div className={`ide-main${active.mode === "grid" ? " ide-main-terminal" : " ide-main-graph"}`}>
                {active.mode === "ls" && <LanguagesPane />}
                {active.mode === "terminal" && <BackendPane />}
                {active.mode === "grid" && <FrameworkPane />}
              </div>
            </div>

            <StatusBar langMode={active.langMode} />
          </div>
        </div>
      </div>
    </section>
  );
}
