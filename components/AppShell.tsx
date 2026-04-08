"use client";

import { useState } from "react";
import { LayoutSidebar } from "@/components/LayoutSidebar";
import { LayoutTopbar } from "@/components/LayoutTopbar";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen text-slate-900 transition-colors duration-300 dark:text-slate-100">
      <ServiceWorkerRegistration />
      <LayoutSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <LayoutTopbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="relative flex-1 overflow-y-auto p-4 transition-colors duration-300 sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.14),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(167,139,250,0.14),transparent_40%)]" />
          <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
