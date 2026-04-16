"use client";

import { useState } from "react";
import { MessageCircle, Star, ThumbsUp } from "lucide-react";

import type { RawgReview } from "@/lib/rawg";
import { cn } from "@/lib/utils";

const formatRawgDate = (value: string | null) => {
  if (!value) return "Date unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date unknown";
  return parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const renderStars = (rating: number | null) => {
  if (rating === null || Number.isNaN(rating)) return null;
  const clamped = Math.max(0, Math.min(5, rating));
  return (
    <div className="flex items-center gap-1 text-amber-500">
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < Math.round(clamped);
        return (
          <Star
            key={index}
            className={cn(
              "h-4 w-4",
              filled ? "fill-amber-400 text-amber-500" : "text-slate-400 dark:text-slate-600",
            )}
            aria-hidden="true"
          />
        );
      })}
      <span className="text-xs font-semibold text-amber-600 dark:text-amber-200">{clamped.toFixed(1)}</span>
    </div>
  );
};

interface RawgReviewCardProps {
  review: RawgReview;
}

export function RawgReviewCard({ review }: RawgReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const text = review.text?.trim() ?? "";
  const username = review.user?.username ?? "RAWG user";
  const avatar = review.user?.avatar ?? null;
  const badge = review.positive === true ? "Recommended" : review.negative === true ? "Not Recommended" : null;
  const likeCount = typeof review.likes_count === "number" ? review.likes_count : 0;
  const commentCount = typeof review.comments_count === "number" ? review.comments_count : 0;

  return (
    <article className="group flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-900/10 transition hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-800/60 ring-1 ring-slate-700/50">
          {avatar ? (
            <img src={avatar} alt={`${username} avatar`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">
              {username.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{username}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{formatRawgDate(review.created)}</p>
        </div>
        {badge ? (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
              badge === "Recommended"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-200"
                : "bg-rose-500/15 text-rose-600 dark:text-rose-200",
            )}
          >
            {badge}
          </span>
        ) : null}
      </div>

      {renderStars(review.rating)}

      <div className="rounded-xl bg-slate-100/60 p-3 dark:bg-slate-800/60">
        <p
          className={cn(
            "text-sm leading-relaxed text-slate-800 dark:text-slate-100",
            expanded ? "line-clamp-none" : "line-clamp-4",
          )}
        >
          {text || "No review text available."}
        </p>
        {text.length > 160 ? (
          <button
            type="button"
            className="mt-2 text-xs font-semibold text-emerald-600 underline-offset-2 transition hover:underline dark:text-emerald-300"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800/80">
          <ThumbsUp className="h-4 w-4" aria-hidden="true" />
          {likeCount}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800/80">
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          {commentCount}
        </span>
      </div>
    </article>
  );
}
