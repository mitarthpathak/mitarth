"use client";

import { memo, useState, useEffect } from "react";
import useIntroDone from "../hooks/useIntroDone";

function HeroText({ text, size, globalDelay = 0 }) {
  const isSmall = size === "small";
  const defaultSize = "clamp(40px, 8vw, 130px)";
  const smallSize = "clamp(32px, 4vw, 70px)";
  const currentFontSize = isSmall ? smallSize : defaultSize;

  return (
    <div className="hero-name" style={{ display: "flex", justifyContent: "center" }}>
      {text.split("").map((letter, index) => {
        if (letter === " ") {
          return (
            <span
              key={index}
              className="hero-letter-in"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: currentFontSize,
                lineHeight: "0.95",
                display: "inline-block",
                whiteSpace: "pre",
              }}
            >
              {" "}
            </span>
          );
        }

        // The outer span is what the entrance animates (HeroEntrance.js);
        // the inner one keeps its own hover transform.
        return (
          <span key={index} className="hero-letter-in" style={{ display: "inline-block" }}>
            <HeroLetter letter={letter} fontSize={currentFontSize} index={index} globalDelay={globalDelay} />
          </span>
        );
      })}
    </div>
  );
}

function HeroLetter({ letter, fontSize, index, globalDelay }) {
  const [hovered, setHovered] = useState(false);
  const introDone = useIntroDone();

  useEffect(() => {
    // The ripple follows the hero's entrance, after the signature intro.
    if (!introDone) return;
    // Initial auto-hover ripple effect on load
    let resetTimer;
    const triggerTimer = setTimeout(() => {
      setHovered(true);
      // Reset hover state after 300ms to complete the "bounce"
      resetTimer = setTimeout(() => {
        setHovered(false);
      }, 300);
    }, 1600 + globalDelay + (index * 60)); // 60ms between letters for a fast ripple

    return () => {
      clearTimeout(triggerTimer);
      clearTimeout(resetTimer);
    };
  }, [index, globalDelay, introDone]);

  return (
    <span
      className="hero-letter"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize: fontSize,
        transform: hovered ? "translateY(-12px) scale(1.08)" : "translateY(0) scale(1)",
        color: hovered ? "var(--blue)" : "var(--dark)",
        display: "inline-block",
        // Only what changes; "all" also animated font-size on every resize.
        transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.3s ease",
        cursor: "default"
      }}
    >
      {letter}
    </span>
  );
}

export default memo(HeroText);
