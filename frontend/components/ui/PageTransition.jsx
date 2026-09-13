"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Route-change transition only: 180ms fade + 4px rise. No bouncy dives. */
export function PageTransition({ children }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
