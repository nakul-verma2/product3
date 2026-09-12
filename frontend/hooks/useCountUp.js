"use client";

import { useEffect, useState } from "react";

/** Count-up over 600ms easeOut; skips animation for reduced-motion users. */
export function useCountUp(target, duration = 600) {
  const end = Number(target) || 0;
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let raf;
    const start = performance.now();
    // setValue only fires inside the rAF callback, not the effect body.
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(end * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, reduced]);

  return reduced ? end : value;
}
