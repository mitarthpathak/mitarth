"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import SignatureAnimation from "./components/SignatureAnimation";
import ProjectCard from "./components/ProjectCard";
import { projects } from "../content/projects";
import CursorFollower from "./components/CursorFollower";
import HeroText from "./components/HeroName";
import DotCanvas from "./components/DotCanvas";
import ProjectImageCursor from "./components/ProjectImageCursor";
import SplitText from "./components/SplitText";
import VariableProximity from "./components/VariableProximity";
import TiltedCard from "./components/TiltedCard";
import TechStack from "./components/TechStack";
import ParticleImageReveal from "./components/ParticleImageReveal";
import ScrollReveal from "./components/ScrollReveal";
import LazyTerminal from "./components/terminal/LazyTerminal";
import Link from "next/link";

const emailId = "mpathak6207@gmail.com";

export default function Home() {
  const yellowRef = useRef(null);
  const yellowPillsRef = useRef([]);
  const revealContainerRef = useRef(null);
  const revealColsRef = useRef([]);
  const footerRevealContainerRef = useRef(null);
  const footerRevealColsRef = useRef([]);
  const footerSectionRef = useRef(null);
  const footerNameContainerRef = useRef(null);
  const [hoveredProject, setHoveredProject] = useState(null);
  const [isMailHovered, setIsMailHovered] = useState(false);
  const [mailCopied, setMailCopied] = useState(false);

  const copyEmailId = async () => {
    try {
      await navigator.clipboard.writeText(emailId);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = emailId;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setMailCopied(true);
    window.setTimeout(() => setMailCopied(false), 1200);
  };

  // The fixed guide lines would run straight through the card titles and the
  // terminal, so they step aside while either section is on screen.
  useEffect(() => {
    const targets = ["work", "terminal"].map((id) => document.getElementById(id)).filter(Boolean);
    if (!targets.length) return;
    const onScreen = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target)));
      document.documentElement.classList.toggle("guides-off", onScreen.size > 0);
    });
    targets.forEach((t) => io.observe(t));
    return () => {
      io.disconnect();
      document.documentElement.classList.remove("guides-off");
    };
  }, []);

  useEffect(() => {
    let animationFrameId;
    let targetScrollY = window.scrollY;
    let currentScrollY = window.scrollY;

    const lerp = (start, end, factor) => start + (end - start) * factor;

    const handleScroll = () => {
      targetScrollY = window.scrollY;
    };

    const updateAnimations = () => {
      // Smooth interpolation for that flow state feel
      currentScrollY = lerp(currentScrollY, targetScrollY, 0.07);
      const scrollDiff = targetScrollY - currentScrollY;

      const viewH = window.innerHeight;

      // --- Footer reveal columns (symmetric stair-step from top) ---
      if (footerRevealColsRef.current.length > 0 && footerRevealContainerRef.current) {
        const colRect = footerRevealContainerRef.current.getBoundingClientRect();
        const lerpedTop = colRect.top + scrollDiff;
        // rawProgress: 0 when columns just enter viewport bottom, 1 when columns top hits ~15% from top
        const rawProgress = Math.min(1, Math.max(0, (viewH - lerpedTop) / (viewH * 0.85)));

        footerRevealColsRef.current.forEach((col, i) => {
          if (col) {
            const dist = Math.abs(i - 2);
            const delay = dist * 0.28;
            let colProgress = Math.min(1, Math.max(0, (rawProgress - delay) / (1 - delay || 0.001)));
            if (dist === 0) colProgress = Math.min(1, colProgress * 1.35);
            col.style.transform = `scaleY(${1 - colProgress})`;
          }
        });
      }

      // --- Reveal columns (symmetric stair-step) ---
      if (revealColsRef.current.length > 0 && revealContainerRef.current) {
        const scrollProgress = Math.min(
          1,
          Math.max(0, currentScrollY / (viewH * 0.9 || 1))
        );

        revealColsRef.current.forEach((col, i) => {
          if (col) {
            const dist = Math.abs(i - 2);
            const delay = dist * 0.3;
            let colProgress = Math.min(
              1,
              Math.max(0, (scrollProgress - delay) / (1 - delay))
            );
            if (dist === 0) {
              colProgress = Math.min(1, colProgress * 1.35);
            }
            col.style.transform = `scaleY(${1 - colProgress})`;
          }
        });
      }

      if (yellowRef.current) {
        const rect = yellowRef.current.getBoundingClientRect();
        const lerpedTop = rect.top + scrollDiff;
        const lerpedBottom = rect.bottom + scrollDiff;

        const yellowProgress = Math.min(
          1,
          Math.max(0, (viewH - lerpedTop) / (viewH * 0.95))
        );
        const brushProgress = Math.min(1, Math.max(0, yellowProgress));

        yellowRef.current.style.setProperty("--brush-progress", brushProgress.toFixed(3));
        yellowRef.current.style.setProperty(
          "--brush-dash",
          `${1320 - brushProgress * 1320}`
        );
        yellowRef.current.style.setProperty(
          "--brush-entry-x",
          `${-120 + brushProgress * 120}px`
        );
        yellowRef.current.style.setProperty("--brush-opacity", brushProgress.toFixed(3));

        const wipeProgress = Math.min(
          1,
          Math.max(0, (viewH - lerpedBottom + viewH * 0.75) / (viewH * 1.05))
        );
        yellowRef.current.style.setProperty("--wipe-progress", wipeProgress.toFixed(3));

        yellowPillsRef.current.forEach((pill, i) => {
          if (!pill) return;

          const directions = [-1, 0, 1];
          const sidePush = directions[i] * yellowProgress * 22;
          const lift = (1 - yellowProgress) * 42;
          const scale = 0.92 + yellowProgress * 0.08;

          pill.style.setProperty("--scroll-x", `${sidePush}px`);
          pill.style.setProperty("--scroll-y", `${lift}px`);
          pill.style.setProperty("--scroll-scale", scale.toFixed(3));
          const pillOpacity = Math.max(0, Math.min(yellowProgress, 1 - wipeProgress * 2));
          pill.style.setProperty("--scroll-opacity", pillOpacity.toFixed(3));
        });
      }

      animationFrameId = requestAnimationFrame(updateAnimations);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    animationFrameId = requestAnimationFrame(updateAnimations); // start initial check and loop

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <CursorFollower
        isHoveringProject={hoveredProject !== null}
        isHoveringMail={isMailHovered}
        mailCursorText={mailCopied ? "Copied" : "Copy ID"}
      />
      <ProjectImageCursor isActive={hoveredProject !== null} />
      <SignatureAnimation />
      <div id="sig-page-content">
        {/* Vertical guide lines */}
        <div className="guide-line guide-line-left" />
        <div className="guide-line guide-line-right" />

        <main id="main" style={{ position: "relative" }}>
          {/* ===== HERO SECTION ===== */}
          <section className="hero-section" aria-labelledby="hero-title">
            {/* The one h1 on the page; the big letters below are the visual version */}
            <h1 id="hero-title" className="sr-only">
              Mitarth Pathak — AI &amp; Full-Stack Developer
            </h1>
            <p className="sr-only">Based in Jaipur, Rajasthan.</p>

            {/* Grid background */}
            <div className="hero-grid" />

            {/* Top block (MITARTH) floating above */}
            <div className="hero-name-container" style={{ paddingBottom: '2vh' }} aria-hidden="true">
              <HeroText text="MITARTH" globalDelay={0} />
            </div>

            <div className="hero-title-group" aria-hidden="true">
              {/* Side lines + subtitles */}
              <div className="hero-side-lines hero-side-lines-left">
                <div className="hero-line-bar" />
                <SplitText
                  text="AI & Full-Stack Developer"
                  tag="span"
                  className="hero-subtitle"
                  delay={35}
                  duration={0.7}
                  ease="power3.out"
                  splitType="chars"
                  from={{ opacity: 0, y: 18 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0.1}
                  rootMargin="0px"
                  textAlign="left"
                />
              </div>

              {/* Bottom block (THE GREAT) nested between lines */}
              <div className="hero-name-container" style={{ padding: '0 3vw' }}>
                <HeroText text="THE GREAT" size="small" globalDelay={1000} />
              </div>

              {/* Right side */}
              <div className="hero-side-lines hero-side-lines-right">
                <SplitText
                  text="Based in Jaipur, Rajasthan"
                  tag="span"
                  className="hero-subtitle"
                  delay={28}
                  duration={0.7}
                  ease="power3.out"
                  splitType="chars"
                  from={{ opacity: 0, y: 18 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0.1}
                  rootMargin="0px"
                  textAlign="right"
                />
                <div className="hero-line-bar" />
              </div>
            </div>

            {/* Phones: the side lines are hidden, so the role gets its own line */}
            <p className="hero-mobile-role" aria-hidden="true">
              AI &amp; Full-Stack Developer <span>·</span> Jaipur
            </p>
          </section>

          {/* ===== REVEAL COLUMNS (Staircase transition) ===== */}
          <div className="reveal-columns" ref={revealContainerRef}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="reveal-col"
                ref={(el) => {
                  revealColsRef.current[i] = el;
                }}
              />
            ))}
          </div>

          {/* ===== YELLOW SECTION ===== */}
          <section ref={yellowRef} className="yellow-section">
            <div className="yellow-sticky-scene">

              {/* Dot trail canvas */}
              <DotCanvas />

              {/* Brush Stroke SVG */}
              <div className="brush-stroke">
                <svg viewBox="0 -100 1000 400" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <path
                    className="brush-stroke-path brush-stroke-shadow"
                    d="M-100,100 Q150,220 350,50 T700,150 T1100,50"
                    fill="none"
                    stroke="white"
                    strokeWidth="74"
                    strokeLinecap="round"
                  />
                  <path
                    className="brush-stroke-path brush-stroke-main"
                    d="M-100,100 Q150,220 350,50 T700,150 T1100,50"
                    fill="none"
                    stroke="white"
                    strokeWidth="60"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Yellow Section Pills */}
              <div
                className="yellow-pill pill-left"
                ref={(el) => {
                  yellowPillsRef.current[0] = el;
                }}
              >
                AI Developer
              </div>
              <div
                className="yellow-pill pill-center"
                ref={(el) => {
                  yellowPillsRef.current[1] = el;
                }}
              >
                Web Designer
              </div>
              <div
                className="yellow-pill pill-right"
                ref={(el) => {
                  yellowPillsRef.current[2] = el;
                }}
              >
                AI Learner
              </div>

              {/* Portrait */}
              <div className="portrait-container">
                <Image
                  src="/portrait.png"
                  alt="Portrait of Mitarth Pathak"
                  width={1240}
                  height={2098}
                  sizes="(max-width: 768px) 80vw, 45vh"
                  className="portrait-img"
                />
              </div>
            </div>

          </section>

          <TechStack />

          <section id="work" className="projects-section" aria-labelledby="projects-title">
            <div className="projects-intro">
              <SplitText
                id="projects-title"
                text="CREATED PROJECTS"
                tag="h2"
                className=""
                delay={38}
                duration={0.9}
                ease="power4.out"
                splitType="chars"
                from={{ opacity: 0, y: 60, rotationX: -40 }}
                to={{ opacity: 1, y: 0, rotationX: 0 }}
                threshold={0.15}
                rootMargin="-60px"
                textAlign="center"
              />
              <SplitText
                text="Things I built and shipped. Open one for the full case study."
                tag="p"
                delay={22}
                duration={0.75}
                ease="power3.out"
                splitType="words"
                from={{ opacity: 0, y: 20 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.15}
                rootMargin="-40px"
                textAlign="center"
              />
            </div>

            <div className="projects-grid">
              {projects.map((project, index) => (
                <ProjectCard
                  key={project.slug}
                  project={project}
                  onHoverChange={(hovering) => setHoveredProject(hovering ? index : null)}
                />
              ))}
            </div>
          </section>

          {/* ===== TERMINAL: real commands + "ask about my work" ===== */}
          <section id="terminal" className="terminal-section" aria-labelledby="terminal-title">
            <div className="terminal-intro">
              <p className="terminal-label">Try it</p>
              <h2 id="terminal-title">Ask the terminal</h2>
              <p>Type a command, or ask a question about my work. Answers are drawn from this site&apos;s pages and link to their sources.</p>
              <Link href="/lab/ask" className="terminal-how">
                How it works <span aria-hidden="true">→</span>
              </Link>
            </div>
            <LazyTerminal />
          </section>

          {/* ===== FOOTER REVEAL COLUMNS (brick staircase into yellow footer) ===== */}
          <div className="footer-reveal-columns" ref={footerRevealContainerRef}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="footer-reveal-col"
                ref={(el) => {
                  footerRevealColsRef.current[i] = el;
                }}
              />
            ))}
          </div>

          {/* ===== FOOTER YELLOW SECTION ===== */}
          <section ref={footerSectionRef} className="footer-yellow-section">
            {/* Big faded name in background */}
            <div className="footer-name-bg" ref={footerNameContainerRef} aria-hidden="true">
              <VariableProximity
                label="MITARTH"
                className="footer-name-line-1"
                fromFontVariationSettings="'wght' 300, 'opsz' 9"
                toFontVariationSettings="'wght' 900, 'opsz' 144"
                containerRef={footerSectionRef}
                radius={350}
                falloff='linear'
              />
              <VariableProximity
                label="PATHAK"
                className="footer-name-line-2"
                fromFontVariationSettings="'wght' 300, 'opsz' 9"
                toFontVariationSettings="'wght' 900, 'opsz' 144"
                containerRef={footerSectionRef}
                radius={350}
                falloff='linear'
              />
            </div>

            <div className="footer-pixel-art">
              <ParticleImageReveal src="/portrait.png">
                <TiltedCard
                  imageSrc="/portrait.png"
                  altText="Portrait of Mitarth"
                  captionText="Mitarth Pathak"
                  containerHeight="clamp(430px, 62vh, 430px)"
                  containerWidth="fit-content"
                  imageHeight="clamp(430px, 62vh, 430px)"
                  imageWidth="auto"
                  rotateAmplitude={12}
                  scaleOnHover={1.05}
                  showMobileWarning={false}
                  showTooltip={true}
                  displayOverlayContent={false}
                  showImageGlow={true}
                />
              </ParticleImageReveal>
            </div>

            {/* Pixel art image placeholder — will be added later */}
            {/* <div className="footer-pixel-art"><img src="/pixel-me.png" alt="Pixel art of Mitarth" /></div> */}

            {/* Bottom bar */}
            <div className="footer-bottom-bar">
              {/* Left — CTA */}
              <div className="footer-cta">
                <SplitText
                  text="Let's build something"
                  tag="p"
                  className="footer-cta-sub"
                  delay={22}
                  duration={0.7}
                  ease="power3.out"
                  splitType="words"
                  from={{ opacity: 0, y: 14 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0}
                  rootMargin="0px"
                  textAlign="left"
                />
                <SplitText
                  text="MEANINGFUL"
                  tag="p"
                  className="footer-cta-main"
                  delay={26}
                  duration={0.85}
                  ease="power4.out"
                  splitType="chars"
                  from={{ opacity: 0, y: 40, rotationX: -30 }}
                  to={{ opacity: 1, y: 0, rotationX: 0 }}
                  threshold={0}
                  rootMargin="0px"
                  textAlign="left"
                />
                <SplitText
                  text="AND MEMORABLE"
                  tag="p"
                  className="footer-cta-main"
                  delay={26}
                  duration={0.85}
                  ease="power4.out"
                  splitType="chars"
                  from={{ opacity: 0, y: 40, rotationX: -30 }}
                  to={{ opacity: 1, y: 0, rotationX: 0 }}
                  threshold={0}
                  rootMargin="0px"
                  textAlign="left"
                  startDelay={180}
                />
              </div>

              {/* Right — Reach out + social icons */}
              <div className="footer-social">
                <SplitText
                  text="Reach out"
                  tag="p"
                  className="footer-social-label"
                  delay={26}
                  duration={0.75}
                  ease="power3.out"
                  splitType="chars"
                  from={{ opacity: 0, y: 16 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0}
                  rootMargin="0px"
                  textAlign="right"
                />
                <ScrollReveal
                  as="div"
                  className={`footer-social-icons ${isMailHovered ? "is-mail-active" : ""}`}
                  selector=":scope > a, :scope > div"
                  stagger={0.07}
                  duration={0.6}
                  ease="back.out(1.6)"
                  from={{ opacity: 0, y: 18, scale: 0.8 }}
                  to={{ opacity: 1, y: 0, scale: 1 }}
                  threshold={0}
                  rootMargin="0px"
                  clearProps="opacity,transform"
                >
                  {/* Instagram */}
                  <a
                    href="https://www.instagram.com/_mitarth"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-social-icon"
                    aria-label="Instagram"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                    </svg>
                  </a>
                  {/* GitHub */}
                  <a
                    href="https://github.com/mitarthpathak/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-social-icon"
                    aria-label="GitHub"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                    </svg>
                  </a>
                  {/* LinkedIn */}
                  <a
                    href="https://www.linkedin.com/in/mitarth-pathak"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-social-icon"
                    aria-label="LinkedIn"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="3" />
                      <line x1="8" y1="11" x2="8" y2="17" />
                      <line x1="8" y1="7" x2="8" y2="7.5" strokeWidth="2.4" />
                      <path d="M12 11v6M12 11a3 3 0 0 1 6 0v6" />
                    </svg>
                  </a>
                  {/* Twitter / X */}
                  <a
                    href="https://x.com/mpathak6207"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-social-icon"
                    aria-label="Twitter"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                    </svg>
                  </a>
                  {/* Spotify */}
                  <a
                    href="https://open.spotify.com/user/31fufrhc4ywnuuhw3b2nj4f3xdsq?si=4a3c68532c794088"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-social-icon"
                    aria-label="Spotify"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 10c2.5-1 6.5-1 9 1" />
                      <path d="M8.5 13c2-1 5.5-1 7.5 .5" />
                      <path d="M9.5 15.5c1.5-.5 4-.5 5.5 .5" />
                    </svg>
                  </a>
                  <div
                    className={`footer-email-wrap ${isMailHovered ? "is-active" : ""}`}
                    onMouseEnter={() => setIsMailHovered(true)}
                    onMouseLeave={() => {
                      setIsMailHovered(false);
                      setMailCopied(false);
                    }}
                    onFocus={() => setIsMailHovered(true)}
                    onBlur={() => {
                      setIsMailHovered(false);
                      setMailCopied(false);
                    }}
                  >
                    <div className="footer-email-popover" aria-hidden={!isMailHovered}>
                      {emailId}
                    </div>
                    <button
                      type="button"
                      className="footer-social-icon footer-email-button"
                      aria-label="Copy email ID"
                      onClick={copyEmailId}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="3" />
                        <path d="M2 8l10 7 10-7" />
                      </svg>
                    </button>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
