import type { GoogleArabicFontEntry } from "@/lib/google-fonts-arabic-catalog";
import { GOOGLE_ARABIC_FONT_CATALOG } from "@/lib/google-fonts-arabic-catalog";

export const DEFAULT_ARABIC_FONT_KEY = "tajawal" as const;

export interface ArabicFontOption {
  key: string;
  label: string;
  cssStack: string;
}

export const ARABIC_FONT_OPTIONS: ArabicFontOption[] = GOOGLE_ARABIC_FONT_CATALOG.map(
  (e) => ({
    key: e.key,
    label: e.label,
    cssStack: `'${e.googleFamily}', var(--font-tajawal), sans-serif`,
  }),
);

const keySet = new Set(GOOGLE_ARABIC_FONT_CATALOG.map((e) => e.key));

export function getFontEntryByKey(key: string | undefined): GoogleArabicFontEntry {
  const k = key && keySet.has(key) ? key : DEFAULT_ARABIC_FONT_KEY;
  return GOOGLE_ARABIC_FONT_CATALOG.find((e) => e.key === k) ?? GOOGLE_ARABIC_FONT_CATALOG[0];
}

export function fontFamilyForKey(key: string | undefined): string {
  const e = getFontEntryByKey(key);
  return `'${e.googleFamily}', var(--font-tajawal), sans-serif`;
}
