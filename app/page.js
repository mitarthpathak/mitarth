"use client";

import { useEffect, useRef, useState } from "react";
import CursorFollower from "./components/CursorFollower";
import HeroName from "./components/HeroName";
import DotCanvas from "./components/DotCanvas";

export default function Home() {
  const [pillsVisible, setPillsVisible] = useState(false);
  const [revealDone, setRevealDone] = useState(false);
  const transitionRef = useRef(null);
  const yellowRef = useRef(null);
  const revealColsRef = useRef([]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewH = window.innerHeight;

      // --- Reveal columns: shrink as user scrolls past hero ---
      if (revealColsRef.current.length > 0) {
        const revealStart = viewH * 0.6;
        const revealEnd = viewH * 1.2;
        const progress = Math.min(
          1,
          Math.max(0, (scrollY - revealStart) / (revealEnd - revealStart))
        );
        revealColsRef.current.forEach((col, i) => {
          if (col) {
            const delay = i * 0.06;
            const colProgress = Math.min(
              1,
              Math.max(0, (progress - delay) / (1 - delay))
            );
            col.style.transform = `scaleY(${1 - colProgress})`;
          }
        });
      }

      // --- Role pills: show when transition section is in view ---
      if (transitionRef.current) {
        const rect = transitionRef.current.getBoundingClientRect();
        const inView = rect.top < viewH * 0.7 && rect.bottom > viewH * 0.3;
        setPillsVisible(inView);
      }

      // --- Track if we've scrolled past the reveal ---
      if (scrollY > viewH * 1.2) {
        setRevealDone(true);
      } else {
        setRevealDone(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <CursorFollower />

      {/* Vertical guide lines */}
      <div className="guide-line guide-line-left" />
      <div className="guide-line guide-line-right" />

      <main style={{ position: "relative" }}>
        {/* ===== HERO SECTION ===== */}
        <section className="hero-section">
          {/* Grid background */}
          <div className="hero-grid" />

          {/* Side lines + subtitles */}
          <div className="hero-side-lines hero-side-lines-left">
            <div className="hero-line-bar" />
            <span className="hero-subtitle">Visual Designer</span>
          </div>

          {/* Name */}
          <HeroName />

          {/* Right side */}
          <div className="hero-side-lines hero-side-lines-right">
            <span className="hero-subtitle">Based in India</span>
            <div className="hero-line-bar" />
          </div>
        </section>

        {/* ===== REVEAL COLUMNS (cream → yellow transition) ===== */}
        <div className="reveal-columns">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="reveal-col"
              ref={(el) => {
                revealColsRef.current[i] = el;
              }}
            />
          ))}
        </div>

        {/* ===== TRANSITION SECTION (role pills) ===== */}
        <div ref={transitionRef} className="transition-section">
          <div className="role-pills-container">
            <span
              className={`role-pill ${pillsVisible ? "visible" : ""}`}
              style={{ transitionDelay: "0s" }}
            >
              Brand Designer
            </span>
            <span
              className={`role-pill ${pillsVisible ? "visible" : ""}`}
              style={{ transitionDelay: "0.1s" }}
            >
              Web Designer
            </span>
            <span
              className={`role-pill ${pillsVisible ? "visible" : ""}`}
              style={{ transitionDelay: "0.2s" }}
            >
              Product Designer
            </span>
          </div>
        </div>

        {/* ===== YELLOW SECTION ===== */}
        <section ref={yellowRef} className="yellow-section">
          {/* Dot trail canvas */}
          <DotCanvas />

          {/* Portrait */}
          <div className="portrait-container">
            <img
              src="/portrait.png"
              alt="Nithin M Warrier"
              className="portrait-img"
            />
          </div>
        </section>
      </main>
    </>
  );
}
