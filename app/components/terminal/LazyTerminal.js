"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import "./terminal.css";

// The terminal (and the content it bundles) is only fetched when its section
// comes near the viewport, so it never touches the home page's first paint.
// The placeholder has the terminal's exact size: no layout shift on swap.
const Terminal = dynamic(() => import("./Terminal.js"), {
  ssr: false,
  loading: () => <TerminalPlaceholder />,
});

function TerminalPlaceholder() {
  return (
    <div className="term term-placeholder" aria-hidden="true">
      <div className="term-titlebar">
        <span className="term-dots">
          <i className="term-dot term-dot-red" />
          <i className="term-dot term-dot-yellow" />
          <i className="term-dot term-dot-green" />
        </span>
        <span className="term-title">mitarth@portfolio: ~</span>
      </div>
      <div className="term-output">
        <p className="term-dim">loading terminal…</p>
      </div>
    </div>
  );
}

export default function LazyTerminal() {
  const ref = useRef(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "800px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref}>{near ? <Terminal /> : <TerminalPlaceholder />}</div>;
}
