"use client";

import { ArabicFontCombobox } from "@/components/fonts/arabic-font-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_ARABIC_FONT_KEY,
  fontFamilyForKey,
  getFontEntryByKey,
} from "@/lib/arabic-fonts";
import { groupFieldsForForm } from "@/lib/template-fields-form-order";
import { ensureGoogleFontLoaded } from "@/lib/load-google-font";
import {
  DEFAULT_FONT_STYLE,
  DEFAULT_FONT_WEIGHT,
  DEFAULT_TEXT_DECORATION,
  FONT_STYLE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  normalizeFontWeight,
  TEXT_DECORATION_OPTIONS,
} from "@/lib/text-field-style";
import type {
  TemplateField,
  TemplateFieldsConfig,
} from "@/types/template-fields";
import {
  scaleFontSizeToContainer,
  useCardPreviewContainerWidth,
} from "@/lib/card-preview-font-scale";
import { isTextLikeField } from "@/lib/template-fields-config";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function buildInitialValues(fields: TemplateField[]): Record<string, string> {
  const o: Record<string, string> = {};
  for (const f of fields) {
    if (f.type === "select") {
      o[f.id] = f.options[0] ?? "";
    } else {
      o[f.id] = "";
    }
  }
  return o;
}

function clamp01(n: number): number {
  return Math.min(0.98, Math.max(0.02, n));
}

interface ExtraTextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontKey: string;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline";
}

function QrCanvasImage({ url, className }: { url: string; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const u = url.trim();
    if (!u) {
      setSrc(null);
      return;
    }
    let target = u;
    if (!/^https?:\/\//i.test(target)) {
      target = `https://${target}`;
    }
    void import("qrcode")
      .then((qr) => qr.default.toDataURL(target, { margin: 1, width: 512 }))
      .then((data) => {
        if (!cancelled) setSrc(data);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!src) {
    return (
      <span className="text-muted-foreground flex size-full items-center justify-center text-[10px]">
        …
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={className ?? "size-full object-contain"} draggable={false} />
  );
}

export function CardCustomizer({
  templateId,
  previewUrl,
  fieldsJson,
  purchased,
}: {
  templateId: string;
  previewUrl: string;
  fieldsJson: TemplateFieldsConfig;
  purchased: boolean;
}) {
  const fields = useMemo(() => fieldsJson.fields ?? [], [fieldsJson]);
  const groups = useMemo(() => fieldsJson.groups ?? [], [fieldsJson]);
  const formSections = useMemo(
    () => groupFieldsForForm(fields, groups),
    [fields, groups],
  );

  const [values, setValues] = useState<Record<string, string>>(() =>
    buildInitialValues(fields),
  );

  useEffect(() => {
    setValues((prev) => {
      const next = buildInitialValues(fields);
      const merged = { ...next };
      for (const id of Object.keys(next)) {
        if (id in prev) merged[id] = prev[id]!;
      }
      return merged;
    });
  }, [fields]);

  const [positionOverrides, setPositionOverrides] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [fontKeyOverrides, setFontKeyOverrides] = useState<
    Record<string, string>
  >({});
  const [fontWeightOverrides, setFontWeightOverrides] = useState<
    Record<string, number>
  >({});
  const [fontStyleOverrides, setFontStyleOverrides] = useState<
    Record<string, "normal" | "italic">
  >({});
  const [textDecorationOverrides, setTextDecorationOverrides] = useState<
    Record<string, "none" | "underline">
  >({});
  const [extraLayers, setExtraLayers] = useState<ExtraTextLayer[]>([]);

  const captureRef = useRef<HTMLDivElement>(null);
  const previewContainerWidth = useCardPreviewContainerWidth(captureRef, [
    previewUrl,
  ]);
  const [exporting, setExporting] = useState(false);

  const updateValue = useCallback((id: string, v: string) => {
    setValues((prev) => ({ ...prev, [id]: v }));
  }, []);

  const scaledFont = useCallback(
    (storedPx: number) =>
      scaleFontSizeToContainer(storedPx, previewContainerWidth),
    [previewContainerWidth],
  );

  const getFieldPosition = useCallback(
    (f: TemplateField) => {
      const o = positionOverrides[f.id];
      return { x: o?.x ?? f.x, y: o?.y ?? f.y };
    },
    [positionOverrides],
  );

  const getFieldFontKey = useCallback(
    (f: TemplateField) => {
      if (!isTextLikeField(f)) return DEFAULT_ARABIC_FONT_KEY;
      const o = fontKeyOverrides[f.id];
      return o ?? f.fontKey ?? DEFAULT_ARABIC_FONT_KEY;
    },
    [fontKeyOverrides],
  );

  const getFieldFontWeight = useCallback(
    (f: TemplateField) => {
      if (!isTextLikeField(f)) return DEFAULT_FONT_WEIGHT;
      const o = fontWeightOverrides[f.id];
      return o ?? normalizeFontWeight(f.fontWeight);
    },
    [fontWeightOverrides],
  );

  const getFieldFontStyle = useCallback(
    (f: TemplateField) => {
      if (!isTextLikeField(f)) return DEFAULT_FONT_STYLE;
      const o = fontStyleOverrides[f.id];
      return o ?? (f.fontStyle === "italic" ? "italic" : DEFAULT_FONT_STYLE);
    },
    [fontStyleOverrides],
  );

  const getFieldTextDecoration = useCallback(
    (f: TemplateField) => {
      if (!isTextLikeField(f)) return DEFAULT_TEXT_DECORATION;
      const o = textDecorationOverrides[f.id];
      return (
        o ??
        (f.textDecoration === "underline" ? "underline" : DEFAULT_TEXT_DECORATION)
      );
    },
    [textDecorationOverrides],
  );

  useEffect(() => {
    for (const f of fields) {
      if (isTextLikeField(f)) {
        const k =
          fontKeyOverrides[f.id] ?? f.fontKey ?? DEFAULT_ARABIC_FONT_KEY;
        ensureGoogleFontLoaded(getFontEntryByKey(k).googleFamily);
      }
    }
    for (const layer of extraLayers) {
      ensureGoogleFontLoaded(getFontEntryByKey(layer.fontKey).googleFamily);
    }
  }, [fields, fontKeyOverrides, extraLayers]);

  function beginDrag(
    e: React.PointerEvent,
    kind: "field" | "extra",
    id: string,
  ) {
    e.preventDefault();
    e.stopPropagation();
    const el = captureRef.current;
    if (!el) return;

    const onMove = (ev: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = clamp01((ev.clientX - rect.left) / rect.width);
      const y = clamp01((ev.clientY - rect.top) / rect.height);
      if (kind === "field") {
        setPositionOverrides((prev) => ({ ...prev, [id]: { x, y } }));
      } else {
        setExtraLayers((prev) =>
          prev.map((l) => (l.id === id ? { ...l, x, y } : l)),
        );
      }
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function addExtraTextLayer() {
    setExtraLayers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text: "نص جديد",
        x: 0.5,
        y: 0.5,
        fontSize: 20,
        color: "#1a1a1a",
        fontKey: DEFAULT_ARABIC_FONT_KEY,
        fontWeight: DEFAULT_FONT_WEIGHT,
        fontStyle: DEFAULT_FONT_STYLE,
        textDecoration: DEFAULT_TEXT_DECORATION,
      },
    ]);
  }

  function removeExtraLayer(id: string) {
    setExtraLayers((prev) => prev.filter((l) => l.id !== id));
  }

  function updateExtraLayer(id: string, patch: Partial<ExtraTextLayer>) {
    setExtraLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    );
  }

  async function exportPng() {
    if (!purchased || !captureRef.current) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const root = captureRef.current;
      const url = await toPng(root, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#f4f4f5",
        skipAutoScale: true,
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = `card-${templateId}.png`;
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  }

  function renderFieldControls(f: TemplateField) {
    const ph =
      f.type === "image"
        ? f.label
        : (f.placeholder?.trim() || f.label);
    if (f.type === "text") {
      return (
        <>
          <Input
            id={f.id}
            value={values[f.id] ?? ""}
            onChange={(e) => updateValue(f.id, e.target.value)}
            placeholder={ph}
          />
          <div className="space-y-1 pt-1">
            <Label className="text-xs">الخط</Label>
            <ArabicFontCombobox
              value={getFieldFontKey(f)}
              onChange={(v) =>
                setFontKeyOverrides((prev) => ({ ...prev, [f.id]: v }))
              }
            />
          </div>
          <div className="grid gap-2 pt-1 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">سمك الخط</Label>
              <Select
                value={String(getFieldFontWeight(f))}
                onValueChange={(v) =>
                  setFontWeightOverrides((prev) => ({
                    ...prev,
                    [f.id]: Number(v),
                  }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_WEIGHT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">نمط النص</Label>
              <Select
                value={getFieldFontStyle(f)}
                onValueChange={(v) =>
                  setFontStyleOverrides((prev) => ({
                    ...prev,
                    [f.id]: v === "italic" ? "italic" : "normal",
                  }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_STYLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">التسطير</Label>
              <Select
                value={getFieldTextDecoration(f)}
                onValueChange={(v) =>
                  setTextDecorationOverrides((prev) => ({
                    ...prev,
                    [f.id]: v === "underline" ? "underline" : "none",
                  }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEXT_DECORATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      );
    }
    if (f.type === "select") {
      const v = values[f.id] ?? "";
      const safe =
        f.options.includes(v) ? v : (f.options[0] ?? "");
      return (
        <>
          <div id={f.id}>
            <Select value={safe} onValueChange={(nv) => updateValue(f.id, nv)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={ph} />
              </SelectTrigger>
            <SelectContent>
              {f.options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 pt-1">
            <Label className="text-xs">الخط</Label>
            <ArabicFontCombobox
              value={getFieldFontKey(f)}
              onChange={(v) =>
                setFontKeyOverrides((prev) => ({ ...prev, [f.id]: v }))
              }
            />
          </div>
          <div className="grid gap-2 pt-1 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">سمك الخط</Label>
              <Select
                value={String(getFieldFontWeight(f))}
                onValueChange={(nv) =>
                  setFontWeightOverrides((prev) => ({
                    ...prev,
                    [f.id]: Number(nv),
                  }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_WEIGHT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">نمط النص</Label>
              <Select
                value={getFieldFontStyle(f)}
                onValueChange={(nv) =>
                  setFontStyleOverrides((prev) => ({
                    ...prev,
                    [f.id]: nv === "italic" ? "italic" : "normal",
                  }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_STYLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">التسطير</Label>
              <Select
                value={getFieldTextDecoration(f)}
                onValueChange={(nv) =>
                  setTextDecorationOverrides((prev) => ({
                    ...prev,
                    [f.id]: nv === "underline" ? "underline" : "none",
                  }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEXT_DECORATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      );
    }
    if (f.type === "link") {
      return (
        <Input
          id={f.id}
          type="url"
          inputMode="url"
          value={values[f.id] ?? ""}
          onChange={(e) => updateValue(f.id, e.target.value)}
          placeholder={ph}
        />
      );
    }
    return (
      <Input
        id={f.id}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) {
            updateValue(f.id, "");
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              updateValue(f.id, reader.result);
            }
          };
          reader.readAsDataURL(file);
        }}
      />
    );
  }

  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-2 lg:items-start">
      <div className="order-2 min-w-0 space-y-4 lg:order-1">
        <p className="text-muted-foreground text-sm leading-relaxed">
          اسحب النصوص والصور على المعاينة لتغيير موضعها. يمكنك إضافة نصوص حرة إضافية.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={addExtraTextLayer}>
            + إضافة نص حر
          </Button>
        </div>

        {fields.length === 0 && extraLayers.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            لا توجد حقول جاهزة من القالب. أضف «نص حر» وحرّكه على الصورة، أو اطلب من
            المسؤول ضبط الحقول من لوحة الإدارة.
          </p>
        ) : null}

        {formSections.map((section, si) => (
          <div
            key={si}
            className={
              section.title
                ? "border-border bg-muted/15 space-y-4 rounded-lg border p-4"
                : "space-y-4"
            }
          >
            {section.title ? (
              <h3 className="text-foreground text-sm font-semibold">{section.title}</h3>
            ) : null}
            {section.fields.map((f) => (
              <div key={f.id} className="space-y-2">
                <Label htmlFor={f.id}>{f.label}</Label>
                {renderFieldControls(f)}
                {f.type !== "link" && (
                  <p className="text-muted-foreground text-xs">
                    <GripVertical className="me-1 inline size-3.5 align-text-bottom opacity-70" />
                    اسحب الطبقة على المعاينة لتحريك موضع {f.label}.
                  </p>
                )}
                {f.type === "link" && (
                  <p className="text-muted-foreground text-xs">
                    <GripVertical className="me-1 inline size-3.5 align-text-bottom opacity-70" />
                    اسحب رمز QR على المعاينة. يُكمَّل الرابط تلقائياً بـ https إن لزم.
                  </p>
                )}
              </div>
            ))}
          </div>
        ))}

        {extraLayers.map((layer) => (
          <div
            key={layer.id}
            className="border-border/80 space-y-2 rounded-lg border p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`extra-${layer.id}`}>نص حر</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive h-7 text-xs"
                onClick={() => removeExtraLayer(layer.id)}
              >
                حذف
              </Button>
            </div>
            <Input
              id={`extra-${layer.id}`}
              value={layer.text}
              onChange={(e) => updateExtraLayer(layer.id, { text: e.target.value })}
            />
            <div className="space-y-1">
              <Label className="text-xs">الخط</Label>
              <ArabicFontCombobox
                value={layer.fontKey}
                onChange={(v) => updateExtraLayer(layer.id, { fontKey: v })}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">سمك الخط</Label>
                <Select
                  value={String(layer.fontWeight)}
                  onValueChange={(v) =>
                    updateExtraLayer(layer.id, { fontWeight: Number(v) })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_WEIGHT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">نمط النص</Label>
                <Select
                  value={layer.fontStyle}
                  onValueChange={(v) =>
                    updateExtraLayer(layer.id, {
                      fontStyle: v === "italic" ? "italic" : "normal",
                    })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_STYLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">التسطير</Label>
                <Select
                  value={layer.textDecoration}
                  onValueChange={(v) =>
                    updateExtraLayer(layer.id, {
                      textDecoration: v === "underline" ? "underline" : "none",
                    })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEXT_DECORATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">حجم الخط</Label>
                <Input
                  type="number"
                  min={10}
                  max={72}
                  className="mt-1"
                  value={layer.fontSize}
                  onChange={(e) =>
                    updateExtraLayer(layer.id, {
                      fontSize: Number(e.target.value) || 20,
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">اللون</Label>
                <Input
                  type="color"
                  className="mt-1 h-9 cursor-pointer p-1"
                  value={layer.color}
                  onChange={(e) =>
                    updateExtraLayer(layer.id, { color: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex flex-wrap gap-2 pt-4">
          {!purchased ? (
            <p className="text-muted-foreground text-sm">
              <Link
                href={`/templates/${templateId}`}
                className="text-primary font-medium underline"
              >
                اشترِ القالب
              </Link>{" "}
              لتفعيل تصدير PNG بدون علامة مائية على المعاينة.
            </p>
          ) : (
            <Button
              type="button"
              disabled={exporting}
              onClick={() => void exportPng()}
            >
              {exporting ? "جاري التصدير…" : "تصدير PNG"}
            </Button>
          )}
        </div>
      </div>
      <div className="order-1 min-w-0 lg:order-2">
        <p className="text-muted-foreground mb-2 text-xs">المعاينة — اسحب الطبقات</p>
        <div className="relative mx-auto w-full max-w-full min-w-0 overflow-hidden rounded-xl border shadow-sm">
          <div
            ref={captureRef}
            className="relative w-full"
            style={{
              backgroundColor: "#f4f4f5",
              color: "#0a0a0a",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              className="block h-auto w-full max-w-full object-contain"
              crossOrigin="anonymous"
              draggable={false}
            />
            {fields.map((f) => {
              if (f.type === "text" || f.type === "select") {
                const v = values[f.id] ?? "";
                const display =
                  f.type === "select"
                    ? (f.options.includes(v) ? v : (f.options[0] ?? ""))
                    : v;
                const pos = getFieldPosition(f);
                const anchor = f.anchor ?? "center";
                const justify =
                  anchor === "start"
                    ? "flex-start"
                    : anchor === "end"
                      ? "flex-end"
                      : "center";
                return (
                  <div
                    key={f.id}
                    role="button"
                    tabIndex={0}
                    className="absolute flex cursor-grab touch-none px-2 active:cursor-grabbing"
                    style={{
                      left: `${pos.x * 100}%`,
                      top: `${pos.y * 100}%`,
                      transform: "translate(-50%, -50%)",
                      width: "90%",
                      justifyContent: justify,
                    }}
                    onPointerDown={(e) => beginDrag(e, "field", f.id)}
                  >
                    <span
                      className="rounded px-1"
                      style={{
                        fontFamily: fontFamilyForKey(getFieldFontKey(f)),
                        fontSize: scaledFont(f.fontSize ?? 22),
                        fontWeight: getFieldFontWeight(f),
                        fontStyle: getFieldFontStyle(f),
                        textDecoration:
                          getFieldTextDecoration(f) === "underline"
                            ? "underline"
                            : "none",
                        color: f.color ?? "#1a1a1a",
                        textAlign:
                          anchor === "center"
                            ? "center"
                            : anchor === "end"
                              ? "left"
                              : "right",
                        wordBreak: "break-word",
                      }}
                    >
                      {display || "…"}
                    </span>
                  </div>
                );
              }
              if (f.type === "link") {
                const pos = getFieldPosition(f);
                const w = `${Math.min(0.55, f.qrSize ?? 0.14) * 100}%`;
                const url = values[f.id] ?? "";
                return (
                  <div
                    key={f.id}
                    role="button"
                    tabIndex={0}
                    className="absolute flex cursor-grab touch-none items-center justify-center bg-white/90 active:cursor-grabbing"
                    style={{
                      left: `${pos.x * 100}%`,
                      top: `${pos.y * 100}%`,
                      transform: "translate(-50%, -50%)",
                      width: w,
                      aspectRatio: "1",
                    }}
                    onPointerDown={(e) => beginDrag(e, "field", f.id)}
                  >
                    <QrCanvasImage url={url} className="size-full object-contain p-0.5" />
                  </div>
                );
              }
              const src = values[f.id];
              if (!src) return null;
              const pos = getFieldPosition(f);
              return (
                <div
                  key={f.id}
                  role="button"
                  tabIndex={0}
                  className="absolute cursor-grab touch-none overflow-hidden rounded active:cursor-grabbing"
                  style={{
                    left: `${pos.x * 100}%`,
                    top: `${pos.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                    width: `${f.width * 100}%`,
                    height: `${f.height * 100}%`,
                  }}
                  onPointerDown={(e) => beginDrag(e, "field", f.id)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="size-full object-cover" draggable={false} />
                </div>
              );
            })}
            {extraLayers.map((layer) => (
              <div
                key={layer.id}
                role="button"
                tabIndex={0}
                className="absolute flex cursor-grab touch-none justify-center px-2 active:cursor-grabbing"
                style={{
                  left: `${layer.x * 100}%`,
                  top: `${layer.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                  width: "90%",
                }}
                onPointerDown={(e) => beginDrag(e, "extra", layer.id)}
              >
                <span
                  className="rounded px-1"
                  style={{
                    fontFamily: fontFamilyForKey(layer.fontKey),
                    fontSize: scaledFont(layer.fontSize),
                    fontWeight: normalizeFontWeight(layer.fontWeight),
                    fontStyle: layer.fontStyle === "italic" ? "italic" : "normal",
                    textDecoration:
                      layer.textDecoration === "underline" ? "underline" : "none",
                    color: layer.color,
                    textAlign: "center",
                    wordBreak: "break-word",
                  }}
                >
                  {layer.text}
                </span>
              </div>
            ))}
          </div>
          {!purchased && (
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              aria-hidden
            >
              <span className="text-foreground/25 rotate-[-20deg] text-2xl font-bold tracking-widest">
                معاينة
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
