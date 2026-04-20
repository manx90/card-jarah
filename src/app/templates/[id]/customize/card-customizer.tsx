"use client";

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
  normalizeFontWeight,
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

  const templateFontKey = useCallback((f: TemplateField) => {
    if (!isTextLikeField(f)) return DEFAULT_ARABIC_FONT_KEY;
    return f.fontKey ?? DEFAULT_ARABIC_FONT_KEY;
  }, []);

  const templateFontWeight = useCallback((f: TemplateField) => {
    if (!isTextLikeField(f)) return DEFAULT_FONT_WEIGHT;
    return normalizeFontWeight(f.fontWeight);
  }, []);

  const templateFontStyle = useCallback((f: TemplateField) => {
    if (!isTextLikeField(f)) return DEFAULT_FONT_STYLE;
    return f.fontStyle === "italic" ? "italic" : DEFAULT_FONT_STYLE;
  }, []);

  const templateTextDecoration = useCallback((f: TemplateField) => {
    if (!isTextLikeField(f)) return DEFAULT_TEXT_DECORATION;
    return f.textDecoration === "underline" ? "underline" : DEFAULT_TEXT_DECORATION;
  }, []);

  useEffect(() => {
    for (const f of fields) {
      if (isTextLikeField(f)) {
        ensureGoogleFontLoaded(
          getFontEntryByKey(f.fontKey ?? DEFAULT_ARABIC_FONT_KEY).googleFamily,
        );
      }
    }
  }, [fields]);

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
        <Input
          id={f.id}
          value={values[f.id] ?? ""}
          onChange={(e) => updateValue(f.id, e.target.value)}
          placeholder={ph}
        />
      );
    }
    if (f.type === "select") {
      const v = values[f.id] ?? "";
      const safe =
        f.options.includes(v) ? v : (f.options[0] ?? "");
      return (
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
          عدّل النصوص والخيارات والصور حسب حقول القالب فقط. الخط والحجم والمحاذاة
          يضبطها المسؤول من لوحة الإدارة.
        </p>

        {fields.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            لا توجد حقول في هذا القالب. اطلب من المسؤول إضافة حقول من لوحة الإدارة.
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
              </div>
            ))}
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
        <p className="text-muted-foreground mb-2 text-xs">المعاينة</p>
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
                const pos = { x: f.x, y: f.y };
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
                    className="pointer-events-none absolute flex px-2"
                    style={{
                      left: `${pos.x * 100}%`,
                      top: `${pos.y * 100}%`,
                      transform: "translate(-50%, -50%)",
                      width: "90%",
                      justifyContent: justify,
                    }}
                  >
                    <span
                      className="rounded px-1"
                      style={{
                        fontFamily: fontFamilyForKey(templateFontKey(f)),
                        fontSize: scaledFont(f.fontSize ?? 22),
                        fontWeight: templateFontWeight(f),
                        fontStyle: templateFontStyle(f),
                        textDecoration:
                          templateTextDecoration(f) === "underline"
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
                const pos = { x: f.x, y: f.y };
                const w = `${Math.min(0.55, f.qrSize ?? 0.14) * 100}%`;
                const url = values[f.id] ?? "";
                return (
                  <div
                    key={f.id}
                    className="pointer-events-none absolute flex items-center justify-center bg-white/90"
                    style={{
                      left: `${pos.x * 100}%`,
                      top: `${pos.y * 100}%`,
                      transform: "translate(-50%, -50%)",
                      width: w,
                      aspectRatio: "1",
                    }}
                  >
                    <QrCanvasImage url={url} className="size-full object-contain p-0.5" />
                  </div>
                );
              }
              const src = values[f.id];
              if (!src) return null;
              const pos = { x: f.x, y: f.y };
              return (
                <div
                  key={f.id}
                  className="pointer-events-none absolute overflow-hidden rounded"
                  style={{
                    left: `${pos.x * 100}%`,
                    top: `${pos.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                    width: `${f.width * 100}%`,
                    height: `${f.height * 100}%`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="size-full object-cover" draggable={false} />
                </div>
              );
            })}
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
