"use client";

/*
 * SignatureAnimation -- Mitarth Pathak signature intro sequence.
 *
 * Phase 1 (0-5000ms):  SVG paths draw themselves stroke-by-stroke (CSS animation).
 * Phase 2 (5000-6000ms): Overlay fades out, page content fades in, header logo appears.
 * Phase 3 (6000ms+):   Overlay removed from DOM; header logo stays fixed.
 *
 * Stroke dashoffset values are measured via JS after mount so the CSS
 * animation always uses the *exact* path length (no guessing).
 */

import { useEffect, useRef } from "react";
import "../styles/animation.css";

/* SVG path data shared between animation overlay and header logo */
const PATHS = {
  m:         "M244 389 C253 354 267 316 283 276 C299 235 316 189 332 153 C337 142 349 143 352 155 C359 186 347 248 339 286 C335 304 336 313 343 311 C361 307 383 254 408 213 C429 178 448 146 459 141 C472 136 474 151 470 184 C465 226 454 289 449 321 C447 334 449 341 456 337 C489 319 540 288 591 271 C626 259 651 253 660 260 C671 269 668 289 654 315 C640 341 614 371 587 401",
  p:         "M588 401 C520 483 438 562 349 629 C265 692 176 736 108 775 C137 726 204 677 274 627 C365 562 461 478 539 389 C599 320 647 260 660 260 M338 532 C326 572 311 624 297 676 C288 709 279 742 271 759",
  athak:     "M394 647 C402 629 416 613 428 615 C441 617 438 638 426 658 C414 677 395 686 388 674 C381 661 395 646 418 636 C442 625 470 617 495 606 M499 555 C491 588 486 635 489 662 C491 681 501 686 515 670 C530 653 541 625 552 598 M466 633 C496 627 525 619 555 607 M565 561 C556 601 551 644 556 662 C562 680 583 641 603 612 C615 594 626 583 634 586 C645 591 633 629 628 651 C625 666 631 673 643 668 C660 661 678 635 691 614 M701 609 C717 610 723 626 717 645 C710 668 687 682 672 672 C657 661 670 634 695 619 C715 608 734 615 746 637 C757 657 776 675 802 661 M754 533 C744 581 739 628 745 661 C766 631 796 588 819 546 M750 610 C775 620 803 616 829 602",
  underline: "M421 715 C475 704 548 697 625 687 C690 678 747 668 785 656 M884 714 C889 711 895 712 896 717 C891 720 886 719 884 714",
};

const SVG_PROPS = {
  stroke: "#FF9500",
  strokeWidth: "3.5",
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

/* Signature SVG -- animated version (used in overlay) */
function SignatureSVG({ svgRef, animated }) {
  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1055 940"
      xmlns="http://www.w3.org/2000/svg"
      role="presentation"
      aria-hidden="true"
      style={{ width: "100%", height: "100%", overflow: "visible" }}
    >
      <path id={animated ? "stroke-m" : "logo-m"}         d={PATHS.m}         {...SVG_PROPS} />
      <path id={animated ? "stroke-p" : "logo-p"}         d={PATHS.p}         {...SVG_PROPS} />
      <path id={animated ? "stroke-athak" : "logo-athak"} d={PATHS.athak}     {...SVG_PROPS} />
      <path id={animated ? "stroke-underline" : "logo-ul"} d={PATHS.underline} {...SVG_PROPS} />
    </svg>
  );
}

/* Main component */
export default function SignatureAnimation() {
  const overlayRef = useRef(null);

  useEffect(() => {
    /* 1. Measure each path and inject --path-len CSS variable */
    const ids = ["stroke-m", "stroke-p", "stroke-athak", "stroke-underline"];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      try {
        const len = Math.ceil(el.getTotalLength());
        el.style.setProperty("--path-len", len);
        el.style.strokeDasharray  = len;
        el.style.strokeDashoffset = len;
      } catch (_) {
        /* leave CSS default (9999) so path remains hidden until animation runs */
      }
    });

    /* 2. Fallback: force-show content if something goes wrong */
    const fallback = setTimeout(() => {
      const page = document.getElementById("sig-page-content");
      if (page) { page.style.opacity = "1"; page.style.animation = "none"; }
    }, 6500);

    return () => {
      clearTimeout(fallback);
    };
  }, []);

  return (
    <>
      {/* OVERLAY: Phase 1 + 2 */}
      <div
        id="sig-overlay"
        ref={overlayRef}
        aria-label="Signature animation loading"
        aria-live="polite"
      >
        <div id="sig-svg-wrap">
          <SignatureSVG animated={true} />
        </div>
      </div>
    </>
  );
}