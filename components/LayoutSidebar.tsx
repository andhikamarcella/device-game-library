"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Gamepad2, Monitor, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Games", href: "/games", icon: Gamepad2 },
  { name: "Devices", href: "/devices", icon: Monitor },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function LayoutSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  const SidebarContent = (
    <div className="flex h-full flex-col border-r border-slate-200/60 bg-white/80 text-slate-900 backdrop-blur transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100 high-contrast-surface">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-500/40 bg-emerald-500/10 shadow-sm shadow-emerald-500/20 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <img src="/logo.svg" alt="Device & Game Library Tracker logo" className="h-9 w-9" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">DG Tracker</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Device & Game Library</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navigation.map((item, index) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 motion-safe:animate-[menu-item-appear_0.25s_ease-out] motion-safe:transition-transform motion-safe:hover:translate-x-1 dark:focus-visible:ring-offset-slate-900",
                active
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : "text-slate-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-white",
              )}
              style={{ animationDelay: `${index * 60}ms` }}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200/60 px-6 py-5 text-xs text-slate-500 transition-colors duration-300 dark:border-slate-800 dark:text-slate-400">
        <p className="font-semibold text-slate-700 dark:text-slate-200">Quick tip</p>
        <p className="mt-2 leading-relaxed">Keep your backlog tidy by tagging games with genres and status.</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden w-72 shrink-0 lg:block">{SidebarContent}</div>
      {open ? (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50 transition-opacity duration-300" aria-hidden="true" onClick={onClose} />
          <div className="relative ml-auto h-full w-72 transform bg-transparent motion-safe:animate-[sidebar-slide-in_0.32s_ease-out]">
            {SidebarContent}
          </div>
        </div>
      ) : null}
    </>
  );
}
