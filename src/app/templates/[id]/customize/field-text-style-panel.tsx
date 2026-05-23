"use client";

import { ArabicFontCombobox } from "@/components/fonts/arabic-font-combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_ARABIC_FONT_KEY } from "@/lib/arabic-fonts";
import { resolveFieldTextStyle } from "@/lib/resolve-field-text-style";
import {
  FONT_STYLE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  TEXT_DECORATION_OPTIONS,
} from "@/lib/text-field-style";
import type { FieldTextStyle } from "@/types/editor-state";
import type { TemplateField } from "@/types/template-fields";
import { useState, type ReactNode } from "react";

interface FieldTextStylePanelProps {
  field: TemplateField;
  fieldStyles: Record<string, FieldTextStyle>;
  onChange: (fieldId: string, patch: FieldTextStyle) => void;
  onStylePreview?: (patch: Partial<FieldTextStyle> | null) => void;
  compact?: boolean;
}

const SELECT_CONTENT_PROPS = {
  position: "popper" as const,
  side: "bottom" as const,
  align: "start" as const,
  sideOffset: 4,
  avoidCollisions: true,
  collisionPadding: 12,
};

function PreviewSelect({
  value,
  onValueChange,
  onPreview,
  children,
  triggerClassName,
}: {
  value: string;
  onValueChange: (v: string) => void;
  onPreview: (patch: Partial<FieldTextStyle> | null) => void;
  children: ReactNode;
  triggerClassName?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        onValueChange(v);
        onPreview(null);
      }}
      onOpenChange={(open) => {
        if (!open) onPreview(null);
      }}
    >
      <SelectTrigger className={triggerClassName ?? "w-full"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent {...SELECT_CONTENT_PROPS} className="z-[100] max-h-60 min-w-[var(--radix-select-trigger-width)]">
        {children}
      </SelectContent>
    </Select>
  );
}

export function FieldTextStylePanel({
  field,
  fieldStyles,
  onChange,
  onStylePreview,
  compact,
}: FieldTextStylePanelProps) {
  const base = resolveFieldTextStyle(field, fieldStyles);
  if (!base) return null;

  const [sizeDraft, setSizeDraft] = useState<string | null>(null);
  const [colorDraft, setColorDraft] = useState<string | null>(null);

  function patch(p: FieldTextStyle) {
    onChange(field.id, p);
    onStylePreview?.(null);
    setSizeDraft(null);
    setColorDraft(null);
  }

  function preview(p: Partial<FieldTextStyle>) {
    onStylePreview?.(p);
  }

  return (
    <div
      className={
        compact
          ? "border-border/60 bg-muted/20 space-y-3 rounded-lg border p-3"
          : "border-primary/30 bg-primary/5 space-y-3 rounded-lg border p-3"
      }
    >
      <p className="text-muted-foreground text-xs font-medium">
        تنسيق الخط — مرّر على الخيارات للمعاينة ثم انقر للتطبيق
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">الخط</Label>
          <ArabicFontCombobox
            value={base.fontKey ?? DEFAULT_ARABIC_FONT_KEY}
            onChange={(v) => patch({ fontKey: v })}
            onPreviewChange={(key) =>
              onStylePreview?.(key ? { fontKey: key } : null)
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">سمك الخط</Label>
          <PreviewSelect
            value={String(base.fontWeight)}
            onValueChange={(v) => patch({ fontWeight: Number(v) })}
            onPreview={(p) => onStylePreview?.(p)}
          >
            {FONT_WEIGHT_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={String(opt.value)}
                onPointerEnter={() => preview({ fontWeight: opt.value })}
              >
                {opt.label}
              </SelectItem>
            ))}
          </PreviewSelect>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">نمط النص</Label>
          <PreviewSelect
            value={base.fontStyle}
            onValueChange={(v) =>
              patch({ fontStyle: v === "italic" ? "italic" : "normal" })
            }
            onPreview={(p) => onStylePreview?.(p)}
          >
            {FONT_STYLE_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                onPointerEnter={() =>
                  preview({ fontStyle: opt.value === "italic" ? "italic" : "normal" })
                }
              >
                {opt.label}
              </SelectItem>
            ))}
          </PreviewSelect>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">التسطير</Label>
          <PreviewSelect
            value={base.textDecoration}
            onValueChange={(v) =>
              patch({ textDecoration: v === "underline" ? "underline" : "none" })
            }
            onPreview={(p) => onStylePreview?.(p)}
          >
            {TEXT_DECORATION_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                onPointerEnter={() =>
                  preview({
                    textDecoration: opt.value === "underline" ? "underline" : "none",
                  })
                }
              >
                {opt.label}
              </SelectItem>
            ))}
          </PreviewSelect>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">حجم الخط</Label>
          <Input
            type="number"
            min={10}
            max={120}
            value={sizeDraft ?? String(base.fontSize)}
            onChange={(e) => {
              setSizeDraft(e.target.value);
              const n = Number(e.target.value);
              if (Number.isFinite(n)) preview({ fontSize: n });
            }}
            onBlur={(e) => {
              patch({ fontSize: Number(e.target.value) || base.fontSize });
            }}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">المحاذاة</Label>
          <PreviewSelect
            value={base.anchor}
            onValueChange={(v) =>
              patch({ anchor: v as FieldTextStyle["anchor"] })
            }
            onPreview={(p) => onStylePreview?.(p)}
          >
            {(
              [
                { value: "start", label: "يمين" },
                { value: "center", label: "وسط" },
                { value: "end", label: "يسار" },
              ] as const
            ).map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                onPointerEnter={() => preview({ anchor: opt.value })}
              >
                {opt.label}
              </SelectItem>
            ))}
          </PreviewSelect>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">لون النص</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              className="h-9 w-14 cursor-pointer p-1"
              value={colorDraft ?? base.color}
              onInput={(e) => {
                const c = (e.target as HTMLInputElement).value;
                setColorDraft(c);
                preview({ color: c });
              }}
              onChange={(e) => patch({ color: e.target.value })}
            />
            <Input
              type="text"
              value={colorDraft ?? base.color}
              onChange={(e) => {
                const c = e.target.value.trim();
                setColorDraft(e.target.value);
                if (c) preview({ color: c });
              }}
              onBlur={(e) => {
                const c = e.target.value.trim();
                if (c) patch({ color: c });
                else setColorDraft(null);
              }}
              dir="ltr"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
