import React, { FC, SVGProps } from "react";
import { Icon as IconifyIcon, IconifyIconProps } from "@iconify/react";
import {
  SimpleIcon,
  siNintendo,
  siNintendoswitch,
  siPlaystation,
  siPlaystation3,
  siPlaystation4,
  siPlaystation5,
  siSteam,
  siApple,
  siLinux,
  siAndroid,
} from "simple-icons";

export type IconComponent = FC<SVGProps<SVGSVGElement>>;

function makeSimpleIcon(icon: SimpleIcon): IconComponent {
  const { path } = icon;
  const viewBoxValue = icon.viewBox ?? "0 0 24 24";
  const SimpleWrapped: IconComponent = (props) => (
    <svg aria-hidden="true" role="img" viewBox={viewBoxValue} {...props}>
      <path d={path} />
    </svg>
  );
  return SimpleWrapped;
}

function makeIconifyIcon(name: string): IconComponent {
  const IconifyWrapped: IconComponent = ({ className, ...rest }) => (
    <IconifyIcon icon={name} className={className} {...(rest as Omit<IconifyIconProps, "icon">)} />
  );
  return IconifyWrapped;
}

const SteamIcon = makeSimpleIcon(siSteam);
const PlaystationIcon = makeSimpleIcon(siPlaystation);
const PS3Icon = makeSimpleIcon(siPlaystation3);
const PS4Icon = makeSimpleIcon(siPlaystation4);
const PS5Icon = makeSimpleIcon(siPlaystation5);
const NintendoSwitchIcon = makeSimpleIcon(siNintendoswitch);
const NintendoIcon = makeSimpleIcon(siNintendo);
const AppleIcon = makeSimpleIcon(siApple);
const LinuxIcon = makeSimpleIcon(siLinux);
const AndroidIcon = makeSimpleIcon(siAndroid);

const XboxIcon = makeIconifyIcon("mdi:xbox");
const WindowsIcon = makeIconifyIcon("mdi:microsoft-windows");
const GenericGamepadIcon = makeIconifyIcon("mdi:controller-classic-outline");

const PLATFORM_ICON_MAP: Record<string, IconComponent> = {
  // PC / Windows
  pc: WindowsIcon,
  "pc (windows)": WindowsIcon,
  windows: WindowsIcon,
  "windows pc": WindowsIcon,

  // Xbox
  xbox: XboxIcon,
  "xbox one": XboxIcon,
  "xbox series x": XboxIcon,
  "xbox series x/s": XboxIcon,
  "xbox series s": XboxIcon,
  "xbox 360": XboxIcon,

  // PlayStation
  playstation: PlaystationIcon,
  "playstation 3": PS3Icon,
  "playstation 4": PS4Icon,
  "playstation 5": PS5Icon,
  ps3: PS3Icon,
  ps4: PS4Icon,
  ps5: PS5Icon,

  // Nintendo
  "nintendo switch": NintendoSwitchIcon,
  "nintendo 3ds": NintendoIcon,
  "nintendo ds": NintendoIcon,
  nintendo: NintendoIcon,

  // Others
  ios: AppleIcon,
  macos: AppleIcon,
  "apple macintosh": AppleIcon,
  mac: AppleIcon,
  linux: LinuxIcon,
  android: AndroidIcon,
  steam: SteamIcon,
};

export function getPlatformIcon(platformNameOrSlug: string): IconComponent {
  const key = platformNameOrSlug.toLowerCase();
  const direct = PLATFORM_ICON_MAP[key];
  if (direct) return direct;

  if (key.includes("xbox")) return XboxIcon;
  if (key.includes("playstation") || key === "ps4" || key === "ps5" || key === "ps3") return PlaystationIcon;
  if (key.includes("switch") || key.includes("nintendo")) return NintendoIcon;
  if (key.includes("pc") || key.includes("windows")) return WindowsIcon;
  if (key.includes("mac")) return AppleIcon;
  if (key.includes("linux")) return LinuxIcon;
  if (key.includes("android")) return AndroidIcon;
  if (key.includes("ios") || key.includes("apple")) return AppleIcon;

  return GenericGamepadIcon;
}

export const PlatformIcon: React.FC<{
  platform: string;
  className?: string;
}> = ({ platform, className }) => {
  const Icon = getPlatformIcon(platform);
  return <Icon className={className} width={18} height={18} aria-hidden="true" />;
};
