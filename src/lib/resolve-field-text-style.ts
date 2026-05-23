import { DEFAULT_ARABIC_FONT_KEY } from "@/lib/arabic-fonts";
import {
  DEFAULT_FONT_STYLE,
  DEFAULT_FONT_WEIGHT,
  DEFAULT_TEXT_DECORATION,
  normalizeFontWeight,
} from "@/lib/text-field-style";
import { isTextLikeField } from "@/lib/template-fields-config";
import type { FieldTextStyle } from "@/types/editor-state";
import type { TemplateField } from "@/types/template-fields";

export interface ResolvedTextStyle {
  fontKey: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline";
  color: string;
  anchor: "center" | "start" | "end";
}

export function resolveFieldTextStyle(
  field: TemplateField,
  overrides: Record<string, FieldTextStyle>,
): ResolvedTextStyle | null {
  if (!isTextLikeField(field)) return null;
  const o = overrides[field.id] ?? {};
  return {
    fontKey: o.fontKey ?? field.fontKey ?? DEFAULT_ARABIC_FONT_KEY,
    fontSize: o.fontSize ?? field.fontSize ?? 22,
    fontWeight: normalizeFontWeight(o.fontWeight ?? field.fontWeight),
    fontStyle: o.fontStyle ?? field.fontStyle ?? DEFAULT_FONT_STYLE,
    textDecoration:
      o.textDecoration ?? field.textDecoration ?? DEFAULT_TEXT_DECORATION,
    color: o.color ?? field.color ?? "#1a1a1a",
    anchor: o.anchor ?? field.anchor ?? "center",
  };
}

export function mergeTextStyleWithPreview(
  base: ResolvedTextStyle,
  preview: Partial<FieldTextStyle> | null | undefined,
): ResolvedTextStyle {
  if (!preview) return base;
  return {
    fontKey: preview.fontKey ?? base.fontKey,
    fontSize: preview.fontSize ?? base.fontSize,
    fontWeight:
      preview.fontWeight !== undefined
        ? normalizeFontWeight(preview.fontWeight)
        : base.fontWeight,
    fontStyle: preview.fontStyle ?? base.fontStyle,
    textDecoration: preview.textDecoration ?? base.textDecoration,
    color: preview.color ?? base.color,
    anchor: preview.anchor ?? base.anchor,
  };
}
