"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { truncateText } from "@/lib/text";

interface ExpandableTextProps {
  text: string;
  maxChars?: number;
  className?: string;
  buttonClassName?: string;
}

export function ExpandableText({ text, maxChars = 600, className, buttonClassName }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const shouldTruncate = text.length > maxChars;
  const displayText = !shouldTruncate || expanded ? text : truncateText(text, maxChars);

  return (
    <div className="space-y-2">
      <p className={cn("whitespace-pre-line text-sm leading-relaxed", className)}>{displayText}</p>
      {shouldTruncate ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className={cn(
            "text-sm font-semibold text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-300",
            buttonClassName,
          )}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
