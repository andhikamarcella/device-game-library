import * as React from "react";

export function RayTracingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M5 5h14v2H5zm2 4h10v2H7zm2 4h6v2H9zm2 4h2v2h-2z" />
      <path d="m4 15 4 6h8l4-6z" opacity={0.4} />
    </svg>
  );
}
