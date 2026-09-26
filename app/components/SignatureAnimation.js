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
import SignatureSVG from "./SignatureSVG";
import "../styles/animation.css";

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
