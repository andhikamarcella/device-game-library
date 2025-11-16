import { Gamepad2 } from "lucide-react";
import { cloneElement, type ReactElement } from "react";

type IconBadgeProps = {
  label: string;
  srLabel: string;
  backgroundClass: string;
  textClass: string;
};

const IconBadge = ({ label, srLabel, backgroundClass, textClass }: IconBadgeProps) => (
  <span
    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold uppercase ${backgroundClass} ${textClass}`}
  >
    <span aria-hidden="true">{label}</span>
    <span className="sr-only">{srLabel}</span>
  </span>
);

const PlayStationIcon = () => (
  <IconBadge label="PS" srLabel="PlayStation" backgroundClass="bg-blue-600" textClass="text-white" />
);

const XboxIcon = () => (
  <IconBadge label="XB" srLabel="Xbox" backgroundClass="bg-green-600" textClass="text-white" />
);

const NintendoIcon = () => (
  <IconBadge label="NT" srLabel="Nintendo" backgroundClass="bg-red-600" textClass="text-white" />
);

const PcIcon = () => (
  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-semibold uppercase text-white">
    <span aria-hidden="true">PC</span>
    <span className="sr-only">PC</span>
  </span>
);

const MacIcon = () => (
  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold uppercase text-slate-900">
    <span aria-hidden="true">MAC</span>
    <span className="sr-only">macOS</span>
  </span>
);

const LinuxIcon = () => (
  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-semibold uppercase text-white">
    <span aria-hidden="true">LNX</span>
    <span className="sr-only">Linux</span>
  </span>
);

const RetroIcon = () => (
  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-[10px] font-semibold uppercase text-white">
    <span aria-hidden="true">RG</span>
    <span className="sr-only">Retro console</span>
  </span>
);

const MobileIcon = () => (
  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[10px] font-semibold uppercase text-white">
    <span aria-hidden="true">MB</span>
    <span className="sr-only">Mobile</span>
  </span>
);

const DefaultIcon = () => (
  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-700">
    <Gamepad2 className="h-4 w-4" aria-hidden="true" />
    <span className="sr-only">Platform</span>
  </span>
);

export const platformIcons: Record<string, ReactElement> = {
  playstation: <PlayStationIcon />,
  "playstation-5": <PlayStationIcon />,
  "playstation-4": <PlayStationIcon />,
  "playstation-3": <PlayStationIcon />,
  "playstation-2": <PlayStationIcon />,
  "playstation-1": <PlayStationIcon />,
  "ps-vita": <PlayStationIcon />,
  "psp": <PlayStationIcon />,
  xbox: <XboxIcon />,
  "xbox-series-x": <XboxIcon />,
  "xbox-one": <XboxIcon />,
  "xbox360": <XboxIcon />,
  "xbox-old": <XboxIcon />,
  "xbox-360": <XboxIcon />,
  nintendo: <NintendoIcon />,
  "nintendo-switch": <NintendoIcon />,
  "nintendo-wii": <NintendoIcon />,
  "nintendo-ds": <NintendoIcon />,
  "nintendo-3ds": <NintendoIcon />,
  "nintendo-gamecube": <NintendoIcon />,
  pc: <PcIcon />,
  "pc-mac": <PcIcon />,
  macos: <MacIcon />,
  linux: <LinuxIcon />,
  ios: <MobileIcon />,
  android: <MobileIcon />,
  sega: <RetroIcon />,
  "sega-dreamcast": <RetroIcon />,
  "sega-saturn": <RetroIcon />,
  "neo-geo": <RetroIcon />,
};

const defaultIconElement = <DefaultIcon />;

export const getPlatformIcon = (slug?: string | null, name?: string | null) => {
  const normalizedSlug = slug?.toLowerCase();
  if (normalizedSlug && platformIcons[normalizedSlug]) {
    return cloneElement(platformIcons[normalizedSlug]);
  }

  if (normalizedSlug) {
    const matchKey = Object.keys(platformIcons).find((key) => normalizedSlug.includes(key));
    if (matchKey) {
      return cloneElement(platformIcons[matchKey]);
    }
  }

  const normalizedName = name?.toLowerCase();
  if (normalizedName) {
    const exact = platformIcons[normalizedName];
    if (exact) {
      return cloneElement(exact);
    }

    const partialKey = Object.keys(platformIcons).find((key) => normalizedName.includes(key));
    if (partialKey) {
      return cloneElement(platformIcons[partialKey]);
    }
  }

  return cloneElement(defaultIconElement);
};

export const DefaultPlatformIcon = () => cloneElement(defaultIconElement);
