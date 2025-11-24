"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useSwipeNavigation(
  targetRef: RefObject<HTMLElement>,
  { onSwipeLeft, onSwipeRight, threshold = 40 }: SwipeOptions,
) {
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    let startX = 0;
    let startY = 0;

    const handleStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
    };

    const handleEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);

      if (deltaY > 80) return;

      if (deltaX > threshold && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < -threshold && onSwipeLeft) {
        onSwipeLeft();
      }
    };

    target.addEventListener("touchstart", handleStart);
    target.addEventListener("touchend", handleEnd);

    return () => {
      target.removeEventListener("touchstart", handleStart);
      target.removeEventListener("touchend", handleEnd);
    };
  }, [onSwipeLeft, onSwipeRight, targetRef, threshold]);
}
