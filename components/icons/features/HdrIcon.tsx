import * as React from "react";

export function HdrIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="m12 3 2 4 4 .7-3 3.1.7 4.2-3.7-2-3.7 2 .7-4.2-3-3.1 4-.7z" />
      <circle cx="12" cy="12" r="2" fill="#0f172a" />
    </svg>
  );
}
