"use client";

import { useLayoutEffect } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

// The hero's entrance, played the moment the signature intro ends (its 6 s
// timer, Esc or Skip), each piece with its own motion:
//   MITARTH      letters rise one by one
//   side lines   draw outward from the title
//   THE GREAT    letters drop in from the middle out
//   subtitles    "AI & Full-Stack Developer" types in from the left,
//                "Based in Jaipur, Rajasthan" from the right
// While the intro plays, CSS keeps these pieces hidden (animation.css). The
// switch is caught with a MutationObserver, so the starting states are set
// before the next paint and nothing flashes. Off under reduced motion.
export default function HeroEntrance() {
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const html = document.documentElement;
    let ctx;

    const play = () => {
      ctx = gsap.context(() => {
        const q = (s) => document.querySelectorAll(s);
        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

        tl.from(q(".hero-in-name .hero-letter-in"), {
          yPercent: 120,
          opacity: 0,
          rotate: 8,
          duration: 1,
          stagger: 0.07,
        });

        tl.from(q(".hero-in-left .hero-line-bar"), { scaleX: 0, transformOrigin: "right center", duration: 1, ease: "expo.out" }, 0.35);
        tl.from(q(".hero-in-right .hero-line-bar"), { scaleX: 0, transformOrigin: "left center", duration: 1, ease: "expo.out" }, 0.35);

        tl.from(
          q(".hero-in-great .hero-letter-in"),
          { y: -60, opacity: 0, duration: 0.8, ease: "back.out(1.8)", stagger: { each: 0.06, from: "center" } },
          0.45
        );

        const left = document.querySelector(".hero-in-left .hero-subtitle");
        const right = document.querySelector(".hero-in-right .hero-subtitle");
        if (left) {
          const s = SplitText.create(left, { type: "chars" });
          tl.from(s.chars, { opacity: 0, x: -14, duration: 0.5, ease: "power3.out", stagger: 0.025 }, 0.8);
        }
        if (right) {
          const s = SplitText.create(right, { type: "chars" });
          tl.from(s.chars, { opacity: 0, x: 14, duration: 0.5, ease: "power3.out", stagger: { each: 0.025, from: "end" } }, 0.8);
        }
      });
    };

    if (html.dataset.intro !== "play") {
      play();
      return () => ctx?.revert();
    }
    const mo = new MutationObserver(() => {
      if (html.dataset.intro === "play") return;
      mo.disconnect();
      play();
    });
    mo.observe(html, { attributes: true, attributeFilter: ["data-intro"] });
    return () => {
      mo.disconnect();
      ctx?.revert();
    };
  }, []);

  return null;
}
