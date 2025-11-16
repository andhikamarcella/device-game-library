"use client";

import { ReactNode } from "react";
import { LibraryProvider as InternalLibraryProvider } from "@/hooks/LibraryProvider";

export function LibraryProvider({ children }: { children: ReactNode }) {
  return <InternalLibraryProvider>{children}</InternalLibraryProvider>;
}
