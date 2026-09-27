"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

// Scrollytelling for the case-study pages. Everything is progressive: the
// server HTML is complete and readable, and this only adds motion on top.
//
//  - a reading-progress line along the top of the page
//  - the hero image drifts and eases back as you scroll past it
//  - section headings rise line by line out of a mask
//  - the problem and role text light up word by word as you read
//  - lists, decision cards and blocks cascade in
//  - screenshots unmask from their centre
//  - the architecture diagram assembles node by node with the scroll
//  - the next project's image moves at its own pace
//
// Only things that start below the fold are hidden before they animate, so
// the first screen never flashes. Under reduced motion only the progress
// line (which just follows the scroll) remains.
export default function CaseMotion() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".cs-progress", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
      });
    });

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const fold = window.innerHeight;
      const below = (el) => el.getBoundingClientRect().top > fold * 0.9;
      const once = (trigger, start = "top 85%") => ({ trigger, start, once: true });

      // Hero image: a slow drift while the page scrolls past it.
      const media = document.querySelector(".cs-hero-media");
      if (media) {
        gsap.to(media, {
          yPercent: 6,
          scale: 0.97,
          ease: "none",
          scrollTrigger: { trigger: media, start: "top 40%", end: "bottom top", scrub: 0.6 },
        });
      }

      // Section headings: label slides in, heading lines rise out of a mask.
      gsap.utils.toArray(".cs-content .cs-section-head").forEach((head) => {
        if (!below(head)) return;
        const label = head.querySelector(".cs-label");
        const h2 = head.querySelector(".cs-h2");
        if (label) gsap.from(label, { x: -16, opacity: 0, duration: 0.6, ease: "power3.out", scrollTrigger: once(head) });
        if (h2) {
          SplitText.create(h2, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 110,
                duration: 0.9,
                stagger: 0.08,
                ease: "power4.out",
                scrollTrigger: once(head),
              }),
          });
        }
      });

      // Reading-paced text: words brighten as the paragraph moves up the screen.
      gsap.utils.toArray(".cs-lead, .cs-lead-soft").forEach((p) => {
        SplitText.create(p, {
          type: "words",
          autoSplit: true,
          onSplit: (self) =>
            gsap.fromTo(
              self.words,
              { opacity: 0.16 },
              {
                opacity: 1,
                stagger: 0.05,
                ease: "none",
                scrollTrigger: { trigger: p, start: "top 82%", end: "bottom 50%", scrub: 0.4 },
              }
            ),
        });
      });

      // Lists cascade in, item by item.
      gsap.utils.toArray(".cs-features, .cs-products, .cs-results, .cs-learned").forEach((list) => {
        if (!below(list)) return;
        gsap.from(list.children, {
          y: 22,
          opacity: 0,
          duration: 0.6,
          stagger: 0.07,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: once(list),
        });
      });

      // Decision cards rise one after another; their numbers pop in.
      gsap.utils.toArray(".cs-decision").forEach((card, i) => {
        if (!below(card)) return;
        const tl = gsap.timeline({ scrollTrigger: once(card, "top 88%") });
        tl.from(card, { y: 40, opacity: 0, duration: 0.7, ease: "power3.out", delay: (i % 2) * 0.08, clearProps: "transform,opacity" });
        const n = card.querySelector(".cs-decision-index");
        if (n) tl.from(n, { scale: 0.4, opacity: 0, duration: 0.5, ease: "back.out(2)" }, "-=0.45");
      });

      // Screenshots: unmask from the centre while the image settles.
      gsap.utils.toArray(".cs-shot-frame").forEach((frame) => {
        if (!below(frame)) return;
        const img = frame.querySelector("img");
        const tl = gsap.timeline({ scrollTrigger: once(frame, "top 90%") });
        tl.fromTo(
          frame,
          { clipPath: "inset(14% 10% 14% 10% round 18px)", opacity: 0.2 },
          { clipPath: "inset(0% 0% 0% 0% round 0px)", opacity: 1, duration: 1.1, ease: "expo.out", clearProps: "clipPath,opacity" }
        );
        if (img) tl.from(img, { scale: 1.12, duration: 1.3, ease: "expo.out", clearProps: "transform" }, 0);
      });

      // Architecture: the diagram assembles in reading order as it scrolls through.
      gsap.utils.toArray(".arch-flow").forEach((flow) => {
        const parts = flow.querySelectorAll(".arch-node, .arch-arrow");
        if (!parts.length) return;
        gsap.fromTo(
          parts,
          { opacity: 0.1, y: 14, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.25,
            ease: "power2.out",
            scrollTrigger: { trigger: flow, start: "top 80%", end: "bottom 55%", scrub: 0.5 },
          }
        );
      });

      // Other blocks (API table, AI notes, summaries) keep a simple rise.
      gsap.utils.toArray("[data-reveal]").forEach((el) => {
        if (!below(el)) return;
        gsap.from(el, {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: once(el, "top 90%"),
        });
      });

      // Next project: the image moves at its own pace inside its frame.
      const nextImg = document.querySelector(".cs-next-media img");
      if (nextImg) {
        gsap.fromTo(
          nextImg,
          { yPercent: -8, scale: 1.15 },
          {
            yPercent: 8,
            scale: 1.15,
            ease: "none",
            scrollTrigger: { trigger: ".cs-next", start: "top bottom", end: "bottom top", scrub: true },
          }
        );
      }
    });

    // Images and fonts change heights after load; keep trigger positions right.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      mm.revert();
      ctx.revert();
    };
  }, []);

  return null;
}
