"use client";

import { ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import useMediaQuery, { FINE_POINTER } from "../hooks/useMediaQuery";

// One card on the home page. The title is the real link to the case study;
// its ::after stretches over the whole card so the card is clickable, while
// the small Live / Code links sit above that layer (anchors never nest).
// The image shares a view-transition name with the case-study hero, which is
// what makes the card morph into the page.
export default function ProjectCard({ project, onHoverChange }) {
  const hasFinePointer = useMediaQuery(FINE_POINTER);
  const { slug, title, date, mark, variant, oneLiner, stack, links, images } = project;
  const href = `/work/${slug}`;
  const codeHref = links.code[0]?.href;

  const hoverProps = hasFinePointer
    ? {
        onMouseEnter: () => onHoverChange(true),
        onMouseLeave: () => onHoverChange(false),
      }
    : {};

  return (
    <article className="project-card" {...hoverProps}>
      <div className="project-bg" aria-hidden="true">
        <ViewTransition name={`work-media-${slug}`} share="work-morph">
          <Image
            src={images.hero.src}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="project-bg-image"
          />
        </ViewTransition>
        <div className="project-bg-vignette" />
      </div>

      <p className="project-year">{date}</p>

      <div className="project-identity">
        <span className={`project-mark project-mark-${variant}`} aria-hidden="true">
          {mark}
        </span>
        <h3 className="project-title">
          <Link href={href} className="project-link">
            {title}
          </Link>
        </h3>
      </div>

      <div className="project-foot">
        <p className="project-summary">{oneLiner}</p>
        <ul className="project-chips" aria-label={`${title} stack`}>
          {stack.slice(0, 4).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="project-actions">
          {links.live && (
            <a href={links.live} target="_blank" rel="noopener noreferrer" className="project-action">
              Live <span aria-hidden="true">↗</span>
              <span className="sr-only"> — {title} (opens in a new tab)</span>
            </a>
          )}
          {codeHref && (
            <a href={codeHref} target="_blank" rel="noopener noreferrer" className="project-action">
              Code <span aria-hidden="true">↗</span>
              <span className="sr-only"> — {title} on GitHub (opens in a new tab)</span>
            </a>
          )}
        </p>
      </div>
    </article>
  );
}
