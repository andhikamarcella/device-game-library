import type { FC, SVGProps } from "react";
import {
  SteamIcon,
  GogIcon,
  EpicIcon,
  PlayStationStoreIcon,
  XboxStoreIcon,
  NintendoEShopIcon,
  MicrosoftStoreIcon,
  AppleAppStoreIcon,
  GooglePlayIcon,
} from "@/components/icons/stores";

export const STORE_ICON_MAP: Record<string, FC<SVGProps<SVGSVGElement>>> = {
  steam: SteamIcon,
  gog: GogIcon,
  gogcom: GogIcon,
  "epic-games": EpicIcon,
  "epic-games-store": EpicIcon,
  "epic-store": EpicIcon,
  "playstation-store": PlayStationStoreIcon,
  psn: PlayStationStoreIcon,
  "xbox-store": XboxStoreIcon,
  xbox360: XboxStoreIcon,
  "xbox-one": XboxStoreIcon,
  "xbox-series-x": XboxStoreIcon,
  "nintendo": NintendoEShopIcon,
  "nintendo-eshop": NintendoEShopIcon,
  "microsoft-store": MicrosoftStoreIcon,
  "windows-store": MicrosoftStoreIcon,
  "apple-appstore": AppleAppStoreIcon,
  "apple-store": AppleAppStoreIcon,
  "google-play": GooglePlayIcon,
};

export function getStoreIcon(slug?: string | null) {
  if (!slug) {
    return null;
  }
  const normalized = slug.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  const exact = STORE_ICON_MAP[normalized];
  if (exact) {
    return exact;
  }
  const partialKey = Object.keys(STORE_ICON_MAP).find((key) => normalized.includes(key));
  return partialKey ? STORE_ICON_MAP[partialKey] : null;
}
