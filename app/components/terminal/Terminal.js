"use client";

// The portfolio terminal: commands over the site's own content, plus `ask`,
// which streams an answer from /api/ask with numbered sources.
// Loaded lazily (see LazyTerminal.js). No animation loops: the caret blink is
// CSS and stops under reduced motion; text is printed as it arrives.
//
// Entries are plain data (never React nodes), so the session survives a trip
// to a case study and back: it's kept in sessionStorage for this tab only.

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { projects } from "../../../content/projects.js";
import { profile, projectsForSkill } from "../../../content/profile.js";
import siteFiles from "../../../lib/site-files.json";
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
  invalidMarkers,
} from "./commands.js";

const PROMPT = "mitarth@portfolio:~$";
const STORE = "mp:terminal";
const MAX_SAVED = 80;

// ---------- persistence (this tab only; never sent anywhere) ----------
const safeUrl = (u) => typeof u === "string" && (u.startsWith("/") || u.startsWith("https://"));
const cleanSources = (list) => (Array.isArray(list) ? list.filter((s) => s && safeUrl(s.url)) : []);

function restore() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORE) ?? "null");
    if (saved?.v !== 1 || !Array.isArray(saved.entries) || !saved.entries.length) return null;
    const entries = saved.entries.map((e) => {
      if (e.kind !== "answer") return e;
      const live = e.status === "thinking" || e.status === "streaming";
      return {
        ...e,
        sources: cleanSources(e.sources),
        ...(live ? { status: "stopped", message: "Interrupted when you left the page." } : {}),
      };
    });
    return { entries, history: Array.isArray(saved.history) ? saved.history : [], lastSources: cleanSources(saved.lastSources) };
  } catch {
    return null;
  }
}

// ---------- small pieces ----------
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
      <span aria-hidden="true"> ↗</span>
    </Link>
  );
}

function Cmd({ cmd, onRun, children }) {
  return (
    <button type="button" className="term-cmdlink" onClick={() => onRun(cmd)}>
      {children ?? cmd}
    </button>
  );
}

// Project names never break at their hyphen ("Run-/Neeti").
const NAMES = new RegExp(`(${projects.flatMap((p) => [p.title, p.slug]).filter((n) => n.includes("-")).join("|")})`, "g");
function Names({ text }) {
  return text.split(NAMES).map((part, i) =>
    i % 2 ? (
      <span key={i} className="term-nowrap">
        {part}
      </span>
    ) : (
      part
    )
  );
}

/** Plain text with `backticked` commands turned into buttons that run them. */
function RichText({ text, onRun }) {
  return text.split(/(`[^`\n]+`)/g).map((part, i) => {
    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
      const code = part.slice(1, -1);
      if (COMMAND_NAMES.includes(parse(code)[0])) return <Cmd key={i} cmd={code} onRun={onRun} />;
      return (
        <code key={i} className="term-code">
          {code}
        </code>
      );
    }
    return <Names key={i} text={part} />;
  });
}

function SourceList({ sources, onRun, heading }) {
  if (!sources?.length) return null;
  return (
    <div className="term-sources">
      {heading && <p className="term-dim">{heading}</p>}
      <ol aria-label="Sources">
        {sources.map((s) => (
          <li key={`${s.n}-${s.id}`}>
            <span className="term-source-n">[{s.n}]</span>{" "}
            <SmartLink href={s.url}>
              <Names text={s.title} />
            </SmartLink>
            {s.command && (
              <span className="term-dim">
                {" "}
                · run <Cmd cmd={s.command} onRun={onRun} />
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
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

// ---------- command outputs (rendered from data) ----------
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
        <dd>↑/↓ history · Tab completes · Ctrl+C stops an answer · Ctrl+L clears · Esc leaves the input</dd>
      </div>
    </dl>
  );
}

function KeyValues({ rows }) {
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

function Whoami() {
  return (
    <KeyValues
      rows={[
        ["name", profile.name],
        ["role", profile.role],
        ["location", profile.location],
        ["education", `${profile.education.degree}, ${profile.education.school}`],
        ["focus", profile.focus.join(" · ")],
        ["motto", profile.motto],
      ]}
    />
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
    <KeyValues
      rows={groups.map((g) => [
        g.toLowerCase(),
        profile.skills
          .filter((s) => s.group === g)
          .map((s, i, list) => {
            const used = projectsForSkill(s);
            return (
              <span key={s.name}>
                {s.name}
                {used.length > 0 && (
                  <span className="term-dim">
                    {" "}
                    (<Names text={used.join(", ")} />)
                  </span>
                )}
                {i < list.length - 1 && " · "}
              </span>
            );
          }),
      ])}
    />
  );
}

function ProjectsList({ filter, onRun }) {
  const list = filter ? projects.filter((p) => p.tags.includes(filter.slice(2))) : projects;
  if (!list.length) return <p>No projects tagged {filter.slice(2)}.</p>;
  return (
    <>
      <ul className="term-list">
        {list.map((p) => (
          <li key={p.slug}>
            <Cmd cmd={`open ${p.slug}`} onRun={onRun}>
              <span className="term-nowrap">{p.slug}</span>
            </Cmd>
            <span> — {p.oneLiner}</span>
            <span className="term-dim"> [{p.tags.join(", ")}]</span>
          </li>
        ))}
      </ul>
      <p className="term-dim">Open one with: open &lt;slug&gt;</p>
    </>
  );
}

function Contact() {
  return (
    <KeyValues
      rows={[
        ["email", <SmartLink key="e" href={profile.links.email}>{profile.links.emailAddress}</SmartLink>],
        ["linkedin", <SmartLink key="l" href={profile.links.linkedin}>linkedin.com/in/mitarth-pathak</SmartLink>],
        ["github", <SmartLink key="g" href={profile.links.github}>github.com/mitarthpathak</SmartLink>],
      ]}
    />
  );
}

function Welcome({ onRun }) {
  return (
    <div className="term-welcome">
      <p>
        Welcome to Mitarth&apos;s portfolio terminal. Type <Cmd cmd="help" onRun={onRun} /> for commands, or ask a
        question about his work.
      </p>
      <p className="term-dim">
        An AI model writes the answers from this site&apos;s pages only and lists its sources. Questions go to the AI
        provider for that; nothing is stored here.
      </p>
      <Chips items={EXAMPLE_CHIPS} onRun={onRun} label="Try an example" />
    </div>
  );
}

/** Output views, by name. Each gets the entry's data plus onRun. */
const VIEWS = {
  help: () => <Help />,
  whoami: () => <Whoami />,
  about: () => <p>{profile.summary}</p>,
  experience: () => <Experience />,
  skills: () => <Skills />,
  projects: ({ filter, onRun }) => <ProjectsList filter={filter} onRun={onRun} />,
  contact: () => <Contact />,
  sources: ({ sources, onRun }) =>
    sources?.length ? (
      <SourceList sources={sources} onRun={onRun} />
    ) : (
      <p>
        No sources yet. Try <Cmd cmd='ask "What is Run-Neeti?"' onRun={onRun} />
      </p>
    ),
  history: ({ items }) => (
    <ol className="term-history">
      {items.map((h, i) => (
        <li key={i}>
          <span className="term-dim">{String(i + 1).padStart(3, " ")}</span> {h}
        </li>
      ))}
    </ol>
  ),
  opening: ({ path }) => <p className="term-dim">Opening {path} …</p>,
  resume: ({ opened, onRun }) =>
    opened ? (
      <p>
        Opened the résumé in a new tab. If nothing opened: <SmartLink href="/resume.pdf">résumé (PDF)</SmartLink>
      </p>
    ) : (
      <p>
        The résumé PDF is coming soon. Meanwhile, run <Cmd cmd="experience" onRun={onRun} /> or{" "}
        <Cmd cmd="contact" onRun={onRun} />.
      </p>
    ),
  text: ({ text, onRun }) => (
    <p>
      <RichText text={text} onRun={onRun} />
    </p>
  ),
  notFound: ({ cmd, guess, onRun }) => (
    <p>
      command not found: {cmd}.{" "}
      {guess ? (
        <>
          Did you mean <Cmd cmd={guess} onRun={onRun} />?
        </>
      ) : (
        <>
          Type <Cmd cmd="help" onRun={onRun} /> for the list, or ask a question.
        </>
      )}
    </p>
  ),
  unknownSlug: ({ arg, guess, onRun }) => (
    <p>
      No project “{arg}”.{" "}
      {guess ? (
        <>
          Did you mean <Cmd cmd={`open ${guess}`} onRun={onRun} />?
        </>
      ) : (
        <>Slugs: {SLUGS.join(", ")}</>
      )}
    </p>
  ),
};

// ---------- the terminal ----------
export default function Terminal() {
  const router = useRouter();
  const hintId = useId();
  const inputId = useId();
  const [saved] = useState(restore);
  const [entries, setEntries] = useState(() => saved?.entries ?? [{ id: 0, kind: "welcome" }]);
  const [lastSources, setLastSources] = useState(() => saved?.lastSources ?? []);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const [narrow] = useState(() => window.matchMedia("(max-width: 480px)").matches);
  const historyRef = useRef(saved?.history ?? []);
  const historyPos = useRef(-1);
  const nextId = useRef(Math.max(0, ...(saved?.entries ?? []).map((e) => e.id ?? 0)) + 1);
  const outRef = useRef(null);
  const inputRef = useRef(null);
  const rootRef = useRef(null);
  const stickToBottom = useRef(true);
  const abortRef = useRef(null);
  const busyRef = useRef(false);
  const runRef = useRef(null);
  const lastFit = useRef(0);
  const onRun = useCallback((cmd) => runRef.current?.(cmd), []);

  const push = useCallback((entry) => {
    const id = nextId.current++;
    setEntries((list) => [...list, { id, ...entry }]);
    return id;
  }, []);
  const patch = useCallback((id, changes) => setEntries((list) => list.map((e) => (e.id === id ? { ...e, ...changes } : e))), []);
  const say = useCallback((kind, text) => push({ kind, view: "text", data: { text } }), [push]);

  // This tab's session, so a trip to a case study and back keeps it.
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORE,
        JSON.stringify({ v: 1, entries: entries.slice(-MAX_SAVED), history: historyRef.current.slice(-50), lastSources })
      );
    } catch {}
  }, [entries, lastSources]);

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
  // Small changes (the browser toolbar collapsing) are ignored.
  const fitToKeyboard = useCallback(() => {
    const root = rootRef.current;
    const vv = window.visualViewport;
    if (!root || !vv) return;
    const typing = window.matchMedia("(max-width: 768px)").matches && document.activeElement === inputRef.current;
    // The fixed Menu pill would sit on top of the input above the keyboard.
    document.documentElement.classList.toggle("term-typing", typing);
    if (!typing) {
      root.style.height = "";
      lastFit.current = 0;
      return;
    }
    const height = Math.max(280, Math.min(640, Math.round(vv.height - 16)));
    if (Math.abs(height - lastFit.current) < 90) return;
    lastFit.current = height;
    root.style.height = `${height}px`;
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

  const stopAnswer = useCallback(() => abortRef.current?.abort(), []);

  const ask = useCallback(
    async (question) => {
      if (busyRef.current) {
        say("error", "Still answering the last question. Wait for it, or stop it with Ctrl+C or the ■ button.");
        return;
      }
      const id = push({ kind: "answer", question, text: "", status: "thinking", sources: [] });
      busyRef.current = true;
      setBusy(true);
      const controller = new AbortController();
      abortRef.current = controller;
      let text = "";
      let passages = 0;
      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ question }),
          signal: controller.signal,
        });
        if (!(res.headers.get("content-type") ?? "").includes("ndjson")) {
          const data = await res.json().catch(() => ({}));
          if (data.code === "offline") {
            setOffline(true);
            patch(id, { status: "offline", message: data.message, excerpt: data.excerpt ?? null, sources: cleanSources(data.sources) });
          } else {
            const status = res.status === 429 ? "limit" : res.status === 400 ? "hint" : "error";
            patch(id, { status, message: data.message ?? "Something went wrong. Try again in a moment." });
          }
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let failure = null;
        let final = null;
        const handle = (line) => {
          if (!line.trim()) return;
          let part;
          try {
            part = JSON.parse(line);
          } catch {
            return; // one bad line never sinks the answer
          }
          if (part.type === "meta") passages = part.passages ?? 0;
          else if (part.type === "text") {
            text += part.value;
            patch(id, { status: "streaming", text, passages });
          } else if (part.type === "error") failure = part.message;
          else if (part.type === "sources") final = part;
        };
        for (;;) {
          const { done, value: chunk } = await reader.read();
          if (done) break;
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop();
          lines.forEach(handle);
        }
        handle(buffer + decoder.decode());

        const sources = cleanSources(final?.sources);
        const shown = dropMarkers(text, final?.dropped ?? invalidMarkers(text, passages));
        if (failure || !final) {
          patch(id, {
            status: "error",
            text: shown,
            sources,
            message: failure ?? "The answer was cut off before it finished. Try asking again.",
          });
        } else {
          patch(id, { status: "done", text: shown, sources, uncited: Boolean(final.uncited), truncated: Boolean(final.truncated) });
          if (sources.length) setLastSources(sources);
        }
      } catch (err) {
        if (err?.name === "AbortError") patch(id, { status: "stopped", text: dropMarkers(text, invalidMarkers(text, passages)) });
        else patch(id, { status: "network", text, message: "Couldn't reach the server. Check your connection and try again." });
      } finally {
        busyRef.current = false;
        abortRef.current = null;
        setBusy(false);
      }
    },
    [push, patch, say]
  );

  const clearScreen = useCallback(() => {
    stopAnswer();
    setEntries([]);
  }, [stopAnswer]);

  const run = useCallback(
    (raw) => {
      const input = raw.trim();
      if (!input) return;
      historyRef.current.push(input);
      historyPos.current = -1;
      const [cmd, arg] = parse(input);

      if (cmd === "clear") return void clearScreen();
      push({ kind: "cmd", text: input });
      const out = (view, data = {}) => push({ kind: "out", view, data });
      const fail = (view, data = {}) => push({ kind: "error", view, data });

      switch (cmd) {
        case "help":
        case "whoami":
        case "about":
        case "experience":
        case "skills":
        case "contact":
          return void out(cmd);
        case "projects": {
          const filter = arg.toLowerCase();
          if (filter && !FILTERS.includes(filter)) return void say("error", `Unknown filter “${arg}”. Try ${FILTERS.join(", ")}.`);
          return void out("projects", { filter });
        }
        case "open": {
          const slug = arg.toLowerCase();
          if (!slug) return void say("error", `Usage: open <slug>. Slugs: ${SLUGS.join(", ")}`);
          if (!SLUGS.includes(slug)) return void fail("unknownSlug", { arg, guess: nearest(slug, SLUGS) });
          out("opening", { path: `/work/${slug}` });
          return void router.push(`/work/${slug}`);
        }
        case "resume":
          // Known at build time (lib/site-files.json), so this opens inside
          // the keypress and isn't popup-blocked.
          if (siteFiles.resume) window.open(siteFiles.resume, "_blank", "noopener");
          return void out("resume", { opened: Boolean(siteFiles.resume) });
        case "ask":
          if (arg.length < 3) return void say("error", 'Ask a question, e.g. `ask "What is DevTask?"`');
          return void ask(arg);
        case "sources":
          return void out("sources", { sources: lastSources });
        case "how":
          out("opening", { path: "/lab/ask" });
          return void router.push("/lab/ask");
        case "history":
          return void out("history", { items: [...historyRef.current] });
        case "sudo":
          return void say("out", "Nice try. This incident will be reported to nobody.");
        case "exit":
          return void say("out", "There's no exit, but Esc leaves the input and Tab moves on.");
        default:
          // A question typed without `ask` is still a question.
          if (looksLikeQuestion(input)) return void ask(input);
          return void fail("notFound", { cmd, guess: nearest(cmd, COMMAND_NAMES) });
      }
    },
    [push, say, ask, router, clearScreen, lastSources]
  );

  const runChip = (c) => {
    stickToBottom.current = true;
    run(c);
    // On touch screens, focusing the input would pop the keyboard over the
    // output the visitor just asked for.
    if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    runRef.current = runChip;
  });

  const onSubmit = (e) => {
    e.preventDefault();
    stickToBottom.current = true;
    run(value);
    setValue("");
  };

  const onKeyDown = (e) => {
    const hist = historyRef.current;
    const key = e.key.toLowerCase();
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
      // Leave the input for the output, which can then be scrolled with keys.
      outRef.current?.focus();
    } else if (e.ctrlKey && !e.metaKey && key === "l") {
      e.preventDefault();
      clearScreen();
    } else if (e.ctrlKey && !e.metaKey && key === "c") {
      const el = e.currentTarget;
      if (el.selectionStart !== el.selectionEnd) return; // a real copy
      if (busyRef.current) {
        e.preventDefault();
        stopAnswer();
      } else if (value) {
        e.preventDefault();
        push({ kind: "cmd", text: `${value}^C` });
        setValue("");
      }
    }
  };

  const onlyWelcome = entries.length === 1 && entries[0].kind === "welcome";
  const quickChips = offline ? MOBILE_CHIPS.filter((c) => !c.startsWith("ask")) : MOBILE_CHIPS;

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
        aria-busy={busy}
        onScroll={onScroll}
        tabIndex={0}
      >
        {entries.map((e) => (
          <Entry key={e.id} entry={e} onRun={onRun} onStop={stopAnswer} />
        ))}
      </div>

      {!onlyWelcome && (
        <div className="term-mobile-chips">
          <Chips items={quickChips} onRun={runChip} label="Quick commands" />
        </div>
      )}

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
          placeholder={narrow ? "help, or a question" : "type help, or ask a question"}
        />
        {busy ? (
          <button type="button" className="term-send term-send-stop" onClick={stopAnswer} aria-label="Stop the answer">
            <span aria-hidden="true">■</span>
          </button>
        ) : (
          <button type="submit" className="term-send" aria-label="Run command">
            <span aria-hidden="true">↵</span>
          </button>
        )}
        <p id={hintId} className="sr-only">
          Type help to list commands, or type a question. Up and down arrows recall history, Tab completes, Control C
          stops an answer, Escape leaves the input.
        </p>
      </form>
    </div>
  );
}

function Entry({ entry, onRun, onStop }) {
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
    case "error": {
      const View = VIEWS[entry.view] ?? VIEWS.text;
      return (
        <div className={`term-block${entry.kind === "error" ? " term-error" : ""}`}>
          <View {...entry.data} onRun={onRun} />
        </div>
      );
    }
    case "answer":
      return <Answer entry={entry} onRun={onRun} onStop={onStop} />;
    default:
      return null;
  }
}

function StopHint({ onStop }) {
  return (
    <p className="term-dim term-stophint">
      <button type="button" className="term-cmdlink" onClick={onStop}>
        stop
      </button>{" "}
      <span aria-hidden="true">(Ctrl+C)</span>
    </p>
  );
}

// While an answer streams it sits in an aria-hidden block; the finished answer
// is a new node, so the log announces it once, whole, with its sources.
function Answer({ entry, onRun, onStop }) {
  const { status, text, message, sources, excerpt } = entry;
  if (status === "thinking") {
    return (
      <div className="term-block">
        <p className="term-thinking">
          thinking<span className="term-dots-anim" aria-hidden="true">...</span>
        </p>
        <StopHint onStop={onStop} />
      </div>
    );
  }
  if (status === "streaming") {
    const shown = dropMarkers(text, invalidMarkers(text, entry.passages ?? 0));
    return (
      <div className="term-block" aria-hidden="true" key="live">
        <p className="term-answer">
          <RichText text={shown} onRun={onRun} />
          <span className="term-caret" />
        </p>
        <StopHint onStop={onStop} />
      </div>
    );
  }
  if (status === "hint") {
    return (
      <div className="term-block" key="final">
        <p className="term-dim">
          <RichText text={message} onRun={onRun} />
        </p>
      </div>
    );
  }
  if (status === "stopped") {
    return (
      <div className="term-block" key="final">
        {text && (
          <p className="term-answer">
            <RichText text={text} onRun={onRun} />
          </p>
        )}
        <p className="term-dim">{message ?? "Stopped."}</p>
      </div>
    );
  }
  if (status === "offline" || status === "limit" || status === "error" || status === "network") {
    const label = { offline: "offline", limit: "slow down", error: "error", network: "network" }[status];
    return (
      <div className={`term-block term-notice term-notice-${status}`} key="final">
        {text && (
          <p className="term-answer">
            <RichText text={text} onRun={onRun} />
          </p>
        )}
        <p>
          <span className="term-badge">{label}</span> <RichText text={message} onRun={onRun} />
        </p>
        {status === "offline" && excerpt && (
          <blockquote className="term-excerpt">
            <Names text={excerpt.text} /> <span className="term-dim">[{excerpt.n}]</span>
          </blockquote>
        )}
        <SourceList
          sources={sources}
          onRun={onRun}
          heading={status === "offline" ? "Closest pages for your question:" : null}
        />
      </div>
    );
  }
  return (
    <div className="term-block" key="final">
      <p className="term-answer">
        <RichText text={text} onRun={onRun} />
      </p>
      {entry.truncated && <p className="term-dim">(Cut short at the length limit.)</p>}
      {entry.uncited && <p className="term-dim">No source was cited for this answer, so treat it with care.</p>}
      <SourceList sources={sources} onRun={onRun} />
    </div>
  );
}
