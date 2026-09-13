"use client";

import { useEffect, useRef } from "react";

/**
 * Poll fn every intervalMs. Pauses when the tab is hidden and backs off
 * (up to 5 min) after consecutive 5xx/network failures.
 */
export function usePolling(fn, intervalMs = 60000) {
  const fnRef = useRef(fn);
  const failures = useRef(0);

  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    let timer;
    let stopped = false;

    const tick = async () => {
      if (stopped) return;
      if (!document.hidden) {
        try {
          await fnRef.current();
          failures.current = 0;
        } catch {
          failures.current += 1;
        }
      }
      const delay = failures.current
        ? Math.min(intervalMs * 2 ** failures.current, 300000)
        : intervalMs;
      timer = setTimeout(tick, delay);
    };

    timer = setTimeout(tick, intervalMs);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [intervalMs]);
}
