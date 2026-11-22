"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import useMediaQuery, { FINE_POINTER } from "../hooks/useMediaQuery";
import { useCursorState } from "../hooks/cursorState";
import { smoothing } from "../lib/smoothing";

export default function CursorFollower() {
  const { project: isHoveringProject, mail: isHoveringMail, mailCopied } = useCursorState();
  const mailCursorText = mailCopied ? "Copied" : "Copy ID";
  const hasFinePointer = useMediaQuery(FINE_POINTER);
  const followerRef = useRef(null);
  const [text, setText] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [isWithinHero, setIsWithinHero] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const hasMovedRef = useRef(false);
  const mousePos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const isWithinHeroRef = useRef(true);

  const shouldRender = hasFinePointer && (isVisible || isHoveringProject || isHoveringMail);

  const writePosition = () => {
    const el = followerRef.current;
    if (el) el.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0)`;
  };

  // Place the bubble before it paints, whenever it (re)appears.
  useLayoutEffect(() => {
    if (shouldRender) writePosition();
  });

  // When an action hover starts, snap the bubble onto the pointer instead of
  // letting it trail in from wherever it last was.
  useEffect(() => {
    if ((isHoveringProject || isHoveringMail) && hasMovedRef.current) {
      currentPos.current = { ...mousePos.current };
      writePosition();
    }
  }, [isHoveringProject, isHoveringMail]);

  // Pointer tracking. The bubble is moved with a transform (no layout work)
  // and its frame loop sleeps once it has caught up with the pointer, so a
  // still mouse — or a hidden bubble — costs nothing.
  useEffect(() => {
    if (!hasFinePointer) return;

    let rafId = 0;
    let last = 0;

    // Halfway between "THE GREAT" and the menu button, centered.
    const start = { x: window.innerWidth / 2, y: window.innerHeight * 0.75 };
    currentPos.current = { ...start };
    mousePos.current = { ...start };
    writePosition();

    const animate = (now) => {
      const dt = last ? now - last : 16.7;
      last = now;
      const dx = mousePos.current.x - currentPos.current.x;
      const dy = mousePos.current.y - currentPos.current.y;
      if (!followerRef.current || (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1)) {
        currentPos.current = { ...mousePos.current };
        writePosition();
        rafId = 0;
        return;
      }
      const k = smoothing(0.16, dt);
      currentPos.current.x += dx * k;
      currentPos.current.y += dy * k;
      writePosition();
      rafId = requestAnimationFrame(animate);
    };

    const updateHeroBoundary = (x, y) => {
      const hero = document.querySelector(".hero-section");
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      const isInside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      if (isWithinHeroRef.current !== isInside) {
        isWithinHeroRef.current = isInside;
        setIsWithinHero(isInside);
      }
    };

    const handleMouseMove = (e) => {
      hasMovedRef.current = true;
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!followerRef.current) return;
      updateHeroBoundary(e.clientX, e.clientY);
      if (!rafId) {
        last = 0;
        rafId = requestAnimationFrame(animate);
      }
    };

    const handleViewportChange = () => {
      if (followerRef.current) updateHeroBoundary(mousePos.current.x, mousePos.current.y);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("scroll", handleViewportChange, { passive: true });
    window.addEventListener("resize", handleViewportChange);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [hasFinePointer]);

  // Typing timeline effect
  useEffect(() => {
    let cancelled = false;

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const typeText = async (str, speed) => {
      for (let i = 1; i <= str.length; i++) {
        if (cancelled) return;
        setText(str.slice(0, i));
        await sleep(speed);
      }
    };

    const deleteStr = async (str, speed) => {
      for (let i = str.length - 1; i >= 0; i--) {
        if (cancelled) return;
        setText(str.slice(0, i));
        await sleep(speed);
      }
      if (!cancelled) setText("");
    };

    const run = async () => {
      // Phase 1: Type "hey there!" over ~1s
      await typeText("hey there!", 100);

      // Hold until t ≈ 5s
      await sleep(4000);

      // Phase 2: Delete "hey there!" letter by letter
      await deleteStr("hey there!", 60);

      // Brief pause
      await sleep(1000);

      // Phase 3: Type "Curious? have a look!"
      await typeText("Curious? have a look!", 80);

      // Hold for a bit
      await sleep(4200);

      // Phase 4: Delete "Curious? have a look!"
      await deleteStr("Curious? have a look!", 50);

      // Phase 5: Fade out and disappear
      if (!cancelled) {
        setIsFadingOut(true);
        await sleep(1500);
        if (!cancelled) setIsVisible(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const isActionHover = isHoveringProject || isHoveringMail;

  // A mouse-follow cursor only makes sense with a real mouse: on touch
  // screens there is no hover, so it would sit frozen over the content.
  // It never replaces the system cursor, it only follows it.
  if (!shouldRender) return null;

  // When hovering action targets, override fade-out and hero boundary
  const effectiveFadeOut = isActionHover ? false : isFadingOut || !isWithinHero;

  return (
    <div ref={followerRef} className="cursor-follower-pos" aria-hidden={!isWithinHero && !isActionHover}>
      <div
        className={`cursor-follower ${effectiveFadeOut ? "fade-out" : ""} ${isHoveringProject ? "cylinder-cursor" : ""} ${isHoveringMail ? "copy-cursor" : ""}`}
      >
        {isHoveringProject ? (
          <>
            <span className="cursor-icon">↗</span>
            <span className="cursor-text">View project</span>
          </>
        ) : isHoveringMail ? (
          <>
            <span className="cursor-copy-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </span>
            <span className="cursor-text">{mailCursorText}</span>
          </>
        ) : (
          <>
            {text}
            <span className="cursor-blink" />
          </>
        )}
      </div>
    </div>
  );
}
