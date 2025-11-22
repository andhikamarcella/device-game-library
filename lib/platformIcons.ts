import type { FC, SVGProps } from "react";
import {
  PlayStationIcon,
  PS4Icon,
  PS5Icon,
  XboxIcon,
  XboxOneIcon,
  XboxSeriesIcon,
  SwitchIcon,
  PCIcon,
  MacIcon,
  LinuxIcon,
  SteamDeckIcon,
} from "@/components/icons/platforms";

export const PLATFORM_ICON_MAP: Record<string, FC<SVGProps<SVGSVGElement>>> = {
  pc: PCIcon,
  windows: PCIcon,
  macos: MacIcon,
  mac: MacIcon,
  linux: LinuxIcon,
  playstation: PlayStationIcon,
  "playstation3": PlayStationIcon,
  "playstation-3": PlayStationIcon,
  "playstation4": PS4Icon,
  "playstation-4": PS4Icon,
  "playstation5": PS5Icon,
  "playstation-5": PS5Icon,
  ps4: PS4Icon,
  ps5: PS5Icon,
  xbox: XboxIcon,
  "xbox-one": XboxOneIcon,
  xboxone: XboxOneIcon,
  "xbox-series-x": XboxSeriesIcon,
  "xbox-series-s": XboxSeriesIcon,
  "xbox-series-x-s": XboxSeriesIcon,
  "xbox-series": XboxSeriesIcon,
  nintendo: SwitchIcon,
  "nintendo-switch": SwitchIcon,
  switch: SwitchIcon,
  "steam-deck": SteamDeckIcon,
};

export function getPlatformIcon(slug?: string | null) {
  if (!slug) {
    return null;
  }
  const normalized = slug.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  const exact = PLATFORM_ICON_MAP[normalized];
  if (exact) {
    return exact;
  }
  const partialKey = Object.keys(PLATFORM_ICON_MAP).find((key) => normalized.includes(key));
  return partialKey ? PLATFORM_ICON_MAP[partialKey] : null;
}
