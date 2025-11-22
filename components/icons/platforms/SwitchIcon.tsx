import * as React from "react";

export function SwitchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 2v14h3.5A3.5 3.5 0 0 0 14 15.5V8.5A3.5 3.5 0 0 0 10.5 5zm10 0h-3.5A3.5 3.5 0 0 0 10 8.5v7a3.5 3.5 0 0 0 3.5 3.5H17z" />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
      <circle cx="15" cy="15" r="1.25" fill="currentColor" />
    </svg>
  );
}
