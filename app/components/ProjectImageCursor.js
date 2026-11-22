"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useCursorState } from "../hooks/cursorState";
import { smoothing } from "../lib/smoothing";

const SIZE = 60;

// The ring that trails the pointer over a project card. Only tracks and
// animates while a card is hovered; it appears right under the pointer
// (it used to fly in from the corner of the screen) and its loop sleeps as
// soon as it has caught up.
export default function ProjectImageCursor() {
  const { project: isActive } = useCursorState();
  const cursorRef = useRef(null);
  const mousePos = useRef(null);
  const currentPos = useRef({ x: 0, y: 0 });

  // Always know where the pointer is, so the ring can start right there.
  useEffect(() => {
    const onMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useLayoutEffect(() => {
    if (!isActive) return;
    const el = cursorRef.current;
    if (!el) return;

    let rafId = 0;
    let last = 0;
    const write = () => {
      el.style.transform = `translate3d(${currentPos.current.x - SIZE / 2}px, ${currentPos.current.y - SIZE / 2}px, 0)`;
    };
    if (mousePos.current) currentPos.current = { ...mousePos.current };
    write();

    const animate = (now) => {
      const dt = last ? now - last : 16.7;
      last = now;
      const target = mousePos.current || currentPos.current;
      const dx = target.x - currentPos.current.x;
      const dy = target.y - currentPos.current.y;
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        currentPos.current = { ...target };
        write();
        rafId = 0;
        return;
      }
      const k = smoothing(0.25, dt);
      currentPos.current.x += dx * k;
      currentPos.current.y += dy * k;
      write();
      rafId = requestAnimationFrame(animate);
    };

    const onMove = () => {
      if (!rafId) {
        last = 0;
        rafId = requestAnimationFrame(animate);
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      ref={cursorRef}
      className="project-image-cursor"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 9999,
        willChange: "transform",
      }}
    >
      <div className="cursor-ring"></div>
    </div>
  );
}
