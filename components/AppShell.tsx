"use client";

import { useState } from "react";
import { LayoutSidebar } from "@/components/LayoutSidebar";
import { LayoutTopbar } from "@/components/LayoutTopbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <LayoutSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <LayoutTopbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 transition-colors duration-300 sm:p-6">
          <div className="mx-auto w-full max-w-7xl space-y-6 pb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
