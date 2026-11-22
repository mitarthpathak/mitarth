"use client";

import { useEffect, useRef } from "react";

// Life a dot loses per second (the old per-frame decay of 0.003–0.007 at
// 60 Hz), so trails last just as long on a 120 Hz screen.
const DECAY_MIN = 0.18;
const DECAY_RANGE = 0.24;
const MAX_DOTS = 900;

export default function DotCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let rect = null;
    let dots = [];
    let rafId = 0;
    let last = 0;
    let visible = false;

    const resize = () => {
      const parent = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = parent.width;
      height = parent.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Resizing a canvas resets its context state.
      ctx.fillStyle = "rgb(36, 36, 36)";
      rect = null;
    };

    const animate = (now) => {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
      last = now;
      ctx.clearRect(0, 0, width, height);

      let alive = 0;
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        dot.life -= dot.decay * dt;
        if (dot.life <= 0) continue;
        dots[alive++] = dot;
        ctx.globalAlpha = dot.opacity * dot.life;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fill();
      }
      dots.length = alive;
      ctx.globalAlpha = 1;

      // Nothing left to fade: stop until the pointer draws again.
      rafId = alive > 0 ? requestAnimationFrame(animate) : 0;
    };

    const handleMouseMove = (e) => {
      if (!visible) return;
      // The canvas sits in a sticky scene, so its box only moves on scroll
      // and resize; reading it once per change keeps layout out of mousemove.
      if (!rect) rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < -30 || y < -30 || x > width + 30 || y > height + 30) return;

      // Add a cluster of dots around the cursor
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 25;
        dots.push({
          x: x + Math.cos(angle) * radius,
          y: y + Math.sin(angle) * radius,
          size: 2 + Math.random() * 4,
          opacity: 0.7 + Math.random() * 0.3,
          life: 1,
          decay: DECAY_MIN + Math.random() * DECAY_RANGE,
        });
      }
      if (dots.length > MAX_DOTS) dots = dots.slice(dots.length - MAX_DOTS);

      if (!rafId) {
        last = 0;
        rafId = requestAnimationFrame(animate);
      }
    };

    const invalidateRect = () => {
      rect = null;
    };

    resize();

    // Only collect dots while the yellow scene is actually on screen.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      rect = null;
    });
    io.observe(canvas);

    window.addEventListener("resize", resize);
    window.addEventListener("scroll", invalidateRect, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", invalidateRect);
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return <canvas ref={canvasRef} className="dot-canvas" />;
}
