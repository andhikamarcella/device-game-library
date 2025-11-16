import * as React from "react";
import type { FC, SVGProps } from "react";

export interface IconifyIconProps extends Omit<SVGProps<SVGSVGElement>, "ref" | "mode"> {
  icon: string;
  title?: string;
}

const ICON_DATA: Record<string, { path: string; viewBox?: string; circles?: { cx: number; cy: number; r: number; fill?: string }[] }> = {
  "mdi:nintendo-switch": {
    path: "M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 2v14h3.5A3.5 3.5 0 0 0 14 15.5V8.5A3.5 3.5 0 0 0 10.5 5zm10 0h-3.5A3.5 3.5 0 0 0 10 8.5v7a3.5 3.5 0 0 0 3.5 3.5H17z",
    circles: [
      { cx: 9, cy: 9, r: 1 },
      { cx: 15, cy: 15, r: 1.25 },
    ],
  },
  "mdi:microsoft-xbox": {
    path: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm4.6 13.6-4.6-5.2-4.6 5.2a7.9 7.9 0 0 1-1.8-5l3.7-2.7L6.6 4.9A8 8 0 0 1 12 4a8 8 0 0 1 5.4 1l-3.5 3 3.7 2.7a7.9 7.9 0 0 1-1.8 4.9Z",
  },
  "mdi:xbox": {
    path: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm4.3 13.9-4.3-4.7-4.3 4.7A8 8 0 0 1 4 10.8l4-3.2L4.6 5.2A8 8 0 0 1 12 4a8 8 0 0 1 7.4 1.2L16 7.6l4 3.2a8 8 0 0 1-3.7 5.1Z",
  },
  "mdi:sony-playstation": {
    path: "M5 7.5 13.5 5v14.2c0 .5-.4.9-.9.8-.2 0-.4 0-.6-.1L5 18.4V7.5zm9.1-.1L20 8.5v9.9c0 .4-.3.7-.6.8l-5.7 1.4c-.4.1-.8-.2-.8-.6z",
  },
  "mdi:controller-classic-outline": {
    path: "M6 6h12a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4h-1.3l-1.5 2.5a1.5 1.5 0 0 1-2.4 0L11.3 16H10a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4Zm1 3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h3l1.7 2.8.3.2.3-.2L14 13h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1Z",
  },
  "mdi:android": {
    path: "M8 5a1 1 0 1 1 2 0h4a1 1 0 1 1 2 0h1a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2v3a1 1 0 1 1-2 0v-3H9v3a1 1 0 1 1-2 0v-3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm-.5 2a.5.5 0 1 0 .5.5.5.5 0 0 0-.5-.5Zm9 0a.5.5 0 1 0 .5.5.5.5 0 0 0-.5-.5Z",
  },
};

const DEFAULT_VIEWBOX = "0 0 24 24";

export const Icon: FC<IconifyIconProps> = ({ icon, ...props }) => {
  const data = ICON_DATA[icon];
  if (!data) {
    return (
      <svg viewBox={DEFAULT_VIEWBOX} fill="currentColor" aria-hidden="true" {...props}>
        <circle cx={12} cy={12} r={8} opacity={0.3} />
      </svg>
    );
  }

  return (
    <svg viewBox={data.viewBox ?? DEFAULT_VIEWBOX} fill="currentColor" aria-hidden="true" {...props}>
      <path d={data.path} />
      {data.circles?.map((circle, index) => (
        <circle key={`${icon}-${index}`} {...circle} fill={circle.fill ?? "currentColor"} />
      ))}
    </svg>
  );
};

export default Icon;
