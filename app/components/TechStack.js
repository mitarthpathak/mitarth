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

const DOCKER_ASCII = [
  "                    ##        .",
  "              ## ## ##       ==",
  "           ## ## ## ## ##   ===",
  "       /\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\\___/ ===",
  "  ~~~ {~~ ~~~~ ~~~~ ~~~ ~~~~ ~~~ ~ /  ===- ~~~",
  "       \\______ o          __/",
  "        \\    \\        __/",
  "         \\____\\______/",
].join("\n");

const UBUNTU_ASCII = [
  "            .-/+oossssoo+/-.",
  "        `:+ssssssssssssssssss+:`",
  "      -+ssssssssssssssssssyyssss+-",
  "    .ossssssssssssssssssdMMMNysssso.",
  "   /ssssssssssshdmmNNmmyNMMMMhssssss/",
  "  +ssssssssshmydMMMMMMMNddddyssssssss+",
  " /sssssssshNMMMyhhyyyyhmNMMMNhssssssss/",
  ".ssssssssdMMMNhsssssssssshNMMMdssssssss.",
  "+sssshhhyNMMNyssssssssssssyNMMMysssssss+",
  "ossyNMMMNyMMhsssssssssssssshmmmhssssssso",
  "ossyNMMMNyMMhsssssssssssssshmmmhssssssso",
  "+sssshhhyNMMNyssssssssssssyNMMMysssssss+",
  ".ssssssssdMMMNhsssssssssshNMMMdssssssss.",
  " /sssssssshNMMMyhhyyyyhdNMMMNhssssssss/",
  "  +sssssssssdmydMMMMMMMMddddyssssssss+",
  "   /ssssssssssshdmNNNNmyNMMMMhssssss/",
  "    .ossssssssssssssssssdMMMNysssso.",
  "      -+sssssssssssssssssyyssss+-",
  "        `:+ssssssssssssssssss+:`",
  "            .-/+oossssoo+/-.",
].join("\n");

const UBUNTU_COLORBAR = [
  "#2e3436", "#cc0000", "#4e9a06", "#c4a000",
  "#3465a4", "#75507b", "#06989a", "#d3d7cf",
];

const TOOLS = [
  {
    kind: "fetch",
    name: "React Three Fiber",
    shell: "docker",
    cmd: "docker info",
    accent: "#2496ED",
    ascii: DOCKER_ASCII,
    info: [
      ["Containers", "12 (3 running)"],
      ["Images", "27"],
      ["Server Version", "24.0.7"],
      ["Storage Driver", "overlay2"],
      ["Cgroup Driver", "systemd"],
      ["Kernel Version", "6.4.0-generic"],
      ["Operating System", "Ubuntu 22.04.3 LTS"],
      ["Architecture", "x86_64"],
      ["CPUs", "8"],
      ["Total Memory", "15.6GiB"],
    ],
  },
  {
    kind: "cmd",
    name: "Next.js",
    shell: "npm",
    cmd: "npm run dev",
    lines: [
      "> portfolio@0.1.0 dev",
      "> next dev",
      "",
      "  ▲ Next.js 15.0.3",
      "  - Local:        http://localhost:3000",
      "",
      " ✓ Starting...",
      " ✓ Ready in 1284ms",
    ],
  },
  {
    kind: "fetch",
    name: "WSL Ubuntu",
    shell: "bash",
    prefixLine: "ongubuntu@ubuntu-16-10-yakkety-yak:~/Downloads$ neofetch",
    accent: "#E95420",
    tall: true,
    ascii: UBUNTU_ASCII,
    info: [
      ["OS", "Ubuntu 16.10 yakkety yak x86_64"],
      ["Model", "VMware Virtual Platform None"],
      ["Kernel", "4.4.0-34-generic"],
      ["Uptime", "2 hours, 9 mins"],
      ["Packages", "2097"],
      ["Shell", "bash 4.3.46"],
      ["Resolution", "1440x900"],
      ["DE", "Unity"],
      ["WM", "Compiz"],
      ["Theme", "Ambiance [GTK2/3]"],
      ["Icons", "Ubuntu-mono-dark [GTK2/3]"],
      ["Terminal", "gnome-terminal"],
      ["CPU", "Intel Core i5-2400S (1) @ 2.4GHz"],
      ["GPU", "VMware SVGA II Adapter"],
      ["Memory", "561MB / 983MB"],
    ],
    colorbar: UBUNTU_COLORBAR,
  },
];

// This session's actual working-tree changes.
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
  { name: "SAGACITY", label: "SAGACITY", big: false, langs: { TypeScript: 85271, JavaScript: 30239, CSS: 938 } },
  { name: "ScholarGuru", label: "ScholarGuru", big: false, langs: { HTML: 1293149, CSS: 320760, JavaScript: 194879, TypeScript: 145532, Batchfile: 1189, Shell: 1134 } },
  { name: "spring-security", label: "spring-security", big: false, langs: { Java: 18332 } },
  { name: "SpringJPA", label: "SpringJPA", big: false, langs: { Java: 4352 } },
  { name: "studentManagement", label: "studentManagement", big: false, langs: { Java: 2810 } },
  { name: "yap-render-APP", label: "yap-render-APP", big: false, langs: { JavaScript: 516130, Kotlin: 401299, TypeScript: 17466, HTML: 2358 } },
  { name: "yap-render-extension", label: "yap-render-extension", big: false, langs: { JavaScript: 548473, CSS: 8046, HTML: 6351 } },
];

function bytesToRadius(bytes, allBytes, min, max) {
  const lo = Math.log10(min + 1);
  const hi = Math.log10(max + 1);
  const t = hi > lo ? (Math.log10(bytes + 1) - lo) / (hi - lo) : 0.5;
  return round2(15 + t * 19);
}

const GRAPH_CENTER = { x: 330, y: 240 };
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

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// Gentle bezier bow so edges read as curved "pipelines" instead of flat wires.
function edgePath(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const bow = len * 0.14;
  const cx = round2(mx + nx * bow);
  const cy = round2(my + ny * bow);
  return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
}

function repoMajorEntries(repo) {
  const isNext = NEXTJS_REPOS.includes(repo.name);
  let nextBytes = 0;
  const entries = [];
  for (const [ghName, bytes] of Object.entries(repo.langs)) {
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

const GRAPH_EDGES = PROJECT_NODES.flatMap((p) =>
  p.majorKeys.map((key) => ({ project: p.name, key, big: p.big }))
);

const VIEW_W = 660;
const VIEW_H = 480;
const VIEW_MIN_W = 190;
const DEFAULT_VIEW = { x: 0, y: 0, w: VIEW_W, h: VIEW_H };

function LanguagesPane() {
  const [hovered, setHovered] = useState(null);
  const [pinned, setPinned] = useState(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [view, setView] = useState(DEFAULT_VIEW);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("network");
  const canvasRef = useRef(null);
  const tiltRaf = useRef(null);
  const tiltPending = useRef(null);
  const zoomRaf = useRef(null);
  const zoomPending = useRef(null);

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
  const clearOnBackgroundClick = (e) => {
    if (e.target === e.currentTarget) setPinned(null);
  };

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

  const zoomT = clamp((VIEW_W - view.w) / (VIEW_W - VIEW_MIN_W), 0, 1);

  const handleCanvasMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    const depth = 1 + zoomT * 1.6;
    tiltPending.current = { rx: -ny * 7 * depth, ry: nx * 10 * depth };
    if (!tiltRaf.current) {
      tiltRaf.current = requestAnimationFrame(() => {
        setTilt(tiltPending.current);
        tiltRaf.current = null;
      });
    }
  };

  const resetCanvas = () => {
    clearHover();
    setTilt({ rx: 0, ry: 0 });
    setView(DEFAULT_VIEW);
  };

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      zoomPending.current = { deltaY: e.deltaY, px, py };
      if (!zoomRaf.current) {
        zoomRaf.current = requestAnimationFrame(() => {
          const { deltaY, px: fx, py: fy } = zoomPending.current;
          setView((v) => {
            const scale = deltaY > 0 ? 1.14 : 1 / 1.14;
            const newW = clamp(v.w * scale, VIEW_MIN_W, VIEW_W);
            const newH = round2(newW * (VIEW_H / VIEW_W));
            const cursorX = v.x + fx * v.w;
            const cursorY = v.y + fy * v.h;
            const newX = clamp(round2(cursorX - fx * newW), -(VIEW_W - newW), VIEW_W - newW);
            const newY = clamp(round2(cursorY - fy * newH), -(VIEW_H - newH), VIEW_H - newH);
            return { x: newX, y: newY, w: newW, h: newH };
          });
          zoomRaf.current = null;
        });
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

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
              <span className="lang-graph-row-dot" style={{ background: FILE_ICONS[s.key]?.color }} />
              <span className="lang-graph-row-name">{s.name}</span>
              <span className="lang-graph-row-bar">
                <span
                  className="lang-graph-row-bar-fill"
                  style={{ width: `${s.pct}%`, background: FILE_ICONS[s.key]?.color }}
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
                  <span key={key} className="lang-graph-row-chipdot" style={{ background: FILE_ICONS[key]?.color }} />
                ))}
              </span>
            </div>
          ))}
        </div>

        <div
          className={`lang-graph-canvas ${zoomT > 0.02 ? "is-zoomed" : ""}`}
          ref={canvasRef}
          onMouseMove={handleCanvasMove}
          onMouseLeave={resetCanvas}
        >
          <svg
            viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
            className="lang-graph-svg"
            style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
            onClick={clearOnBackgroundClick}
          >
            <defs>
              <filter id="langNodeShadow" x="-60%" y="-60%" width="220%" height="220%">
                <feDropShadow dx="0" dy="3" stdDeviation="3.2" floodColor="#000000" floodOpacity="0.55" />
              </filter>
              <filter id="langEdgeGlow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="1.6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {MAJOR_KEYS.map((key) => (
                <radialGradient key={key} id={`sph-${key}`} cx="35%" cy="30%" r="75%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
                  <stop offset="38%" stopColor={FILE_ICONS[key]?.color} stopOpacity="1" />
                  <stop offset="100%" stopColor={FILE_ICONS[key]?.color} stopOpacity="1" />
                </radialGradient>
              ))}
            </defs>

            {GRAPH_EDGES.map((edge, i) => {
              const from = PROJECT_BY_NAME[edge.project];
              const to = LANG_BY_KEY[edge.key];
              const isActive = edgeActive(edge);
              const isFocused = edgeFocused(edge);
              return (
                <path
                  key={i}
                  d={edgePath(from.x, from.y, to.x, to.y)}
                  fill="none"
                  className={`lang-graph-edge ${isActive ? "is-active" : "is-dim"} ${edge.big ? "is-big-edge" : ""} ${isFocused ? "is-flowing" : ""}`}
                  stroke={FILE_ICONS[edge.key]?.color}
                  filter={isFocused ? "url(#langEdgeGlow)" : undefined}
                />
              );
            })}

            {PROJECT_NODES.map((p) => (
              <g
                key={p.name}
                className={`lang-graph-node ${projectActive(p.name) ? "" : "is-dim"} ${p.big ? "is-big" : "is-small"}`}
                onMouseEnter={() => hoverProject(p.name)}
                onMouseLeave={clearHover}
                onClick={() => selectProject(p.name)}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.r}
                  className="lang-graph-project-dot"
                  style={{
                    fill: p.big && p.dominant ? `url(#sph-${p.dominant})` : "rgba(255,255,255,0.55)",
                  }}
                  filter={p.big ? "url(#langNodeShadow)" : undefined}
                />
                {(p.big || (active?.type === "project" && active.name === p.name)) && (
                  <text
                    x={p.x + (p.x < GRAPH_CENTER.x ? -(p.r + 5) : p.r + 5)}
                    y={p.y + 3}
                    textAnchor={p.x < GRAPH_CENTER.x ? "end" : "start"}
                    className={`lang-graph-project-label ${p.big ? "is-big" : ""}`}
                  >
                    {p.label}
                  </text>
                )}
              </g>
            ))}

            {LANG_NODES.map((s) => (
              <g
                key={s.key}
                className={`lang-graph-node ${langActive(s.key) ? "" : "is-dim"} ${active?.type === "lang" && active.key === s.key ? "is-focus" : ""}`}
                onMouseEnter={() => hoverLang(s.key)}
                onMouseLeave={clearHover}
                onClick={() => selectLang(s.key)}
              >
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={s.r}
                  className="lang-graph-lang-dot"
                  style={{ fill: `url(#sph-${s.key})` }}
                  filter="url(#langNodeShadow)"
                />
                <text x={s.x} y={s.y + s.r + 15} textAnchor="middle" className="lang-graph-lang-label">
                  {s.name}
                </text>
              </g>
            ))}
          </svg>
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

function BackendPane() {
  const lines = [
    { cmd: "whoami" },
    { text: "" },
    { text: "Database:  PostgreSQL, MongoDB Atlas" },
    { text: "Backend:   Spring Boot, JWT" },
    { text: "Tools:     IntelliJ IDEA" },
  ];

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
          {lines.map((line, i) => (
            <TermLine line={line} key={i} />
          ))}
        </TerminalChrome>
      </div>
    </div>
  );
}

function focusTerminalInput(e) {
  e.currentTarget.querySelector(".term-live-input")?.focus();
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

function LivePrompt() {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") e.preventDefault();
  };

  return (
    <div className="term-line term-live-line">
      <span className="term-ps-chevron">&#10095;</span>{" "}
      <span className="term-ps-path">PS D:\code\PROJECTS\portfolio&gt;</span>
      <input
        type="text"
        className="term-live-input"
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        onKeyDown={handleKeyDown}
        aria-label="terminal input"
      />
    </div>
  );
}

function ToolTerminalPane({ tool }) {
  return (
    <div className="ide-vs-terminal">
      <div className="ide-vs-terminal-head">
        <span className="ide-vs-terminal-chevron">&#8964;</span>
        <span className="ide-vs-terminal-title">{tool.name}</span>
        <TerminalActionBar shell={tool.shell} />
      </div>
      <div className="ide-vs-terminal-body" onClick={focusTerminalInput}>
        <div className="term-line">
          <span className="term-prompt">$</span> <span className="term-cmd">{tool.cmd}</span>
        </div>
        {tool.lines.map((line, i) => (
          <div className="term-line" key={i}>
            <span className="term-out">{line || " "}</span>
          </div>
        ))}
        <LivePrompt />
      </div>
    </div>
  );
}

function FetchTerminalPane({ tool }) {
  return (
    <div className="ide-vs-terminal">
      <div className="ide-vs-terminal-head">
        <span className="ide-vs-terminal-chevron">&#8964;</span>
        <span className="ide-vs-terminal-title">{tool.name}</span>
        <TerminalActionBar shell={tool.shell} />
      </div>
      <div className="ide-vs-terminal-body ide-vs-terminal-body-fetch" onClick={focusTerminalInput}>
        {tool.prefixLine ? (
          <div className="term-line">
            <span className="term-cmd">{tool.prefixLine}</span>
          </div>
        ) : (
          <div className="term-line">
            <span className="term-prompt">$</span> <span className="term-cmd">{tool.cmd}</span>
          </div>
        )}
        <div className="fetch-row">
          <pre className="fetch-ascii" style={{ color: tool.accent }}>
            {tool.ascii}
          </pre>
          <div className="fetch-info">
            {tool.info.map(([label, value]) => (
              <div className="fetch-info-row" key={label}>
                <span className="fetch-info-label" style={{ color: tool.accent }}>
                  {label}
                </span>
                <span className="fetch-info-value">{value}</span>
              </div>
            ))}
            {tool.colorbar && (
              <div className="fetch-colorbar">
                {tool.colorbar.map((c, i) => (
                  <span key={i} style={{ background: c }} />
                ))}
              </div>
            )}
          </div>
        </div>
        <LivePrompt />
      </div>
    </div>
  );
}

function FrameworkPane() {
  return (
    <div className="ide-agent-grid">
      {TOOLS.map((t) => (
        <div className={`ide-agent-pane ${t.tall ? "ide-agent-pane-tall" : ""}`} key={t.name}>
          {t.kind === "fetch" ? <FetchTerminalPane tool={t} /> : <ToolTerminalPane tool={t} />}
        </div>
      ))}
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
        <span className="ide-status-item">UTF-8</span>
        <span className="ide-status-item">LF</span>
        <span className="ide-status-item ide-status-live">&#9679; Go Live</span>
        <span className="ide-status-item">&#128276;</span>
      </div>
    </div>
  );
}

export default function TechStack() {
  const wrapRef = useRef(null);
  const trackFillRef = useRef(null);
  const sceneRef = useRef(null);
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

      if (sceneRef.current) {
        sceneRef.current.style.opacity = entrance;
        sceneRef.current.style.transform = `translateY(${(1 - entrance) * 64}px) scale(${0.92 + entrance * 0.08})`;
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
          <div className="tech-window" ref={sceneRef}>
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

                <div className="ide-sidebar-section">
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
                    placeholder='Message (Ctrl+Enter to commit on "main")'
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

            <StatusBar langMode={active.langMode} />
          </div>
        </div>
      </div>
    </section>
  );
}
