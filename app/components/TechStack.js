"use client";

import { useEffect, useRef, useState } from "react";
import { SiTypescript, SiJavascript, SiHtml5, SiCss } from "react-icons/si";
import { FaJava } from "react-icons/fa6";

const FILE_ICONS = {
  ts: { Icon: SiTypescript, color: "#3178C6" },
  tsx: { Icon: SiTypescript, color: "#3178C6" },
  js: { Icon: SiJavascript, color: "#F7DF1E" },
  jsx: { Icon: SiJavascript, color: "#F7DF1E" },
  java: { Icon: FaJava, color: "#ED8B00" },
  css: { Icon: SiCss, color: "#3A7BC8" },
  html: { Icon: SiHtml5, color: "#E34F26" },
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
    kind: "commit",
    text: "Add ISL gloss fallback",
    meta: "yap-render · gemini-2.5 · 2d",
  },
  {
    title: "devtask",
    color: "#3fb950",
    branch: "fix/readme-repo-polish",
    kind: "agent",
    agentName: "Claude Code",
    status: "Idle",
    time: "now",
  },
];

const TOOLS = [
  { name: "Next.js", shell: "npm", cmd: "npm run dev", out: "▲ ready on :3000" },
  { name: "Tailwind CSS", shell: "npx", cmd: "tailwindcss --watch", out: "Rebuilt in 42ms" },
  { name: "GSAP", shell: "node", cmd: "ScrollTrigger.create()", out: "3 triggers registered" },
  { name: "React Three Fiber", shell: "node", cmd: "<Canvas />", out: "WebGL context ready" },
  { name: "Git", shell: "bash", cmd: "git status", out: "On branch main · clean" },
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

function TerminalChrome({ name, children, draggable, titlebarProps }) {
  return (
    <div className={`ide-terminal-card ${draggable ? "is-draggable" : ""}`}>
      <div className="ide-terminal-titlebar" {...titlebarProps}>
        <span className="tech-dot tech-dot-red" />
        <span className="tech-dot tech-dot-yellow" />
        <span className="tech-dot tech-dot-green" />
        <span className="ide-terminal-name">{name}</span>
      </div>
      <div className="ide-terminal-body">{children}</div>
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

function LanguagesPane() {
  const lines = [
    { cmd: "ls" },
    { ls: ["App.jsx", "index.css", "TaskController.java", "islTranslator.ts", "package.json"] },
  ];

  return (
    <div className="ide-terminal-stage">
      <div className="lang-scene">
        <div className="lang-project-chip">
          <span className="ide-folder-dot" /> Swasthya-Neeti
        </div>
        <TerminalChrome name="swasthya-neeti — zsh">
          {lines.map((line, i) => (
            <TermLine line={line} key={i} />
          ))}
        </TerminalChrome>
      </div>
    </div>
  );
}

function BackendPane() {
  const lines = [
    { cmd: "./mvnw spring-boot:run" },
    { text: "Started DevtaskApplication · PostgreSQL connected" },
    { text: "POST /register        201" },
    { text: "POST /login           200 · JWT issued" },
    { text: "GET  /tasks           200" },
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
      <div style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
        <TerminalChrome
          name="devtask (local)"
          draggable
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

function ToolTerminalPane({ name, shell, cmd, out }) {
  return (
    <div className="ide-vs-terminal">
      <div className="ide-vs-terminal-head">
        <span className="ide-vs-terminal-chevron">&#8964;</span>
        <span className="ide-vs-terminal-title">{name}</span>
        <div className="ide-vs-terminal-actions">
          <span className="ide-vs-terminal-shell">{shell}</span>
          <span className="ide-vs-terminal-icon">+</span>
          <span className="ide-vs-terminal-icon">&#10697;</span>
          <span className="ide-vs-terminal-icon">&#128465;</span>
          <span className="ide-vs-terminal-icon">&#8942;</span>
        </div>
      </div>
      <div className="ide-vs-terminal-body">
        <div className="term-line">
          <span className="term-prompt">$</span> <span className="term-cmd">{cmd}</span>
        </div>
        <div className="term-line">
          <span className="term-out">{out}</span>
        </div>
      </div>
    </div>
  );
}

function FrameworkPane() {
  return (
    <div className="ide-agent-grid">
      {TOOLS.map((t) => (
        <div className="ide-agent-pane" key={t.name}>
          <ToolTerminalPane {...t} />
        </div>
      ))}
    </div>
  );
}

function AgentCard({ card }) {
  return (
    <div className="ide-agent-card">
      <div className="ide-agent-card-head">
        <span className="ide-agent-card-icon" />
        <span className="ide-agent-card-title">{card.title}</span>
        <span className="ide-agent-card-actions">&#8942; +</span>
      </div>
      <div className="ide-agent-card-branch-row">
        <span className="ide-agent-card-status-dot" style={{ background: card.color }} />
        <span className="ide-agent-card-branch">{card.branch}</span>
        <span className="ide-agent-card-pill">primary</span>
      </div>
      <div className="ide-agent-card-branch-muted">{card.branch}</div>
      {card.kind === "commit" ? (
        <div className="ide-agent-card-activity">
          <span className="ide-agent-card-check">&#10003;</span>
          <span className="ide-agent-card-activity-text">
            {card.text} <span className="ide-agent-card-meta">| {card.meta}</span>
          </span>
        </div>
      ) : (
        <div className="ide-agent-card-activity">
          <span className="ide-agent-card-spark">&#10022;</span>
          <span className="ide-agent-card-activity-text">
            {card.agentName} · {card.status}
          </span>
          <span className="ide-agent-card-time">{card.time}</span>
        </div>
      )}
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

    const computeTarget = () => {
      const el = wrapRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight;
      const scrollable = rect.height - viewH;
      if (scrollable <= 0) {
        targetProgress = 0;
        return;
      }

      const traveled = -rect.top;
      targetProgress = Math.min(1, Math.max(0, traveled / scrollable));
    };

    const applyProgress = (progress) => {
      const index = Math.min(SEGMENTS - 1, Math.floor(progress * SEGMENTS));

      if (trackFillRef.current) {
        trackFillRef.current.style.transform = `scaleY(${progress})`;
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
      applyProgress(currentProgress);
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
          <div className="tech-window">
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
              <div className="ide-sidebar">
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
                  <div className="ide-scm-commit-input">Message (Ctrl+Enter to commit on &quot;main&quot;)</div>
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
