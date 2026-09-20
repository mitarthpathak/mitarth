"use client";

import { useEffect, useRef, useState } from "react";

/*
 * ParticleImageReveal -- wraps an already-built image element (its children)
 * and, the first time it scrolls into view, plays a one-off "dust settling
 * into place" intro: pixels sampled from `src` scatter outward then ease
 * back into the exact shape of the image, on a canvas laid on top.
 *
 * The wrapped children are never modified -- they sit underneath the whole
 * time and simply fade in once the particles finish, so any interaction the
 * children already have (hover, tilt, tooltip, ...) keeps working exactly as
 * before. Pointer events on the children are only enabled after the reveal,
 * so hovering during the particle phase can't reach through to them early.
 */
export default function ParticleImageReveal({ src, children, duration = 1.6, particleGap = 3 }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const startedRef = useRef(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          observer.disconnect();
          startParticles();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();

    function startParticles() {
      const wrap = wrapRef.current;
      const canvas = canvasRef.current;
      if (!wrap || !canvas) return;

      const rect = wrap.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));

      const img = new Image();
      img.src = src;
      img.onload = () => {
        const off = document.createElement("canvas");
        off.width = w;
        off.height = h;
        const octx = off.getContext("2d");
        octx.drawImage(img, 0, 0, w, h);

        let data;
        try {
          data = octx.getImageData(0, 0, w, h).data;
        } catch {
          setRevealed(true);
          return;
        }

        const particles = [];
        for (let y = 0; y < h; y += particleGap) {
          for (let x = 0; x < w; x += particleGap) {
            const i = (y * w + x) * 4;
            const a = data[i + 3];
            if (a < 60) continue;
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.max(w, h) * (0.35 + Math.random() * 0.55);
            particles.push({
              tx: x,
              ty: y,
              x: w / 2 + Math.cos(angle) * dist,
              y: h / 2 + Math.sin(angle) * dist,
              r: data[i],
              g: data[i + 1],
              b: data[i + 2],
              a: a / 255,
              delay: Math.random() * 0.4,
              size: particleGap * 1.1,
            });
          }
        }

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        const ctx = canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const ease = (t) => 1 - Math.pow(1 - t, 3);
        const start = performance.now();

        function frame(now) {
          const elapsed = (now - start) / 1000;
          ctx.clearRect(0, 0, w, h);
          let done = true;
          for (const p of particles) {
            const t = Math.min(1, Math.max(0, (elapsed - p.delay) / Math.max(0.001, duration - p.delay)));
            if (t < 1) done = false;
            const e = ease(t);
            const cx = p.x + (p.tx - p.x) * e;
            const cy = p.y + (p.ty - p.y) * e;
            ctx.globalAlpha = p.a * (0.35 + 0.65 * e);
            ctx.fillStyle = `rgb(${p.r}, ${p.g}, ${p.b})`;
            ctx.fillRect(cx, cy, p.size, p.size);
          }
          ctx.globalAlpha = 1;
          if (!done) {
            requestAnimationFrame(frame);
          } else {
            setTimeout(() => setRevealed(true), 150);
          }
        }
        requestAnimationFrame(frame);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "inline-block" }}>
      <div style={{ opacity: revealed ? 1 : 0, transition: "opacity 0.7s ease", pointerEvents: revealed ? "auto" : "none" }}>
        {children}
      </div>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          opacity: revealed ? 0 : 1,
          transition: "opacity 0.7s ease",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
