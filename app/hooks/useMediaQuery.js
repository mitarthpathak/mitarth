"use client";

import { useSyncExternalStore } from "react";

// Subscribes to a media query. The server snapshot is `false`, so markup
// rendered on the server always takes the "query does not match" path and
// the client corrects itself right after hydration.
export default function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

export const FINE_POINTER = "(pointer: fine) and (hover: hover)";
export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
