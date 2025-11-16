/**
 * NOTE: Run `npm install simple-icons @iconify/react` before using these platform icons.
 */
import React from "react";
import type { FC, SVGProps } from "react";
import { Icon as IconifyIcon } from "@iconify/react";
import {
  SimpleIcon,
  siApple,
  siLinux,
  siPlaystation,
  siSteam,
  siSteamdeck,
  siWindows,
  siXbox,
} from "simple-icons";

type IconProps = Omit<SVGProps<SVGSVGElement>, "mode">;
export type IconComponent = FC<IconProps>;

function makeSimpleIcon(icon: SimpleIcon): IconComponent {
  const Icon: IconComponent = (props) =>
    React.createElement(
      "svg",
      {
        viewBox: "0 0 24 24",
        role: "img",
        "aria-hidden": "true",
        fill: "currentColor",
        focusable: "false",
        ...props,
      },
      React.createElement("path", { d: icon.path })
    );
  return Icon;
}

function makeIconifyIcon(name: string): IconComponent {
  const IconifyWrapped: IconComponent = (props) =>
    React.createElement(IconifyIcon, { icon: name, ...props });
  return IconifyWrapped;
}

const PlayStationSimple = makeSimpleIcon(siPlaystation);
const XboxSimple = makeSimpleIcon(siXbox);
const WindowsSimple = makeSimpleIcon(siWindows);
const SteamSimple = makeSimpleIcon(siSteam);
const SteamDeckSimple = makeSimpleIcon(siSteamdeck);
const LinuxSimple = makeSimpleIcon(siLinux);
const AppleSimple = makeSimpleIcon(siApple);

const NintendoSwitchIcon = makeIconifyIcon("mdi:nintendo-switch");
const XboxSeriesIconify = makeIconifyIcon("mdi:microsoft-xbox");
const XboxOneIconify = makeIconifyIcon("mdi:xbox");
const PlayStationPortableIcon = makeIconifyIcon("mdi:sony-playstation");
const GenericConsoleIcon = makeIconifyIcon("mdi:controller-classic-outline");

export const PLATFORM_ICON_MAP: Record<string, IconComponent> = {
  pc: WindowsSimple,
  windows: WindowsSimple,
  "pc-windows": WindowsSimple,
  "microsoft-windows": WindowsSimple,

  mac: AppleSimple,
  macos: AppleSimple,

  linux: LinuxSimple,

  playstation: PlayStationSimple,
  "playstation3": PlayStationSimple,
  "playstation4": PlayStationSimple,
  "playstation5": PlayStationSimple,
  psvita: PlayStationPortableIcon,
  psp: PlayStationPortableIcon,

  xbox: XboxSimple,
  "xbox-one": XboxOneIconify,
  "xbox360": XboxOneIconify,
  "xbox-series-x": XboxSeriesIconify,
  "xbox-series-s": XboxSeriesIconify,
  "xbox-series-x-s": XboxSeriesIconify,

  nintendo: NintendoSwitchIcon,
  "nintendo-switch": NintendoSwitchIcon,

  steam: SteamSimple,
  "steam-deck": SteamDeckSimple,

  ios: AppleSimple,
  android: makeIconifyIcon("mdi:android"),
  linuxlite: LinuxSimple,
  amiga: GenericConsoleIcon,
};

export function getPlatformIcon(slug?: string | null): IconComponent | null {
  if (!slug) return null;
  return PLATFORM_ICON_MAP[slug] ?? null;
}
