import React, { FC, SVGProps } from "react";
import {
  SimpleIcon,
  siWindows,
  siXbox,
  siPlaystation,
  siPlaystation2,
  siPlaystation3,
  siPlaystation4,
  siPlaystation5,
  siNintendoswitch,
  siNintendo,
  siApple,
  siLinux,
  siAndroid,
  siSteam,
} from "simple-icons";

export type IconComponent = FC<SVGProps<SVGSVGElement>>;

function makeSimpleIcon(icon: SimpleIcon): IconComponent {
  const { path, viewBox } = icon;
  const viewBoxValue = viewBox ?? "0 0 24 24";
  const SimpleWrapped: IconComponent = (props) => (
    <svg aria-hidden="true" role="img" viewBox={viewBoxValue} {...props}>
      <path d={path} />
    </svg>
  );
  return SimpleWrapped;
}

const WindowsIcon = makeSimpleIcon(siWindows);
const XboxIcon = makeSimpleIcon(siXbox);
const PlaystationIcon = makeSimpleIcon(siPlaystation);
const PS2Icon = makeSimpleIcon(siPlaystation2);
const PS3Icon = makeSimpleIcon(siPlaystation3);
const PS4Icon = makeSimpleIcon(siPlaystation4);
const PS5Icon = makeSimpleIcon(siPlaystation5);
const SwitchIcon = makeSimpleIcon(siNintendoswitch);
const NintendoIcon = makeSimpleIcon(siNintendo);
const AppleIcon = makeSimpleIcon(siApple);
const LinuxIcon = makeSimpleIcon(siLinux);
const AndroidIcon = makeSimpleIcon(siAndroid);
const SteamIcon = makeSimpleIcon(siSteam);

const GenericPlatformIcon = WindowsIcon;

const PLATFORM_ICON_MAP: Record<string, IconComponent> = {
  // PC / Windows
  pc: WindowsIcon,
  "pc (windows)": WindowsIcon,
  windows: WindowsIcon,
  "windows pc": WindowsIcon,
  "pc-windows": WindowsIcon,

  // Xbox
  xbox: XboxIcon,
  "xbox one": XboxIcon,
  "xbox-one": XboxIcon,
  "xbox series x": XboxIcon,
  "xbox-series-x": XboxIcon,
  "xbox series x/s": XboxIcon,
  "xbox 360": XboxIcon,
  "xbox-360": XboxIcon,
  xbox360: XboxIcon,

  // PlayStation
  playstation: PlaystationIcon,
  "playstation 2": PS2Icon,
  playstation2: PS2Icon,
  "playstation 3": PS3Icon,
  playstation3: PS3Icon,
  "playstation 4": PS4Icon,
  playstation4: PS4Icon,
  "playstation 5": PS5Icon,
  playstation5: PS5Icon,
  ps2: PS2Icon,
  ps3: PS3Icon,
  ps4: PS4Icon,
  ps5: PS5Icon,

  // Nintendo
  "nintendo switch": SwitchIcon,
  "nintendo-switch": SwitchIcon,
  "nintendo 3ds": NintendoIcon,
  "nintendo-3ds": NintendoIcon,
  "nintendo ds": NintendoIcon,
  "nintendo-ds": NintendoIcon,
  nintendo: NintendoIcon,

  // Others
  ios: AppleIcon,
  macos: AppleIcon,
  "apple macintosh": AppleIcon,
  mac: AppleIcon,
  "mac-os": AppleIcon,
  linux: LinuxIcon,
  android: AndroidIcon,
  steam: SteamIcon,
};

export function getPlatformIcon(platformNameOrSlug: string): IconComponent {
  const key = platformNameOrSlug.toLowerCase();
  const direct = PLATFORM_ICON_MAP[key];
  if (direct) return direct;

  if (key.includes("xbox")) return XboxIcon;
  if (key.includes("playstation") || key.startsWith("ps")) return PlaystationIcon;
  if (key.includes("switch") || key.includes("nintendo")) return NintendoIcon;
  if (key.includes("pc") || key.includes("windows")) return WindowsIcon;
  if (key.includes("mac") || key.includes("ios") || key.includes("apple")) return AppleIcon;
  if (key.includes("linux")) return LinuxIcon;
  if (key.includes("android")) return AndroidIcon;
  if (key.includes("steam")) return SteamIcon;

  return GenericPlatformIcon;
}

export const PlatformIcon: React.FC<{
  platform: string;
  className?: string;
}> = ({ platform, className }) => {
  const Icon = getPlatformIcon(platform);
  return <Icon className={className} width={18} height={18} aria-hidden="true" />;
};
