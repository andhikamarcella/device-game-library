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
    <div className="flex h-full flex-col border-r border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">DG Tracker</p>
          <p className="text-lg font-semibold text-slate-100">Device & Game Library</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100 lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navigation.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-800 px-6 py-5 text-xs text-slate-500">
        <p className="font-semibold text-slate-300">Quick tip</p>
        <p className="mt-2 leading-relaxed">Keep your backlog tidy by tagging games with genres and status.</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden w-72 shrink-0 lg:block">{SidebarContent}</div>
      {open ? (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" onClick={onClose} />
          <div className="relative ml-auto h-full w-72 animate-in slide-in-from-right duration-200">
            {SidebarContent}
          </div>
        </div>
      ) : null}
    </>
  );
}
