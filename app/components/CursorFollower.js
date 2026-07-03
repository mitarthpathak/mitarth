"use client";

import { useEffect, useRef, useState } from "react";

export default function CursorFollower({
  isHoveringProject = false,
  isHoveringMail = false,
  mailCursorText = "Copy ID",
}) {
  const followerRef = useRef(null);
  const [text, setText] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [isWithinHero, setIsWithinHero] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const hasMovedRef = useRef(false);
  const mousePos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const rafId = useRef(null);
  const isWithinHeroRef = useRef(true);
  const isHoveringProjectRef = useRef(false);
  const isHoveringMailRef = useRef(false);

  // Update ref when prop changes
  useEffect(() => {
    isHoveringProjectRef.current = isHoveringProject;
    // When hovering starts, snap cursor to current mouse position
    if (isHoveringProject && hasMovedRef.current) {
      mousePos.current = { x: currentPos.current.x, y: currentPos.current.y };
    }
  }, [isHoveringProject]);

  useEffect(() => {
    isHoveringMailRef.current = isHoveringMail;
    if (isHoveringMail && hasMovedRef.current) {
      mousePos.current = { x: currentPos.current.x, y: currentPos.current.y };
    }
  }, [isHoveringMail]);

  // Position + mouse tracking effect
  useEffect(() => {
    // Position halfway between the center text ("THE GREAT") and the bottom menu button, perfectly centered horizontally
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight * 0.75;
    currentPos.current = { x: startX, y: startY };
    mousePos.current = { x: startX, y: startY };

    if (followerRef.current) {
      followerRef.current.style.left = `${startX}px`;
      followerRef.current.style.top = `${startY}px`;
    }

    const updateHeroBoundary = (x, y) => {
      const hero = document.querySelector(".hero-section");
      if (!hero) return true;

      const rect = hero.getBoundingClientRect();
      const isInside =
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom;

      if (isWithinHeroRef.current !== isInside) {
        isWithinHeroRef.current = isInside;
        setIsWithinHero(isInside);
      }

      return isInside;
    };

    const handleMouseMove = (e) => {
      hasMovedRef.current = true;
      updateHeroBoundary(e.clientX, e.clientY);
      // Always track mouse position globally
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleViewportChange = () => {
      updateHeroBoundary(mousePos.current.x, mousePos.current.y);
    };

    const animate = () => {
      const dx = mousePos.current.x - currentPos.current.x;
      const dy = mousePos.current.y - currentPos.current.y;
      currentPos.current.x += dx * 0.12;
      currentPos.current.y += dy * 0.12;

      if (followerRef.current) {
        followerRef.current.style.left = `${currentPos.current.x}px`;
        followerRef.current.style.top = `${currentPos.current.y}px`;
      }
      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleViewportChange, { passive: true });
    window.addEventListener("resize", handleViewportChange);
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

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
      setText("");
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
        setIsVisible(false);
      }
    };

    run();

    return () => { cancelled = true; };
  }, []);

  const isActionHover = isHoveringProject || isHoveringMail;

  // Always show cursor on action hovers, regardless of fade state
  if (!isVisible && !isActionHover) return null;

  // When hovering action targets, override fade-out and hero boundary
  const effectiveFadeOut = isActionHover ? false : (isFadingOut || !isWithinHero);

  return (
    <div
      ref={followerRef}
      className={`cursor-follower ${effectiveFadeOut ? "fade-out" : ""} ${isHoveringProject ? "cylinder-cursor" : ""} ${isHoveringMail ? "copy-cursor" : ""}`}
      aria-hidden={!isWithinHero && !isActionHover}
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
  );
}
