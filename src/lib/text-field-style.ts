/** أوزان وأسماء عربية للعرض في القوائم */
export const DEFAULT_FONT_WEIGHT = 400;

export const FONT_WEIGHT_OPTIONS: { value: number; label: string }[] = [
  { value: 300, label: "خفيف" },
  { value: 400, label: "عادي" },
  { value: 500, label: "متوسط" },
  { value: 600, label: "شبه عريض" },
  { value: 700, label: "عريض" },
  { value: 800, label: "عريض جداً" },
];

const weightSet = new Set(FONT_WEIGHT_OPTIONS.map((o) => o.value));

export function normalizeFontWeight(n: unknown): number {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : DEFAULT_FONT_WEIGHT;
  return weightSet.has(v) ? v : DEFAULT_FONT_WEIGHT;
}

export type TextFontStyle = "normal" | "italic";

export type TextDecorationMode = "none" | "underline";

export const DEFAULT_FONT_STYLE: TextFontStyle = "normal";
export const DEFAULT_TEXT_DECORATION: TextDecorationMode = "none";

export const FONT_STYLE_OPTIONS: { value: TextFontStyle; label: string }[] = [
  { value: "normal", label: "عادي" },
  { value: "italic", label: "مائل" },
];

export const TEXT_DECORATION_OPTIONS: {
  value: TextDecorationMode;
  label: string;
}[] = [
  { value: "none", label: "بدون تسطير" },
  { value: "underline", label: "مسطّر" },
];
