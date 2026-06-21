"use client";

import { useEffect, useRef, useState } from "react";

export default function CursorFollower() {
  const followerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const mousePos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  const rafId = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    // Smooth lerp animation
    const animate = () => {
      const dx = mousePos.current.x - currentPos.current.x;
      const dy = mousePos.current.y - currentPos.current.y;

      // Ease factor — lower = smoother/laggier
      currentPos.current.x += dx * 0.12;
      currentPos.current.y += dy * 0.12;

      if (followerRef.current) {
        followerRef.current.style.left = `${currentPos.current.x}px`;
        followerRef.current.style.top = `${currentPos.current.y}px`;
      }

      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [visible]);

  return (
    <div
      ref={followerRef}
      className={`cursor-follower ${visible ? "visible" : ""}`}
    >
      hey!
      <span className="cursor-blink" />
    </div>
  );
}
