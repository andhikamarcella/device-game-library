import {
  BookOpen,
  Facebook,
  Globe,
  Instagram,
  Link as LinkIcon,
  MessageCircle,
  MessageSquare,
  Newspaper,
  Store,
  Twitch,
  Twitter,
  Youtube,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type WebsiteEntry = {
  url?: string | null;
  category?: number | null;
  trusted?: boolean | null;
};

export type ResolvedLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  priority: number;
};

type LinkKind =
  | "official"
  | "steam"
  | "wikipedia"
  | "facebook"
  | "instagram"
  | "twitter"
  | "youtube"
  | "reddit"
  | "discord"
  | "twitch"
  | "epic"
  | "press"
  | "unknown";

const kindMeta: Record<LinkKind, { icon: LucideIcon; label: string; priority: number }> = {
  official: { icon: Globe, label: "Official Website", priority: 1 },
  steam: { icon: Store, label: "Steam", priority: 2 },
  wikipedia: { icon: BookOpen, label: "Wikipedia", priority: 3 },
  facebook: { icon: Facebook, label: "Facebook", priority: 4 },
  instagram: { icon: Instagram, label: "Instagram", priority: 4 },
  twitter: { icon: Twitter, label: "Twitter / X", priority: 4 },
  youtube: { icon: Youtube, label: "YouTube", priority: 4 },
  reddit: { icon: MessageCircle, label: "Reddit", priority: 4 },
  discord: { icon: MessageSquare, label: "Discord", priority: 4 },
  twitch: { icon: Twitch, label: "Twitch", priority: 4 },
  epic: { icon: Store, label: "Epic Games", priority: 5 },
  press: { icon: Newspaper, label: "Press Kit", priority: 5 },
  unknown: { icon: LinkIcon, label: "Website", priority: 6 },
};

const domainKindMatchers: Array<{ test: (host: string, href: string) => LinkKind | null }> = [
  {
    test: (_host, href) => (/[\\/.]presskit|\\bpress\\b/i.test(href) ? "press" : null),
  },
  {
    test: (_host, href) => (href.includes("store.steampowered.com") ? "steam" : null),
  },
  {
    test: (_host, href) => (href.includes("wikipedia.org") ? "wikipedia" : null),
  },
  {
    test: (host) => (host.includes("facebook.com") ? "facebook" : null),
  },
  {
    test: (host) => (host.includes("instagram.com") ? "instagram" : null),
  },
  {
    test: (_host, href) => (href.includes("youtube.com") || href.includes("youtu.be") ? "youtube" : null),
  },
  {
    test: (host) => (host.includes("twitter.com") || host.includes("x.com") ? "twitter" : null),
  },
  {
    test: (host) => (host.includes("discord.gg") || host.includes("discord.com") ? "discord" : null),
  },
  {
    test: (host) => (host.includes("twitch.tv") ? "twitch" : null),
  },
  {
    test: (host) => (host.includes("epicgames.com") ? "epic" : null),
  },
  {
    test: (host) => (host.includes("reddit.com") ? "reddit" : null),
  },
];

const hostnameFromUrl = (href: string): string | null => {
  try {
    const url = new URL(href);
    return url.hostname.toLowerCase();
  } catch (error) {
    console.warn("Invalid URL in website entry", href, error);
    return null;
  }
};

const inferKind = (entry: WebsiteEntry, host: string | null): LinkKind => {
  if (entry.category === 1) {
    return "official";
  }

  const href = entry.url?.toLowerCase() ?? "";

  for (const matcher of domainKindMatchers) {
    const kind = matcher.test(host ?? "", href);
    if (kind) return kind;
  }

  return entry.category === 2 ? "steam" : "unknown";
};

const formatUnknownLabel = (href: string, fallback: string): string => {
  const host = hostnameFromUrl(href);
  if (!host) return fallback;
  return host.replace(/^www\./, "");
};

export function mapWebsiteLinks(websites?: WebsiteEntry[] | null): ResolvedLink[] {
  if (!websites || websites.length === 0) return [];

  const mapped = websites
    .map((site) => {
      if (!site?.url) return null;
      const href = site.url;
      const host = hostnameFromUrl(href);
      const kind = inferKind(site, host);
      const meta = kindMeta[kind];
      const label = kind === "unknown" ? formatUnknownLabel(href, meta.label) : meta.label;
      return { href, label, icon: meta.icon, priority: meta.priority } satisfies ResolvedLink;
    })
    .filter((item): item is ResolvedLink => Boolean(item));

  const deduped: ResolvedLink[] = [];
  const seen = new Set<string>();
  mapped.forEach((item) => {
    const key = item.href.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(item);
  });

  return deduped.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.label.localeCompare(b.label);
  });
}
