import { bestImageOriginal } from "@/lib/igdb";

export const igdbHD = (id: string) => bestImageOriginal(id) ?? "";

export const igdbLarge = (id: string) => bestImageOriginal(id) ?? "";

export const igdbThumb = (id: string) => bestImageOriginal(id) ?? "";
