"use client";

import { useEffect, useState } from "react";

// Mini table of contents for a case study. Sticky beside the text on wide
// screens; on phones it collapses into a <details> "On this page" toggle.
// The current section is tracked with an IntersectionObserver (no scroll
// handlers, no scroll-jacking).
export default function CaseToc({ sections }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean);
    const visible = new Map();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => visible.set(e.target.id, e.isIntersecting));
        const first = els.find((el) => visible.get(el.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-20% 0px -55% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  const list = (
    <ol className="cs-toc-list">
      {sections.map((s, i) => (
        <li key={s.id}>
          <a href={`#${s.id}`} aria-current={active === s.id ? "true" : undefined}>
            <span className="cs-toc-index" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            {s.label}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <nav className="cs-toc" aria-label="On this page">
      <p className="cs-toc-title">On this page</p>
      <div className="cs-toc-desktop">{list}</div>
      <details className="cs-toc-mobile">
        <summary>On this page</summary>
        {list}
      </details>
    </nav>
  );
}
