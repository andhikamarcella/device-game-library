import * as React from "react";

export function ControllerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M7 7h10a5 5 0 0 1 5 5v2.5a3.5 3.5 0 0 1-5.9 2.6L15 15H9l-1.1 2.1A3.5 3.5 0 0 1 2 14.5V12a5 5 0 0 1 5-5Zm-1 5v2a1 1 0 0 0 2 0v-2h2a1 1 0 0 0 0-2H8V8a1 1 0 1 0-2 0v2H4a1 1 0 1 0 0 2Zm10.5-1.5a1 1 0 1 0 1 1 1 1 0 0 0-1-1Zm2 3a1 1 0 1 0 1 1 1 1 0 0 0-1-1Z" />
    </svg>
  );
}
