"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const EMAIL = "mpathak6207@gmail.com";

export default function Menu() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState("main"); // "main" | "contact"
  const wrapperRef = useRef(null);
  const toggleRef = useRef(null);
  const firstLinkRef = useRef(null);
  const contactLinkRef = useRef(null);
  const contactButtonRef = useRef(null);
  const resetTimer = useRef(null);

  const close = useCallback((returnFocus = false) => {
    setIsOpen(false);
    // Reset the view once the collapse animation has finished
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setView("main"), 500);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  const open = () => {
    window.clearTimeout(resetTimer.current);
    setView("main");
    setIsOpen(true);
  };

  // Esc closes and returns focus to the toggle; a click outside closes.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") close(true);
    };
    const onPointer = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [isOpen, close]);

  // Move focus into whichever view just became visible.
  useEffect(() => {
    if (!isOpen) return;
    const target = view === "contact" ? contactLinkRef.current : firstLinkRef.current;
    const id = window.setTimeout(() => target?.focus({ preventScroll: true }), 60);
    return () => window.clearTimeout(id);
  }, [isOpen, view]);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  const showMain = () => {
    setView("main");
    window.setTimeout(() => contactButtonRef.current?.focus({ preventScroll: true }), 60);
  };

  const label = view === "contact" && isOpen ? "Contact" : "Menu";

  return (
    <nav
      ref={wrapperRef}
      aria-label="Site"
      className={`menu-wrapper ${isOpen ? "open" : ""} ${view === "contact" ? "contact-open" : ""}`}
    >
      <div className="menu-inner">
        <div id="site-menu-panel" className="menu-panel" inert={!isOpen}>
          <ul className="menu-links" inert={view !== "main"}>
            <li>
              <Link ref={firstLinkRef} href="/" className="menu-link" onClick={() => close(false)}>
                HOME
              </Link>
            </li>
            <li>
              <Link href="/#work" className="menu-link" onClick={() => close(false)}>
                WORKS
              </Link>
            </li>
            <li>
              <button
                ref={contactButtonRef}
                type="button"
                className="menu-link"
                onClick={() => setView("contact")}
              >
                CONTACT
              </button>
            </li>
          </ul>

          <div className="menu-contact-view" inert={view !== "contact"}>
            <p className="contact-header">Open to AI / full-stack internships</p>
            <ul className="contact-list">
              <li>
                <a ref={contactLinkRef} href={`mailto:${EMAIL}`}>
                  {EMAIL}
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/in/mitarth-pathak" target="_blank" rel="noopener noreferrer">
                  LinkedIn <span aria-hidden="true">↗</span>
                </a>
              </li>
              <li>
                <a href="https://github.com/mitarthpathak" target="_blank" rel="noopener noreferrer">
                  GitHub <span aria-hidden="true">↗</span>
                </a>
              </li>
            </ul>
            <button type="button" className="contact-back-btn" onClick={showMain}>
              Back
            </button>
          </div>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="menu-footer"
          aria-expanded={isOpen}
          aria-controls="site-menu-panel"
          onClick={() => (isOpen ? close(false) : open())}
        >
          <span className="menu-text">{label}</span>
          <span className="menu-icon" aria-hidden="true">{isOpen ? "×" : "="}</span>
        </button>
      </div>
    </nav>
  );
}
