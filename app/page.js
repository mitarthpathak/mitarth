"use client";

import { useEffect, useRef, useState } from "react";
import CursorFollower from "./components/CursorFollower";
import HeroText from "./components/HeroName";
import DotCanvas from "./components/DotCanvas";
import ProjectImageCursor from "./components/ProjectImageCursor";
import SplitText from "./components/SplitText";
import VariableProximity from "./components/VariableProximity";
import TiltedCard from "./components/TiltedCard";

const projects = [
  {
    year: "April 2026",
    title: "Swasthya-Neeti",
    type: "AI Chatbot for Rural Healthcare Guidance",
    mark: "S",
    variant: "solid",
    image: "/swasthya-neeti.png",
    link: "https://swasthya-neeti.vercel.app/",
  },
  {
    year: "May 2026",
    title: "Run-Neeti",
    type: "AI powered graph Synthesis",
    mark: "*",
    variant: "serif",
    image: "/run-neeti.png",
    link: "https://run-neeti.vercel.app/",
  },
];

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
      <div id="sig-page-content">
        {/* Vertical guide lines */}
        <div className="guide-line guide-line-left" />
        <div className="guide-line guide-line-right" />

        <main style={{ position: "relative" }}>
          {/* ===== HERO SECTION ===== */}
          <section className="hero-section">
            {/* Grid background */}
            <div className="hero-grid" />

            {/* Top block (MITARTH) floating above */}
            <div className="hero-name-container" style={{ paddingBottom: '2vh' }}>
              <HeroText text="MITARTH" globalDelay={0} />
            </div>

            <div className="hero-title-group">
              {/* Side lines + subtitles */}
              <div className="hero-side-lines hero-side-lines-left">
                <div className="hero-line-bar" />
                <SplitText
                  text="Visual Designer"
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
                  startDelay={5500}
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
                  startDelay={5500}
                />
                <div className="hero-line-bar" />
              </div>
            </div>
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
                <img
                  src="/portrait.png"
                  alt="Mitarth The Great"
                  className="portrait-img"
                />
              </div>
            </div>

          </section>

          <section id="projects-section" className="projects-section" aria-labelledby="projects-title">
            <div className="projects-intro">
              <SplitText
                text="CREATED PROJECTS"
                tag="h1"
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
                text="The following are my projects which are deployed"
                tag="p"
                delay={22}
                duration={0.75}
                ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 20 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.15}
                rootMargin="-40px"
                textAlign="center"
              />
            </div>

            <div className="projects-grid">
              {projects.map((project, index) => (
                <article
                  className="project-card"
                  key={`${project.year}-${project.title}`}
                  onMouseEnter={() => {
                    setHoveredProject(index);
                    document.body.style.cursor = 'none';
                  }}
                  onMouseLeave={() => {
                    setHoveredProject(null);
                    document.body.style.cursor = 'default';
                  }}
                  onClick={() => {
                    if (project.link) window.open(project.link, "_blank", "noopener,noreferrer");
                  }}
                  style={{ cursor: project.link ? "none" : "default" }}
                >
                  <div className="project-bg">
                    <div className="project-bg-vignette" />
                    <img src={project.image} alt={project.title} />
                  </div>

                  <p className="project-year">{project.year}</p>

                  <div className="project-identity">
                    <span className={`project-mark project-mark-${project.variant}`}>
                      {project.mark}
                    </span>
                    <h2>{project.title}</h2>
                  </div>


                  <p className="project-type">{project.type}</p>
                </article>
              ))}
            </div>
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
            </div>

            {/* Pixel art image placeholder — will be added later */}
            {/* <div className="footer-pixel-art"><img src="/pixel-me.png" alt="Pixel art of Mitarth" /></div> */}

            {/* Bottom bar */}
            <div className="footer-bottom-bar">
              {/* Left — CTA */}
              <div className="footer-cta">
                <p className="footer-cta-sub">Let&apos;s build something</p>
                <p className="footer-cta-main">MEANINGFUL<br />AND MEMORABLE</p>
              </div>

              {/* Right — Reach out + social icons */}
              <div className="footer-social">
                <p className="footer-social-label">Reach out</p>
                <div className={`footer-social-icons ${isMailHovered ? "is-mail-active" : ""}`}>
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
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
