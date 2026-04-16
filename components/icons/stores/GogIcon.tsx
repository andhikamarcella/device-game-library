import * as React from "react";

export function GogIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7.5 8h1.5v3H7.5zm7.5 0h1.5v3H15zM6 12.5h3V16H6zm8.5 0h3V16h-3z" fill="#0f172a" />
    </svg>
  );
}
