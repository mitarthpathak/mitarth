"use client";

/*
 * SignatureAnimation -- the Mitarth Pathak signature mark at the top of the
 * home page, plus its intro.
 *
 * The inline script in the root layout sets <html data-intro> before first
 * paint. With "play" (a full load of the home page, motion allowed) the
 * original intro runs: the signature draws itself stroke by stroke in the
 * middle of the screen (m, P, athak, underline), then at 4.7 s shrinks into
 * the header mark while the page fades in — about 6 s in total. The Skip
 * button or Esc end it early (see the script in app/layout.js). With "skip"
 * or "done" the mark is simply drawn in place and the page is visible.
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
