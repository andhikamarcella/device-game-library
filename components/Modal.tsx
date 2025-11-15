"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  title,
  description,
  children,
  open,
  onClose,
  footer,
  size = "md",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  if (!open) return null;

  const sizeClass = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur transition-colors duration-300 dark:bg-slate-950/80" onClick={onClose} />
      <div
        className={cn(
          "relative w-full rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-slate-900/15 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-slate-950/40",
          sizeClass,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
            {description ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-transparent p-2 text-slate-500 transition hover:bg-slate-200/60 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:focus-visible:ring-offset-slate-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 space-y-4">{children}</div>
        {footer ? (
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
