"use client";

import { useState } from "react";

export default function HeroName() {
  const line1 = ["N", "I", "T", "H", "I", "N"];
  const space = " ";
  const line1b = ["M"];
  const line2 = ["W", "A", "R", "R", "I", "E", "R"];

  return (
    <div className="hero-name-container">
      <div className="hero-name-line">
        <span style={{ display: "inline-block", overflow: "visible" }}>
          {line1.map((letter, i) => (
            <HeroLetter key={`l1-${i}`} letter={letter} />
          ))}
        </span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(60px, 15.8vw, 280px)",
            lineHeight: "0.95",
            display: "inline-block",
            whiteSpace: "pre",
          }}
        >
          {space}
        </span>
        <span style={{ display: "inline-block", overflow: "visible" }}>
          {line1b.map((letter, i) => (
            <HeroLetter key={`l1b-${i}`} letter={letter} />
          ))}
        </span>
      </div>
      <div className="hero-name-line">
        <span style={{ display: "inline-block", overflow: "visible" }}>
          {line2.map((letter, i) => (
            <HeroLetter key={`l2-${i}`} letter={letter} />
          ))}
        </span>
      </div>
    </div>
  );
}

function HeroLetter({ letter }) {
  const [hovered, setHovered] = useState(false);

  return (
    <span
      className="hero-letter"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: hovered ? "translateY(-12px) scale(1.08)" : "translateY(0) scale(1)",
        color: hovered ? "var(--blue)" : "var(--dark)",
      }}
    >
      {letter}
    </span>
  );
}
