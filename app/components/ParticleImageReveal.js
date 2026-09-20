"use client";

import { useEffect, useRef, useState } from "react";

/*
 * ParticleImageReveal -- wraps an already-built image element (its children)
 * and, every time it scrolls into view, plays a "dust settling into place"
 * intro: pixels sampled from `src` scatter outward then ease back into the
 * exact shape of the image, on a canvas laid on top. Scrolling away and back
 * replays it from scratch.
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
  const particlesRef = useRef(null); // cached { w, h, base: [{tx,ty,r,g,b,a}] } — computed once per src
  const rafRef = useRef(null);
  const wasVisibleRef = useRef(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !wasVisibleRef.current) {
          wasVisibleRef.current = true;
          playParticles();
        } else if (!entry.isIntersecting && wasVisibleRef.current) {
          wasVisibleRef.current = false;
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          setRevealed(false);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };

    function getBaseParticles(w, h, onReady) {
      const cached = particlesRef.current;
      if (cached && cached.w === w && cached.h === h) {
        onReady(cached.base);
        return;
      }
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
          particlesRef.current = { w, h, base: [] };
          onReady([]);
          return;
        }

        const base = [];
        for (let y = 0; y < h; y += particleGap) {
          for (let x = 0; x < w; x += particleGap) {
            const i = (y * w + x) * 4;
            const a = data[i + 3];
            if (a < 60) continue;
            base.push({ tx: x, ty: y, r: data[i], g: data[i + 1], b: data[i + 2], a: a / 255 });
          }
        }
        particlesRef.current = { w, h, base };
        onReady(base);
      };
    }

    function playParticles() {
      const wrap = wrapRef.current;
      const canvas = canvasRef.current;
      if (!wrap || !canvas) return;

      setRevealed(false);

      const rect = wrap.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));

      getBaseParticles(w, h, (base) => {
        // Not visible any more by the time the image/base finished loading.
        if (!wasVisibleRef.current) return;
        if (base.length === 0) {
          setRevealed(true);
          return;
        }

        // The canvas is drawn much bigger than the image itself and centered
        // over it, so scattered dust can drift well beyond the image's own
        // edges. Without this the scatter gets clipped into a visible box.
        const pad = 1.5;
        const canvasW = w * (1 + pad * 2);
        const canvasH = h * (1 + pad * 2);
        const padX = w * pad;
        const padY = h * pad;
        const maxDist = (Math.min(canvasW, canvasH) / 2) * 0.94;

        const particles = base.map((p) => {
          const angle = Math.random() * Math.PI * 2;
          const distT = 0.25 + Math.random() * 0.75;
          const dist = maxDist * distT;
          return {
            ...p,
            tx: p.tx + padX,
            ty: p.ty + padY,
            x: canvasW / 2 + Math.cos(angle) * dist,
            y: canvasH / 2 + Math.sin(angle) * dist,
            // Particles that start further out begin fainter, so the cloud
            // thins out toward its edges instead of ending in a hard line.
            scatterAlpha: 1 - distT * 0.8,
            delay: Math.random() * 0.4,
            size: particleGap * 1.1,
          };
        });

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = canvasW * dpr;
        canvas.height = canvasH * dpr;
        canvas.style.width = `${canvasW}px`;
        canvas.style.height = `${canvasH}px`;
        canvas.style.left = `${-padX}px`;
        canvas.style.top = `${-padY}px`;
        const ctx = canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const ease = (t) => 1 - Math.pow(1 - t, 3);
        const start = performance.now();

        function frame(now) {
          const elapsed = (now - start) / 1000;
          ctx.clearRect(0, 0, canvasW, canvasH);
          let done = true;
          for (const p of particles) {
            const t = Math.min(1, Math.max(0, (elapsed - p.delay) / Math.max(0.001, duration - p.delay)));
            if (t < 1) done = false;
            const e = ease(t);
            const cx = p.x + (p.tx - p.x) * e;
            const cy = p.y + (p.ty - p.y) * e;
            const alphaMix = p.scatterAlpha + (1 - p.scatterAlpha) * e;
            ctx.globalAlpha = p.a * alphaMix;
            ctx.fillStyle = `rgb(${p.r}, ${p.g}, ${p.b})`;
            ctx.fillRect(cx, cy, p.size, p.size);
          }
          ctx.globalAlpha = 1;
          if (!done) {
            rafRef.current = requestAnimationFrame(frame);
          } else {
            rafRef.current = null;
            if (wasVisibleRef.current) setTimeout(() => setRevealed(true), 150);
          }
        }
        rafRef.current = requestAnimationFrame(frame);
      });
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
          opacity: revealed ? 0 : 1,
          transition: "opacity 0.7s ease",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
