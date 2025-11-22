"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

import { HDImage } from "@/components/HDImage";
import { cn } from "@/lib/utils";
import type { GameScreenshot } from "@/lib/gameData";

interface ScreenshotModalProps {
  isOpen: boolean;
  images: GameScreenshot[];
  startIndex?: number;
  onClose: () => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function ScreenshotModal({ isOpen, images, startIndex = 0, onClose }: ScreenshotModalProps) {
  const [current, setCurrent] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const initialPinch = useRef<{ distance: number; scale: number } | null>(null);

  const next = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setCurrent((value) => (value + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setCurrent((value) => (value - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (isOpen) {
      setCurrent(clamp(startIndex, 0, images.length - 1));
      setScale(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [isOpen, startIndex, images.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") prev();
    };

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, next, onClose, prev]);

  const currentImage = useMemo(() => images[current], [images, current]);

  if (!isOpen || !images.length) return null;

  const startDrag = (clientX: number, clientY: number) => {
    dragging.current = true;
    lastPosition.current = { x: clientX, y: clientY };
  };

  const updateDrag = (clientX: number, clientY: number) => {
    if (!dragging.current || scale <= 1) return;
    const dx = clientX - lastPosition.current.x;
    const dy = clientY - lastPosition.current.y;
    lastPosition.current = { x: clientX, y: clientY };
    setOffset((prevOffset) => ({ x: prevOffset.x + dx, y: prevOffset.y + dy }));
  };

  const endDrag = () => {
    dragging.current = false;
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    setScale((value) => clamp(value + delta, 1, 4));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const { pointerId, clientX, clientY } = event;
    event.currentTarget.setPointerCapture(pointerId);
    pointers.current.set(pointerId, { x: clientX, y: clientY });
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      initialPinch.current = { distance, scale };
    } else {
      startDrag(clientX, clientY);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const { pointerId, clientX, clientY } = event;
    if (!pointers.current.has(pointerId)) return;
    pointers.current.set(pointerId, { x: clientX, y: clientY });

    if (pointers.current.size === 2 && initialPinch.current) {
      const [a, b] = Array.from(pointers.current.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const ratio = distance / initialPinch.current.distance;
      const nextScale = clamp(initialPinch.current.scale * ratio, 1, 4);
      setScale(nextScale);
    } else if (pointers.current.size === 1) {
      updateDrag(clientX, clientY);
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const { pointerId } = event;
    pointers.current.delete(pointerId);
    if (pointers.current.size < 2) {
      initialPinch.current = null;
    }
    if (pointers.current.size === 0) {
      endDrag();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative flex h-full max-h-[90vh] w-full max-w-6xl items-center justify-center px-6 py-10"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white shadow-lg transition hover:bg-white/20"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <button
          className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white shadow-lg transition hover:bg-white/20"
          onClick={prev}
          aria-label="Previous screenshot"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white shadow-lg transition hover:bg-white/20"
          onClick={next}
          aria-label="Next screenshot"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute bottom-6 right-6 flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-white shadow-lg">
          <button
            className="rounded-full bg-white/10 p-2 hover:bg-white/20"
            onClick={() => setScale((value) => clamp(value - 0.2, 1, 4))}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            className="rounded-full bg-white/10 p-2 hover:bg-white/20"
            onClick={() => setScale((value) => clamp(value + 0.2, 1, 4))}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        <div
          className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-900/80 shadow-2xl"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div
            className={cn(
              "flex h-full w-full items-center justify-center transition-transform duration-200",
            )}
            style={{
              transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
              touchAction: "none",
            }}
          >
            {currentImage ? (
              <HDImage
                imageId={currentImage.image_id ?? null}
                alt={`Screenshot ${current + 1}`}
                className="max-h-full max-w-full"
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
