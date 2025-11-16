"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface CoverImageProps {
  gameName: string;
  rawgImage?: string | null;
  initialImage?: string | null;
  className?: string;
}

type CoverState = string | null | "loading";

export function CoverImage({ gameName, rawgImage, initialImage, className }: CoverImageProps) {
  const [coverUrl, setCoverUrl] = useState<CoverState>(initialImage ?? "loading");

  useEffect(() => {
    let isMounted = true;

    if (initialImage) {
      setCoverUrl(initialImage);
      return () => {
        isMounted = false;
      };
    }

    const trimmedName = gameName?.trim();
    if (!trimmedName && !rawgImage) {
      setCoverUrl(null);
      return () => {
        isMounted = false;
      };
    }

    setCoverUrl("loading");

    async function fetchCover() {
      try {
        const response = await fetch("/api/igdb/cover", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: gameName, fallbackImage: rawgImage ?? null }),
        });

        if (!response.ok) {
          throw new Error(`Cover lookup failed (${response.status})`);
        }

        const data = (await response.json()) as {
          coverUrl: string | null;
          fallbackImage?: string | null;
        };

        const resolvedCover = data.coverUrl ?? data.fallbackImage ?? null;
        if (isMounted) {
          setCoverUrl(resolvedCover);
        }
      } catch (error) {
        console.error("CoverImage fetch error", error);
        if (isMounted) {
          setCoverUrl(rawgImage ?? null);
        }
      }
    }

    fetchCover();

    return () => {
      isMounted = false;
    };
  }, [gameName, rawgImage, initialImage]);

  const initials = useMemo(() => {
    const trimmed = gameName?.trim();
    if (!trimmed) return "??";
    const parts = trimmed.split(/\s+/).slice(0, 2);
    const letters = parts.map((part) => part[0]?.toUpperCase()).filter(Boolean).join("");
    return letters || trimmed.slice(0, 2).toUpperCase();
  }, [gameName]);

  const containerClass = cn(
    "relative block h-full w-full overflow-hidden bg-slate-200 dark:bg-slate-800",
    className,
  );

  if (coverUrl === "loading") {
    return <div className={cn(containerClass, "animate-pulse bg-slate-200/60 dark:bg-slate-800/60")} />;
  }

  if (!coverUrl) {
    return (
      <div className={containerClass}>
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 via-slate-900 to-black text-3xl font-bold uppercase text-white/80">
          {initials}
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <Image
        src={coverUrl}
        alt={gameName}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 33vw"
        priority={false}
      />
    </div>
  );
}
