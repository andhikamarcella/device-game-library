import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/AppShell";

const settingsHydrationScript = `(() => {
  try {
    const raw = localStorage.getItem('dglt_settings');
    if (!raw) {
      return;
    }
    const settings = JSON.parse(raw);
    const root = document.documentElement;
    const apply = (className, enabled) => {
      if (!root || !className) return;
      root.classList.toggle(className, Boolean(enabled));
    };

    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    }

    apply('accessibility-reduce-motion', settings.reduceMotion);
    apply('accessibility-high-contrast', settings.highContrast);
    apply('accessibility-large-text', settings.largeText);
  } catch (error) {
    // ignore pre-hydration errors
  }
})();`;

export const metadata: Metadata = {
  title: "Device & Game Library Tracker",
  description: "Track your devices and games with ease.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: settingsHydrationScript }} />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
