"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Subtle scroll reveals for case-study blocks marked with [data-reveal]:
// a short rise and fade (≈450 ms, the site's power3 easing), once each.
// Only blocks that start below the fold are animated, so nothing on the
// first screen ever flashes. Disabled entirely under reduced motion.
export default function CaseReveal() {
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const fold = window.innerHeight;
      gsap.utils.toArray("[data-reveal]").forEach((el) => {
        if (el.getBoundingClientRect().top < fold) return;
        gsap.from(el, {
          y: 24,
          opacity: 0,
          duration: 0.45,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });
    });
    return () => mm.revert();
  }, []);

  return null;
}
