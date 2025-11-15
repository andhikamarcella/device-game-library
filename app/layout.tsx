import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/AppShell";

const settingsHydrationScript = `(() => {
  try {
    const root = document.documentElement;
    if (!root) return;

    root.classList.add('theme-initializing');

    let storedSettings;
    try {
      const raw = window.localStorage.getItem('dglt_settings');
      if (raw) {
        storedSettings = JSON.parse(raw);
      }
    } catch (error) {
      storedSettings = undefined;
    }

    const getSystemTheme = () => {
      if (typeof window === 'undefined' || !window.matchMedia) {
        return 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const applyTheme = (themeCandidate) => {
      const nextTheme = themeCandidate === 'dark' ? 'dark' : 'light';
      root.dataset.theme = nextTheme;
      root.classList.toggle('dark', nextTheme === 'dark');
      root.style.colorScheme = nextTheme;
    };

    const storedTheme = storedSettings?.theme;
    const resolvedTheme =
      storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : getSystemTheme();

    applyTheme(resolvedTheme);
    root.dataset.themePreference = storedTheme ?? resolvedTheme;

    const toggleClass = (className, enabled) => {
      if (!className) return;
      root.classList.toggle(className, Boolean(enabled));
    };

    toggleClass('accessibility-reduce-motion', storedSettings?.reduceMotion);
    toggleClass('accessibility-high-contrast', storedSettings?.highContrast);
    toggleClass('accessibility-large-text', storedSettings?.largeText);

    if (storedTheme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const updateFromMedia = (event) => {
        applyTheme(event.matches ? 'dark' : 'light');
      };
      if (typeof media.addEventListener === 'function') {
        media.addEventListener('change', updateFromMedia);
      } else if (typeof media.addListener === 'function') {
        media.addListener(updateFromMedia);
      }
    }

    requestAnimationFrame(() => {
      root.classList.add('theme-ready');
      root.classList.remove('theme-initializing');
    });
  } catch (error) {
    // ignore pre-hydration errors
  }
})();`;

export const metadata: Metadata = {
  title: {
    default: "Device & Game Library Tracker",
    template: "%s | Device & Game Library Tracker",
  },
  description:
    "Kelola koleksi perangkat dan game kamu dengan metadata RAWG, wishlist, dan cadangan lokal yang aman.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "Device & Game Library Tracker",
    description:
      "Pantau backlog, wishlist, dan metadata game dari RAWG langsung dari browser kamu.",
    url: "https://device-game-library.vercel.app/",
    siteName: "Device & Game Library Tracker",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        type: "image/svg+xml",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Device & Game Library Tracker",
    description:
      "Cari metadata game RAWG, simpan wishlist, dan catat kemajuan bermainmu di satu tempat.",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="theme-initializing">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#16a34a" />
        <script dangerouslySetInnerHTML={{ __html: settingsHydrationScript }} />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
