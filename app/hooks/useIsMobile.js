"use client";

import { useEffect, useState } from "react";

const QUERY = "(max-width: 768px)";

// Matches the site's one CSS breakpoint (768px) so JS-driven decisions (which
// desktop-only effects to skip, how to lay out the tech-stack pane) agree
// with what the stylesheet is already doing. Starts `false` so the very
// first server-rendered markup matches the desktop path exactly, then
// corrects itself on mount — never flips a desktop viewport to the mobile
// branch.
export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isMobile;
}
