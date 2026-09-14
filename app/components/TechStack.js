"use client";

import { useEffect, useRef, useState } from "react";
import { SiTypescript, SiJavascript, SiHtml5, SiCss, SiClaude } from "react-icons/si";
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
    kind: "agent",
    agentName: "Codex",
    status: "Thinking",
    time: "(18s)",
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
      <div className="ide-vs-terminal-body">
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
      <div className="ide-vs-terminal-body ide-vs-terminal-body-fetch">
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
        <span className="ide-agent-card-spark">&#10022;</span>
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
              {active.mode !== "terminal" && (
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
              )}

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
