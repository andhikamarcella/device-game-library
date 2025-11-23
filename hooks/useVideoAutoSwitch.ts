"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

export function useVideoAutoSwitch(
  videoRef: RefObject<HTMLVideoElement>,
  onAdvance: () => void,
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      onAdvance();
      video.play().catch(() => {});
    };

    video.addEventListener("ended", handleEnded);
    return () => video.removeEventListener("ended", handleEnded);
  }, [videoRef, onAdvance]);
}
