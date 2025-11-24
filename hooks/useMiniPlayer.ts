"use client";

import { useEffect, useRef, useState } from "react";

export function useMiniPlayer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMini, setIsMini] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsMini(false);
          setDismissed(false);
          return;
        }
        if (!dismissed) {
          setIsMini(true);
        }
      },
      { threshold: 0.6 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [dismissed]);

  const closeMini = () => {
    setDismissed(true);
    setIsMini(false);
  };

  return { containerRef, isMini, closeMini } as const;
}
