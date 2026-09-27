"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/*
 * ScrollReveal -- generic scroll-triggered stagger reveal for a group of
 * non-text elements (icons, cards, ...). Mirrors SplitText's ScrollTrigger
 * setup (same start-position math) so it matches the rest of the site's
 * scrollytelling feel, but animates whole children instead of split glyphs.
 *
 * `clearProps` removes the inline styles GSAP sets once the reveal finishes,
 * so elements that have their own hover/active CSS states (like the footer
 * icons hiding on mail-hover) aren't stuck fighting a leftover inline style.
 */
export default function ScrollReveal({
  children,
  as: Tag = "div",
  className = "",
  selector = ":scope > *",
  stagger = 0.08,
  duration = 0.7,
  ease = "power3.out",
  from = { opacity: 0, y: 24 },
  to = { opacity: 1, y: 0 },
  threshold = 0.2,
  rootMargin = "-60px",
  clearProps,
}) {
  const ref = useRef(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      // Reduced motion: leave every child in its final, visible state.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const targets = ref.current.querySelectorAll(selector);
      if (!targets.length) return;

      gsap.set(targets, from);

      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
      const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch ? marginMatch[2] || "px" : "px";
      const sign =
        marginValue === 0 ? "" : marginValue < 0 ? `-=${Math.abs(marginValue)}${marginUnit}` : `+=${marginValue}${marginUnit}`;
      const start = `top ${startPct}%${sign}`;

      const tween = gsap.to(targets, {
        ...to,
        duration,
        ease,
        stagger,
        clearProps,
        scrollTrigger: {
          trigger: ref.current,
          start,
          once: true,
          fastScrollEnd: true,
          anticipatePin: 0.4,
        },
        willChange: "transform, opacity",
        force3D: true,
      });

      return () => {
        ScrollTrigger.getAll().forEach((st) => {
          if (st.trigger === ref.current) st.kill();
        });
        tween.kill();
      };
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
