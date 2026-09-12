"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Generic fetch-state hook: { data, loading, error, retry, execute }. */
export function useApi(fn, { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  });

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current(...args);
      setData(result);
      return result;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!immediate) return;
    let cancelled = false;
    // State updates live in promise callbacks (external-system updates), not the effect body.
    Promise.resolve()
      .then(() => fnRef.current())
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [immediate]);

  const retry = useCallback(() => execute().catch(() => {}), [execute]);

  return { data, loading, error, retry, execute, setData };
}
