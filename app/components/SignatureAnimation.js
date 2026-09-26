"use client";

/*
 * SignatureAnimation -- the Mitarth Pathak signature mark at the top of the
 * home page, plus its intro.
 *
 * The inline script in the root layout sets <html data-intro> before first
 * paint. With "play" (first home visit of the session, motion allowed) the
 * signature draws itself large over the already-visible hero, then settles
 * into the header mark — about 1.2 s in total. It can be skipped with the
 * Skip button, Esc, or a click anywhere (see the script in app/layout.js).
 * With "skip" or "done" the mark is simply drawn in place. Page content is
 * never hidden.
 */

import { finishIntro } from "../hooks/finishIntro";
import "../styles/animation.css";

/* SVG path data shared by the animated intro and the static mark */
export const SIGNATURE_PATHS = {
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

/* Signature SVG. `strokeWidth` can be raised for the small mark so it stays legible. */
export function SignatureSVG({ className, strokeWidth = SVG_PROPS.strokeWidth }) {
  return (
    <svg
      viewBox="0 0 1055 940"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path className="sig-stroke sig-stroke-m" d={SIGNATURE_PATHS.m} {...SVG_PROPS} strokeWidth={strokeWidth} />
      <path className="sig-stroke sig-stroke-p" d={SIGNATURE_PATHS.p} {...SVG_PROPS} strokeWidth={strokeWidth} />
      <path className="sig-stroke sig-stroke-athak" d={SIGNATURE_PATHS.athak} {...SVG_PROPS} strokeWidth={strokeWidth} />
      <path className="sig-stroke sig-stroke-underline" d={SIGNATURE_PATHS.underline} {...SVG_PROPS} strokeWidth={strokeWidth} />
    </svg>
  );
}

export default function SignatureAnimation() {
  // The intro's whole lifecycle (timer, Esc, click, Skip) lives in the inline
  // script in app/layout.js so it works before hydration; this component only
  // renders the mark and the Skip button.
  return (
    <div id="sig-overlay">
      <div id="sig-svg-wrap">
        <SignatureSVG />
      </div>
      {/* Always rendered; CSS only shows it while html[data-intro="play"],
          so it is there from the very first paint. */}
      <button type="button" className="sig-skip" onClick={finishIntro}>
        Skip intro
      </button>
    </div>
  );
}
