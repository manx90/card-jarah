import {
  DEFAULT_FONT_STYLE,
  DEFAULT_FONT_WEIGHT,
  DEFAULT_TEXT_DECORATION,
  normalizeFontWeight,
} from "@/lib/text-field-style";
import { DEFAULT_ARABIC_FONT_KEY } from "@/lib/arabic-fonts";
import type {
  TemplateField,
  TemplateFieldGroup,
  TemplateFieldImage,
  TemplateFieldLink,
  TemplateFieldSelect,
  TemplateFieldText,
  TemplateFieldsConfig,
} from "@/types/template-fields";

function clamp01(n: number): number {
  return Math.min(0.98, Math.max(0.02, n));
}

function parseOptions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);
}

export function normalizeTemplateField(raw: unknown): TemplateField | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : "";
  const type = o.type;
  if (!id || typeof type !== "string") return null;

  const groupId =
    typeof o.groupId === "string" && o.groupId.trim() ? o.groupId.trim() : undefined;

  if (type === "text") {
    const f: TemplateFieldText = {
      id,
      type: "text",
      groupId,
      label: typeof o.label === "string" ? o.label : "نص",
      placeholder: typeof o.placeholder === "string" ? o.placeholder : undefined,
      x: typeof o.x === "number" ? clamp01(o.x) : 0.5,
      y: typeof o.y === "number" ? clamp01(o.y) : 0.5,
      anchor:
        o.anchor === "start" || o.anchor === "end" || o.anchor === "center"
          ? o.anchor
          : "center",
      fontSize: typeof o.fontSize === "number" ? o.fontSize : 24,
      color: typeof o.color === "string" ? o.color : undefined,
      fontKey:
        typeof o.fontKey === "string" ? o.fontKey : DEFAULT_ARABIC_FONT_KEY,
      fontWeight: normalizeFontWeight(o.fontWeight),
      fontStyle: o.fontStyle === "italic" ? "italic" : DEFAULT_FONT_STYLE,
      textDecoration:
        o.textDecoration === "underline" ? "underline" : DEFAULT_TEXT_DECORATION,
    };
    return f;
  }

  if (type === "select") {
    let options = parseOptions(o.options);
    if (options.length === 0) options = ["خيار 1", "خيار 2"];
    const f: TemplateFieldSelect = {
      id,
      type: "select",
      groupId,
      label: typeof o.label === "string" ? o.label : "قائمة",
      placeholder: typeof o.placeholder === "string" ? o.placeholder : undefined,
      options,
      x: typeof o.x === "number" ? clamp01(o.x) : 0.5,
      y: typeof o.y === "number" ? clamp01(o.y) : 0.5,
      anchor:
        o.anchor === "start" || o.anchor === "end" || o.anchor === "center"
          ? o.anchor
          : "center",
      fontSize: typeof o.fontSize === "number" ? o.fontSize : 24,
      color: typeof o.color === "string" ? o.color : undefined,
      fontKey:
        typeof o.fontKey === "string" ? o.fontKey : DEFAULT_ARABIC_FONT_KEY,
      fontWeight: normalizeFontWeight(o.fontWeight),
      fontStyle: o.fontStyle === "italic" ? "italic" : DEFAULT_FONT_STYLE,
      textDecoration:
        o.textDecoration === "underline" ? "underline" : DEFAULT_TEXT_DECORATION,
    };
    return f;
  }

  if (type === "link") {
    const f: TemplateFieldLink = {
      id,
      type: "link",
      groupId,
      label: typeof o.label === "string" ? o.label : "رابط",
      placeholder: typeof o.placeholder === "string" ? o.placeholder : undefined,
      x: typeof o.x === "number" ? clamp01(o.x) : 0.5,
      y: typeof o.y === "number" ? clamp01(o.y) : 0.5,
      qrSize:
        typeof o.qrSize === "number" && o.qrSize > 0 && o.qrSize <= 0.6
          ? o.qrSize
          : 0.14,
    };
    return f;
  }

  if (type === "image") {
    const f: TemplateFieldImage = {
      id,
      type: "image",
      groupId,
      label: typeof o.label === "string" ? o.label : "صورة",
      x: typeof o.x === "number" ? clamp01(o.x) : 0.5,
      y: typeof o.y === "number" ? clamp01(o.y) : 0.5,
      width:
        typeof o.width === "number" && o.width > 0 && o.width <= 1
          ? o.width
          : 0.2,
      height:
        typeof o.height === "number" && o.height > 0 && o.height <= 1
          ? o.height
          : 0.2,
    };
    return f;
  }

  return null;
}

export function normalizeGroups(raw: unknown): TemplateFieldGroup[] {
  if (!Array.isArray(raw)) return [];
  const out: TemplateFieldGroup[] = [];
  for (const g of raw) {
    if (!g || typeof g !== "object") continue;
    const o = g as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id.trim() : "";
    const title = typeof o.title === "string" ? o.title.trim() : "";
    if (id && title) out.push({ id, title });
  }
  return out;
}

export function parseTemplateFieldsConfig(json: string): {
  fields: TemplateField[];
  groups: TemplateFieldGroup[];
} {
  if (!json.trim()) return { fields: [], groups: [] };
  try {
    const parsed = JSON.parse(json) as TemplateFieldsConfig;
    const list = parsed.fields ?? [];
    const fields: TemplateField[] = [];
    for (const item of list) {
      const n = normalizeTemplateField(item);
      if (n) fields.push(n);
    }
    return { fields, groups: normalizeGroups(parsed.groups) };
  } catch {
    return { fields: [], groups: [] };
  }
}

export function buildTemplateFieldsConfig(
  fields: TemplateField[],
  groups: TemplateFieldGroup[],
): TemplateFieldsConfig {
  const g = groups.length ? groups : undefined;
  return { fields, ...(g ? { groups: g } : {}) };
}

/** حقول تُرسَم على بطاقة المعاينة (نص، قائمة، رابط QR، صورة) */
export function isCanvasField(
  f: TemplateField,
): f is TemplateFieldText | TemplateFieldSelect | TemplateFieldLink | TemplateFieldImage {
  return (
    f.type === "text" ||
    f.type === "select" ||
    f.type === "link" ||
    f.type === "image"
  );
}

export type TextLikeField = TemplateFieldText | TemplateFieldSelect;

export function isTextLikeField(f: TemplateField): f is TextLikeField {
  return f.type === "text" || f.type === "select";
}
