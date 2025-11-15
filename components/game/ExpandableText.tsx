"use client";

import { useState } from "react";

export function ExpandableText({ text, maxLength = 400 }: { text: string; maxLength?: number }) {
  const [expanded, setExpanded] = useState(false);

  if (text.length <= maxLength) {
    return <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{text}</p>;
  }

  const preview = text.slice(0, maxLength);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
      <p>{expanded ? text : `${preview}…`}</p>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="text-sm font-semibold text-emerald-500 transition hover:text-emerald-300"
      >
        {expanded ? "Show less" : "Read more"}
      </button>
    </div>
  );
}
