"use client";

import { useEffect, useRef } from "react";

export default function ProjectImageCursor({ isActive = false }) {
  const cursorRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const rafId = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isActive) {
        mousePos.current = { x: e.clientX, y: e.clientY };
      }
    };

    const animate = () => {
      const dx = mousePos.current.x - currentPos.current.x;
      const dy = mousePos.current.y - currentPos.current.y;
      currentPos.current.x += dx * 0.2;
      currentPos.current.y += dy * 0.2;

      if (cursorRef.current) {
        cursorRef.current.style.left = `${currentPos.current.x}px`;
        cursorRef.current.style.top = `${currentPos.current.y}px`;
      }
      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      ref={cursorRef}
      className="project-image-cursor"
      style={{
        position: "fixed",
        pointerEvents: "none",
        zIndex: 9999,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="cursor-ring"></div>
    </div>
  );
}
