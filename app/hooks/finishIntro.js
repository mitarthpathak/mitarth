"use client";

// Ends the signature intro early. The inline script in app/layout.js sets
// <html data-intro> to "play" | "skip" | "done" and already listens for Esc,
// the Skip button and its 6 s timer; this is the same action for React handlers.
export function finishIntro() {
  if (document.documentElement.dataset.intro === "play") {
    document.documentElement.dataset.intro = "done";
  }
}
