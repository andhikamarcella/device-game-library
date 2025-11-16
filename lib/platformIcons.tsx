/**
 * NOTE: Run `npm install simple-icons` before using these platform icons.
 */
import type { FC, SVGProps } from "react";
import {
  SimpleIcon,
  siApple,
  siLinux,
  siNintendoswitch,
  siPlaystation,
  siPlaystation4,
  siPlaystation5,
  siSteamdeck,
  siWindows,
  siXbox,
  siXboxseriesx,
} from "simple-icons";

function makeIconComponent(icon: SimpleIcon): FC<SVGProps<SVGSVGElement>> {
  const Icon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg role="img" viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
      <path d={icon.path} fill="currentColor" />
    </svg>
  );
  return Icon;
}

export const PlayStationIcon = makeIconComponent(siPlaystation);
export const PS4Icon = makeIconComponent(siPlaystation4);
export const PS5Icon = makeIconComponent(siPlaystation5);
export const XboxIcon = makeIconComponent(siXbox);
export const XboxOneIcon = XboxIcon;
export const XboxSeriesIcon = makeIconComponent(siXboxseriesx);
export const SwitchIcon = makeIconComponent(siNintendoswitch);
export const PCIcon = makeIconComponent(siWindows);
export const MacIcon = makeIconComponent(siApple);
export const LinuxIcon = makeIconComponent(siLinux);
export const SteamDeckIcon = makeIconComponent(siSteamdeck);

export const PLATFORM_ICON_MAP: Record<string, FC<SVGProps<SVGSVGElement>>> = {
  pc: PCIcon,
  windows: PCIcon,
  macos: MacIcon,
  mac: MacIcon,
  linux: LinuxIcon,
  playstation: PlayStationIcon,
  playstation3: PlayStationIcon,
  playstation4: PS4Icon,
  playstation5: PS5Icon,
  xbox: XboxIcon,
  "xbox-one": XboxOneIcon,
  "xbox-series-x": XboxSeriesIcon,
  "xbox-series-s": XboxSeriesIcon,
  "xbox-series-x-s": XboxSeriesIcon,
  nintendo: SwitchIcon,
  "nintendo-switch": SwitchIcon,
  "steam-deck": SteamDeckIcon,
};

export function getPlatformIcon(slug?: string | null) {
  if (!slug) return null;
  return PLATFORM_ICON_MAP[slug] ?? null;
}
