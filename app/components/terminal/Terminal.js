"use client";

// The portfolio terminal: real commands over the site's own content, plus
// `ask`, which streams an answer from /api/ask with numbered sources.
// Loaded lazily (see LazyTerminal.js). No animation loops: the caret blink is
// CSS and stops under reduced motion; text is printed as it arrives.

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { projects } from "../../../content/projects.js";
import { profile, projectsForSkill } from "../../../content/profile.js";
import {
  COMMANDS,
  COMMAND_NAMES,
  SLUGS,
  FILTERS,
  EXAMPLE_CHIPS,
  MOBILE_CHIPS,
  parse,
  nearest,
  looksLikeQuestion,
  complete,
  dropMarkers,
} from "./commands.js";

const PROMPT = "mitarth@portfolio:~$";

function isExternal(url) {
  return /^https?:\/\//.test(url) || url.startsWith("mailto:");
}

function SmartLink({ href, children, className = "term-link" }) {
  if (isExternal(href)) {
    const mail = href.startsWith("mailto:");
    return (
      <a href={href} className={className} {...(mail ? {} : { target: "_blank", rel: "noopener noreferrer" })}>
        {children}
        {!mail && (
          <>
            <span aria-hidden="true"> ↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </>
        )}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function SourceList({ sources }) {
  if (!sources?.length) return null;
  return (
    <ol className="term-sources" aria-label="Sources">
      {sources.map((s) => (
        <li key={`${s.n}-${s.id}`}>
          <span className="term-source-n">[{s.n}]</span>{" "}
          <SmartLink href={s.url}>
            {s.title}
            {!isExternal(s.url) && <span aria-hidden="true"> ↗</span>}
          </SmartLink>
        </li>
      ))}
    </ol>
  );
}

function Chips({ items, onRun, label }) {
  return (
    <div className="term-chips" role="group" aria-label={label}>
      {items.map((c) => (
        <button key={c} type="button" className="term-chip" onClick={() => onRun(c)}>
          {c}
        </button>
      ))}
    </div>
  );
}

// ---------- static command outputs ----------
function Help() {
  return (
    <dl className="term-help">
      {COMMANDS.map((c) => (
        <div key={c.name}>
          <dt>{c.usage}</dt>
          <dd>{c.desc}</dd>
        </div>
      ))}
      <div>
        <dt>keys</dt>
        <dd>↑/↓ history · Tab completes · Ctrl+L clears · Esc leaves the input</dd>
      </div>
    </dl>
  );
}

function Whoami() {
  const rows = [
    ["name", profile.name],
    ["role", profile.role],
    ["location", profile.location],
    ["education", `${profile.education.degree}, ${profile.education.school}`],
    ["focus", profile.focus.join(" · ")],
    ["motto", profile.motto],
  ];
  return (
    <dl className="term-kv">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Experience() {
  return (
    <ul className="term-list">
      {profile.experience.map((e) => (
        <li key={e.company}>
          <strong>{e.role}</strong> · {e.company}
          <span className="term-dim"> — {e.period} · {e.location}</span>
          {e.note && <p className="term-dim">{e.note}</p>}
        </li>
      ))}
    </ul>
  );
}

function Skills() {
  const groups = [...new Set(profile.skills.map((s) => s.group))];
  return (
    <dl className="term-kv term-kv-wide">
      {groups.map((g) => (
        <div key={g}>
          <dt>{g.toLowerCase()}</dt>
          <dd>
            {profile.skills
              .filter((s) => s.group === g)
              .map((s, i, list) => {
                const used = projectsForSkill(s);
                return (
                  <span key={s.name}>
                    {s.name}
                    {used.length > 0 && <span className="term-dim"> ({used.join(", ")})</span>}
                    {i < list.length - 1 && " · "}
                  </span>
                );
              })}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ProjectsList({ list, onOpen }) {
  return (
    <ul className="term-list">
      {list.map((p) => (
        <li key={p.slug}>
          <button type="button" className="term-cmdlink" onClick={() => onOpen(p.slug)}>
            {p.slug}
          </button>
          <span> — {p.oneLiner}</span>
          <span className="term-dim"> [{p.tags.join(", ")}]</span>
        </li>
      ))}
    </ul>
  );
}

function Contact() {
  return (
    <ul className="term-list">
      <li>
        email <SmartLink href={profile.links.email}>{profile.links.emailAddress}</SmartLink>
      </li>
      <li>
        linkedin <SmartLink href={profile.links.linkedin}>linkedin.com/in/mitarth-pathak</SmartLink>
      </li>
      <li>
        github <SmartLink href={profile.links.github}>github.com/mitarthpathak</SmartLink>
      </li>
    </ul>
  );
}

function Welcome({ onRun }) {
  return (
    <div className="term-welcome">
      <p>
        Welcome. This is a real terminal for Mitarth&apos;s portfolio. Type <kbd>help</kbd> for commands, or ask
        about his work — answers come only from this site and show their sources.
      </p>
      <Chips items={EXAMPLE_CHIPS} onRun={onRun} label="Try an example" />
    </div>
  );
}

// ---------- the terminal ----------
export default function Terminal() {
  const router = useRouter();
  const hintId = useId();
  const inputId = useId();
  const [entries, setEntries] = useState(() => [{ id: 0, kind: "welcome" }]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  // Streamed text changes inside one node, which a log region doesn't
  // announce; finished answers are read out once from here instead.
  const [announce, setAnnounce] = useState("");
  const historyRef = useRef([]);
  const historyPos = useRef(-1);
  const lastSources = useRef(null);
  const nextId = useRef(1);
  const outRef = useRef(null);
  const inputRef = useRef(null);
  const rootRef = useRef(null);
  const stickToBottom = useRef(true);
  const abortRef = useRef(null);
  const runRef = useRef(null);
  // A suggested command the visitor can click instead of retyping.
  const Suggest = ({ cmd }) => (
    <button type="button" className="term-cmdlink" onClick={() => runRef.current?.(cmd)}>
      {cmd}
    </button>
  );

  const push = useCallback((entry) => {
    const id = nextId.current++;
    setEntries((list) => [...list, { id, ...entry }]);
    return id;
  }, []);
  const patch = useCallback((id, fn) => setEntries((list) => list.map((e) => (e.id === id ? { ...e, ...fn(e) } : e))), []);

  // Auto-scroll to the bottom unless the visitor has scrolled up.
  const onScroll = () => {
    const el = outRef.current;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
  };
  useEffect(() => {
    const el = outRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [entries]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Phones: when the on-screen keyboard opens, fit the terminal into the
  // visible area (visualViewport) and keep its input just above the keyboard.
  const fitToKeyboard = useCallback(() => {
    const root = rootRef.current;
    const vv = window.visualViewport;
    if (!root || !vv || !window.matchMedia("(max-width: 768px)").matches) return;
    const typing = document.activeElement === inputRef.current;
    // The fixed Menu pill would sit on top of the input above the keyboard.
    document.documentElement.classList.toggle("term-typing", typing);
    if (!typing) {
      root.style.height = "";
      return;
    }
    root.style.height = `${Math.max(280, Math.min(640, Math.round(vv.height - 16)))}px`;
    root.scrollIntoView({ block: "end" });
  }, []);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    vv.addEventListener("resize", fitToKeyboard);
    return () => {
      vv.removeEventListener("resize", fitToKeyboard);
      document.documentElement.classList.remove("term-typing");
    };
  }, [fitToKeyboard]);

  const openSlug = useCallback(
    (slug) => {
      push({ kind: "out", node: <p>Opening /work/{slug} …</p> });
      router.push(`/work/${slug}`);
    },
    [push, router]
  );

  const ask = useCallback(
    async (question) => {
      const id = push({ kind: "answer", question, text: "", status: "thinking", sources: null });
      setBusy(true);
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ question }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const kind = res.status === 429 ? "limit" : data.code === "offline" ? "offline" : "error";
          patch(id, () => ({ status: kind, message: data.message ?? "Something went wrong.", sources: data.sources ?? null }));
          if (data.sources?.length) lastSources.current = data.sources;
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let text = "";
        let failed = false;
        for (;;) {
          const { done, value: chunk } = await reader.read();
          if (done) break;
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop();
          for (const line of lines) {
            if (!line.trim()) continue;
            const part = JSON.parse(line);
            if (part.type === "text") {
              text += part.value;
              patch(id, () => ({ status: "streaming", text }));
            } else if (part.type === "replace") {
              text = part.text;
              patch(id, () => ({ text }));
            } else if (part.type === "error") {
              failed = true;
              patch(id, () => ({ status: "error", message: part.message }));
            } else if (part.type === "sources") {
              text = dropMarkers(text, part.dropped);
              lastSources.current = part.sources;
              patch(id, () => ({ status: failed ? "error" : "done", text, sources: part.sources }));
              if (!failed) {
                const n = part.sources.length;
                setAnnounce(`${text} ${n ? `${n} source${n === 1 ? "" : "s"} listed below.` : ""}`);
              }
            }
          }
        }
        patch(id, (e) => (e.status === "streaming" || e.status === "thinking" ? { status: "done" } : {}));
      } catch (err) {
        if (err?.name === "AbortError") return;
        patch(id, () => ({ status: "network", message: "Couldn't reach the server. Check your connection and try again." }));
      } finally {
        setBusy(false);
      }
    },
    [push, patch]
  );

  const run = useCallback(
    (raw) => {
      const input = raw.trim();
      if (!input) return;
      historyRef.current.push(input);
      historyPos.current = -1;
      const [cmd, arg] = parse(input);

      if (cmd === "clear") {
        setEntries([]);
        return;
      }
      push({ kind: "cmd", text: input });

      switch (cmd) {
        case "help":
          return void push({ kind: "out", node: <Help /> });
        case "whoami":
          return void push({ kind: "out", node: <Whoami /> });
        case "about":
          return void push({ kind: "out", node: <p>{profile.summary}</p> });
        case "experience":
          return void push({ kind: "out", node: <Experience /> });
        case "skills":
          return void push({ kind: "out", node: <Skills /> });
        case "projects": {
          const filter = arg.toLowerCase();
          if (filter && !FILTERS.includes(filter)) {
            return void push({ kind: "error", node: <p>Unknown filter “{arg}”. Try {FILTERS.join(", ")}.</p> });
          }
          const list = filter ? projects.filter((p) => p.tags.includes(filter.slice(2))) : projects;
          return void push({
            kind: "out",
            node: list.length ? (
              <>
                <ProjectsList list={list} onOpen={openSlug} />
                <p className="term-dim">Open one with: open &lt;slug&gt;</p>
              </>
            ) : (
              <p>No projects tagged {filter.slice(2)}.</p>
            ),
          });
        }
        case "open": {
          const slug = arg.toLowerCase();
          if (!slug) return void push({ kind: "error", node: <p>Usage: open &lt;slug&gt; — slugs: {SLUGS.join(", ")}</p> });
          if (!SLUGS.includes(slug)) {
            const guess = nearest(slug, SLUGS);
            return void push({
              kind: "error",
              node: (
                <p>
                  No project “{arg}”.{guess ? <> Did you mean <Suggest cmd={`open ${guess}`} />?</> : <> Slugs: {SLUGS.join(", ")}</>}
                </p>
              ),
            });
          }
          return void openSlug(slug);
        }
        case "resume": {
          const id = push({ kind: "out", node: <p className="term-dim">Looking for the résumé…</p> });
          fetch("/resume.pdf", { method: "HEAD" })
            .then((r) => {
              if (r.ok && (r.headers.get("content-type") ?? "").includes("pdf")) {
                window.open("/resume.pdf", "_blank", "noopener");
                patch(id, () => ({ node: <p>Opened the résumé in a new tab.</p> }));
              } else {
                patch(id, () => ({ node: <p>The résumé is coming soon. Meanwhile, run <kbd>contact</kbd> or <kbd>experience</kbd>.</p> }));
              }
            })
            .catch(() => patch(id, () => ({ node: <p>The résumé is coming soon.</p> })));
          return;
        }
        case "contact":
          return void push({ kind: "out", node: <Contact /> });
        case "ask":
          if (arg.length < 3) {
            return void push({ kind: "error", node: <p>Ask a question, e.g. <kbd>ask &quot;What is DevTask?&quot;</kbd></p> });
          }
          return void ask(arg);
        case "sources":
          return void push({
            kind: "out",
            node: lastSources.current?.length ? <SourceList sources={lastSources.current} /> : <p>No sources yet. Try <kbd>ask &quot;What is Run-Neeti?&quot;</kbd></p>,
          });
        case "how":
          push({ kind: "out", node: <p>Opening /lab/ask …</p> });
          return void router.push("/lab/ask");
        case "history":
          return void push({
            kind: "out",
            node: (
              <ol className="term-history">
                {historyRef.current.map((h, i) => (
                  <li key={i}>
                    <span className="term-dim">{String(i + 1).padStart(3, " ")}</span> {h}
                  </li>
                ))}
              </ol>
            ),
          });
        case "sudo":
          return void push({ kind: "out", node: <p>Nice try. This incident will be reported to nobody.</p> });
        case "exit":
          return void push({ kind: "out", node: <p>There&apos;s no exit — but Esc leaves the input, and Tab moves on.</p> });
        default: {
          if (looksLikeQuestion(input)) {
            return void push({
              kind: "error",
              node: (
                <p>
                  That looks like a question. Try <Suggest cmd={`ask "${input}"`} />
                </p>
              ),
            });
          }
          const guess = nearest(cmd, COMMAND_NAMES);
          return void push({
            kind: "error",
            node: (
              <p>
                command not found: {cmd}.{guess ? <> Did you mean <Suggest cmd={guess} />?</> : <> Type <Suggest cmd="help" /> for the list.</>}
              </p>
            ),
          });
        }
      }
    },
    [push, patch, ask, openSlug, router]
  );

  const runChip = (c) => {
    stickToBottom.current = true;
    run(c);
    inputRef.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    runRef.current = runChip;
  });

  const onSubmit = (e) => {
    e.preventDefault();
    stickToBottom.current = true;
    if (busy && parse(value)[0] === "ask") {
      push({ kind: "cmd", text: value.trim() });
      push({ kind: "error", node: <p>Still answering the last question — ask again in a moment.</p> });
    } else run(value);
    setValue("");
  };

  const onKeyDown = (e) => {
    const hist = historyRef.current;
    if (e.key === "ArrowUp") {
      if (!hist.length) return;
      e.preventDefault();
      historyPos.current = historyPos.current === -1 ? hist.length - 1 : Math.max(0, historyPos.current - 1);
      setValue(hist[historyPos.current]);
    } else if (e.key === "ArrowDown") {
      if (historyPos.current === -1) return;
      e.preventDefault();
      historyPos.current += 1;
      if (historyPos.current >= hist.length) {
        historyPos.current = -1;
        setValue("");
      } else setValue(hist[historyPos.current]);
    } else if (e.key === "Tab" && !e.shiftKey && value.trim()) {
      // Only complete when there's something typed; empty input tabs on.
      const done = complete(value);
      if (done) {
        e.preventDefault();
        setValue(done);
      }
    } else if (e.key === "Escape") {
      e.currentTarget.blur();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
      e.preventDefault();
      setEntries([]);
    }
  };

  return (
    <div ref={rootRef} className="term" data-busy={busy || undefined}>
      <div className="term-titlebar">
        <span className="term-dots" aria-hidden="true">
          <i className="term-dot term-dot-red" />
          <i className="term-dot term-dot-yellow" />
          <i className="term-dot term-dot-green" />
        </span>
        <span className="term-title">mitarth@portfolio: ~</span>
        <span className="term-shell" aria-hidden="true">
          zsh
        </span>
      </div>

      <div
        ref={outRef}
        className="term-output"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Terminal output"
        onScroll={onScroll}
        tabIndex={0}
      >
        {entries.map((e) => (
          <Entry key={e.id} entry={e} onRun={runChip} />
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <div className="term-mobile-chips">
        <Chips items={MOBILE_CHIPS} onRun={runChip} label="Quick commands" />
      </div>

      <form className="term-inputrow" onSubmit={onSubmit}>
        <label htmlFor={inputId} className="term-prompt">
          <span aria-hidden="true">{PROMPT}</span>
          <span className="sr-only">Terminal command</span>
        </label>
        <input
          ref={inputRef}
          id={inputId}
          className="term-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => window.setTimeout(fitToKeyboard, 250)}
          onBlur={() => window.setTimeout(fitToKeyboard, 0)}
          aria-describedby={hintId}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          maxLength={320}
          placeholder="type help, or ask a question"
        />
        <button type="submit" className="term-send" aria-label="Run command">
          <span aria-hidden="true">↵</span>
        </button>
        <p id={hintId} className="sr-only">
          Type help to list commands. Up and down arrows recall history, Tab completes, Escape leaves the input.
        </p>
      </form>
    </div>
  );
}

function Entry({ entry, onRun }) {
  switch (entry.kind) {
    case "welcome":
      return <Welcome onRun={onRun} />;
    case "cmd":
      return (
        <p className="term-line-cmd">
          <span className="term-ps" aria-hidden="true">
            {PROMPT}
          </span>{" "}
          <span className="sr-only">You ran: </span>
          {entry.text}
        </p>
      );
    case "out":
      return <div className="term-block">{entry.node}</div>;
    case "error":
      return <div className="term-block term-error">{entry.node}</div>;
    case "answer":
      return <Answer entry={entry} />;
    default:
      return null;
  }
}

function Answer({ entry }) {
  const { status, text, message, sources } = entry;
  if (status === "thinking") {
    return (
      <p className="term-block term-thinking" aria-label="Thinking">
        thinking<span className="term-dots-anim" aria-hidden="true">...</span>
      </p>
    );
  }
  if (status === "offline" || status === "limit" || status === "error" || status === "network") {
    const label = { offline: "offline", limit: "slow down", error: "error", network: "network" }[status];
    return (
      <div className={`term-block term-notice term-notice-${status}`}>
        {text && <p className="term-answer">{text}</p>}
        <p>
          <span className="term-badge">{label}</span> {message}
        </p>
        {status === "offline" && sources?.length > 0 && (
          <>
            <p className="term-dim">Closest pages for your question:</p>
            <SourceList sources={sources} />
          </>
        )}
      </div>
    );
  }
  return (
    <div className="term-block">
      <p className="term-answer">
        {text}
        {status === "streaming" && <span className="term-caret" aria-hidden="true" />}
      </p>
      {status === "done" && <SourceList sources={sources} />}
    </div>
  );
}
