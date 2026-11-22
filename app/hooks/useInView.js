"use client";

import { useEffect, useState } from "react";

// True while `ref`'s element is on screen (grown by `rootMargin`). Used to
// pause frame loops, WebGL scenes and mouse tracking that would otherwise
// keep burning frames for something nobody can see.
export default function useInView(ref, { rootMargin = "0px", initial = false } = {}) {
  const [inView, setInView] = useState(initial);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);

  return inView;
}
