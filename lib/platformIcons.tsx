/**
 * NOTE: Run `npm install simple-icons @iconify/react` (or `yarn add simple-icons @iconify/react`) before using these platform icons.
 */
import type { FC, SVGProps } from "react";
import { Icon as IconifyIcon } from "@iconify/react";
import type { IconifyIconProps } from "@iconify/react";
import {
  type SimpleIcon,
  siAndroid,
  siApple,
  siIos,
  siLinux,
  siNintendo,
  siPlaystation,
  siWindows,
} from "simple-icons";

export type PlatformSlug =
  | "pc"
  | "playstation"
  | "xbox"
  | "nintendo"
  | "switch"
  | "ios"
  | "android"
  | "macos"
  | "linux"
  | "web"
  | "other";

export type PlatformIconComponent = FC<SVGProps<SVGSVGElement> & { className?: string; title?: string }>;

type IconifyReactComponent = FC<IconifyIconProps>;

function makeSimpleIcon(icon: SimpleIcon): PlatformIconComponent {
  const SimpleIconComponent: PlatformIconComponent = ({ className, ...props }) => (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d={icon.path} />
    </svg>
  );
  return SimpleIconComponent;
}

function makeIconifyIcon(name: string): PlatformIconComponent {
  const IconComponent: IconifyReactComponent = IconifyIcon as IconifyReactComponent;
  const Wrapped: PlatformIconComponent = ({
    className,
    color,
    height,
    width,
    role,
    focusable,
    style,
    title,
    "aria-hidden": ariaHidden,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby,
  }) => (
    <IconComponent
      icon={name}
      className={className}
      color={color}
      height={height}
      width={width}
      role={role}
      focusable={focusable}
      style={style}
      title={title}
      aria-hidden={ariaHidden}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
    />
  );
  return Wrapped;
}

const PlaystationIcon = makeSimpleIcon(siPlaystation);
const NintendoIcon = makeSimpleIcon(siNintendo);
const WindowsIcon = makeSimpleIcon(siWindows);
const AppleIcon = makeSimpleIcon(siApple);
const LinuxIcon = makeSimpleIcon(siLinux);
const AndroidIcon = makeSimpleIcon(siAndroid);
const IosIcon = makeSimpleIcon(siIos);

const XboxIcon = makeIconifyIcon("mdi:xbox");
const SwitchIcon = makeIconifyIcon("mdi:nintendo-switch");
const WebIcon = makeIconifyIcon("mdi:web");
const DefaultIcon: PlatformIconComponent = (props) => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true" fill="currentColor" {...props}>
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const PLATFORM_NORMALIZE: Record<string, PlatformSlug> = {
  pc: "pc",
  windows: "pc",
  "pc-windows": "pc",
  "microsoft-windows": "pc",
  steam: "pc",
  "steam-deck": "pc",
  mac: "macos",
  macos: "macos",
  ios: "ios",
  ipad: "ios",
  android: "android",
  linux: "linux",
  playstation: "playstation",
  "playstation3": "playstation",
  "playstation4": "playstation",
  "playstation5": "playstation",
  psp: "playstation",
  psvita: "playstation",
  xbox: "xbox",
  "xbox-one": "xbox",
  "xbox360": "xbox",
  "xbox-series-x": "xbox",
  "xbox-series-s": "xbox",
  "xbox-series-xs": "xbox",
  "xbox-series-x-s": "xbox",
  nintendo: "nintendo",
  "nintendo-switch": "switch",
  switch: "switch",
  "wii": "nintendo",
  "wii-u": "nintendo",
  "gamecube": "nintendo",
  "super-nintendo": "nintendo",
  web: "web",
  browser: "web",
};

const PLATFORM_ICON_COMPONENTS: Record<PlatformSlug, PlatformIconComponent> = {
  pc: WindowsIcon,
  playstation: PlaystationIcon,
  xbox: XboxIcon,
  nintendo: NintendoIcon,
  switch: SwitchIcon,
  ios: IosIcon,
  android: AndroidIcon,
  macos: AppleIcon,
  linux: LinuxIcon,
  web: WebIcon,
  other: DefaultIcon,
};

export function getPlatformIcon(rawSlug: string): PlatformIconComponent {
  const normalizedSlug = PLATFORM_NORMALIZE[rawSlug.toLowerCase()] ?? "other";
  return PLATFORM_ICON_COMPONENTS[normalizedSlug] ?? PLATFORM_ICON_COMPONENTS.other;
}
