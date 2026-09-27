"use client";

import { useSyncExternalStore } from "react";

// True once the signature intro is over (or never played): <html data-intro>
// is anything but "play". Set before first paint by the script in
// app/layout.js and flipped to "done" by its timer, Esc or the Skip button.
function subscribe(onChange) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-intro"] });
  return () => mo.disconnect();
}

export default function useIntroDone() {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.intro !== "play",
    () => false
  );
}
