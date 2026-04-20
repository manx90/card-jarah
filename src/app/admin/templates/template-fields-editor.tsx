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
import { ArabicFontCombobox } from "@/components/fonts/arabic-font-combobox";
import {
  DEFAULT_ARABIC_FONT_KEY,
  fontFamilyForKey,
  getFontEntryByKey,
} from "@/lib/arabic-fonts";
import {
  buildTemplateFieldsConfig,
  isTextLikeField,
  parseTemplateFieldsConfig,
} from "@/lib/template-fields-config";
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
  TemplateFieldGroup,
  TemplateFieldImage,
  TemplateFieldLink,
  TemplateFieldSelect,
  TemplateFieldText,
} from "@/types/template-fields";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  scaleFontSizeToContainer,
  useCardPreviewContainerWidth,
} from "@/lib/card-preview-font-scale";
import { ensureGoogleFontLoaded } from "@/lib/load-google-font";

function clamp01(n: number): number {
  return Math.min(0.98, Math.max(0.02, n));
}

type FieldKind = TemplateField["type"];

export function TemplateFieldsEditor({
  defaultFieldsJson,
  previewFile,
}: {
  defaultFieldsJson: string;
  previewFile: File | null;
}) {
  const [fields, setFields] = useState<TemplateField[]>(() =>
    parseTemplateFieldsConfig(defaultFieldsJson).fields,
  );
  const [groups, setGroups] = useState<TemplateFieldGroup[]>(() =>
    parseTemplateFieldsConfig(defaultFieldsJson).groups,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  const previewUrl = useMemo(() => {
    if (!previewFile) return null;
    return URL.createObjectURL(previewFile);
  }, [previewFile]);

  const previewContainerWidth = useCardPreviewContainerWidth(captureRef, [
    previewFile,
    previewUrl,
  ]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    for (const f of fields) {
      if (isTextLikeField(f)) {
        ensureGoogleFontLoaded(getFontEntryByKey(f.fontKey).googleFamily);
      }
    }
  }, [fields]);

  const fieldsJsonValue = useMemo(
    () => JSON.stringify(buildTemplateFieldsConfig(fields, groups), null, 2),
    [fields, groups],
  );

  const selected = fields.find((f) => f.id === selectedId) ?? null;

  const updateField = useCallback((id: string, patch: Partial<TemplateField>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? ({ ...f, ...patch } as TemplateField) : f)),
    );
  }, []);

  function addField(kind: FieldKind) {
    const id = crypto.randomUUID();
    const base = {
      id,
      x: 0.5,
      y: 0.45 + fields.length * 0.04,
    };
    let next: TemplateField;
    if (kind === "text") {
      next = {
        ...base,
        type: "text",
        label: `نص ${fields.length + 1}`,
        anchor: "center",
        fontSize: 24,
        fontKey: DEFAULT_ARABIC_FONT_KEY,
        fontWeight: DEFAULT_FONT_WEIGHT,
        fontStyle: DEFAULT_FONT_STYLE,
        textDecoration: DEFAULT_TEXT_DECORATION,
      } satisfies TemplateFieldText;
    } else if (kind === "select") {
      next = {
        ...base,
        type: "select",
        label: `قائمة ${fields.length + 1}`,
        options: ["صباحاً", "مساءً", "ليلاً"],
        anchor: "center",
        fontSize: 24,
        fontKey: DEFAULT_ARABIC_FONT_KEY,
        fontWeight: DEFAULT_FONT_WEIGHT,
        fontStyle: DEFAULT_FONT_STYLE,
        textDecoration: DEFAULT_TEXT_DECORATION,
      } satisfies TemplateFieldSelect;
    } else if (kind === "link") {
      next = {
        ...base,
        type: "link",
        label: `موقع ${fields.length + 1}`,
        qrSize: 0.14,
      } satisfies TemplateFieldLink;
    } else {
      next = {
        ...base,
        type: "image",
        label: `صورة ${fields.length + 1}`,
        width: 0.2,
        height: 0.2,
      } satisfies TemplateFieldImage;
    }
    setFields((prev) => [...prev, next]);
    setSelectedId(id);
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }

  function addGroup() {
    const id = crypto.randomUUID();
    setGroups((prev) => [...prev, { id, title: `قسم ${prev.length + 1}` }]);
  }

  function removeGroup(groupId: string) {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setFields((prev) =>
      prev.map((f) =>
        f.groupId === groupId ? { ...f, groupId: undefined } : f,
      ),
    );
  }

  function beginDrag(e: React.PointerEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    const el = captureRef.current;
    if (!el) return;
    setSelectedId(id);

    const onMove = (ev: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = clamp01((ev.clientX - rect.left) / rect.width);
      const y = clamp01((ev.clientY - rect.top) / rect.height);
      updateField(id, { x, y });
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function previewLabel(f: TemplateField): string {
    if (f.type === "select") return f.options[0] ?? f.label;
    if (f.type === "link") return "QR";
    return f.label;
  }

  function insertSelectOption(fieldId: string, options: string[], index: number) {
    const next = [...options];
    next.splice(index, 0, "بند جديد");
    updateField(fieldId, { options: next });
  }

  function updateSelectOption(fieldId: string, options: string[], index: number, value: string) {
    const next = [...options];
    next[index] = value;
    updateField(fieldId, { options: next });
  }

  function removeSelectOption(fieldId: string, options: string[], index: number) {
    if (options.length <= 1) return;
    const next = options.filter((_, i) => i !== index);
    updateField(fieldId, { options: next.length ? next : ["خيار 1"] });
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="fieldsJson" value={fieldsJsonValue} readOnly />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => addField("text")}>
          <Plus className="size-4" />
          نص
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => addField("select")}>
          <Plus className="size-4" />
          قائمة
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => addField("link")}>
          <Plus className="size-4" />
          رابط + QR
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => addField("image")}>
          <Plus className="size-4" />
          صورة
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={addGroup}>
          قسم
        </Button>
        <span className="text-muted-foreground text-xs">
          اسحب العناصر على الصورة — المواضع نسبية (0–1).
        </span>
      </div>

      {groups.length > 0 && (
        <div className="space-y-2 rounded-lg border bg-muted/15 p-3">
          <p className="text-xs font-medium">الأقسام</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            اربط أي حقول (نص، قائمة، رابط، صورة) بنفس القسم من عمود «القسم» أدناه. يظهر
            للعميل القسم بعنوانه وكل حقوله معاً، ويعدّل كل حقل على حدة.
          </p>
          <ul className="space-y-2">
            {groups.map((g) => (
              <li key={g.id} className="flex flex-wrap items-end gap-2">
                <div className="min-w-[120px] flex-1 space-y-1">
                  <Label className="text-xs">عنوان القسم</Label>
                  <Input
                    value={g.title}
                    onChange={(e) =>
                      setGroups((prev) =>
                        prev.map((x) =>
                          x.id === g.id ? { ...x, title: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => removeGroup(g.id)}
                >
                  حذف القسم
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!previewFile || !previewUrl ? (
        <div className="bg-muted/50 text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
          اختر ملف «صورة المعاينة» أعلاه لعرض الصورة ووضع الحقول.
        </div>
      ) : (
        <div className="relative mx-auto w-full max-w-full overflow-hidden rounded-xl border bg-card shadow-sm">
          <div
            ref={captureRef}
            className="relative w-full touch-none"
            style={{ backgroundColor: "#f4f4f5" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              className="block h-auto w-full max-w-full object-contain"
              draggable={false}
            />
            {fields.map((f) => {
              const isSel = selectedId === f.id;
              if (f.type === "link") {
                const w = `${Math.min(0.5, f.qrSize ?? 0.14) * 100}%`;
                return (
                  <div
                    key={f.id}
                    role="button"
                    tabIndex={0}
                    className={`absolute flex touch-none items-center justify-center border-2 border-dashed bg-white/80 px-1 ${
                      isSel ? "z-10 border-primary" : "z-1 border-zinc-400"
                    } cursor-grab active:cursor-grabbing`}
                    style={{
                      left: `${f.x * 100}%`,
                      top: `${f.y * 100}%`,
                      transform: "translate(-50%, -50%)",
                      width: w,
                      aspectRatio: "1",
                    }}
                    onPointerDown={(e) => beginDrag(e, f.id)}
                    onClick={() => setSelectedId(f.id)}
                  >
                    <span className="text-muted-foreground text-[10px] font-medium">QR</span>
                    <GripVertical className="absolute end-0 top-1/2 size-4 -translate-y-1/2 opacity-50" />
                  </div>
                );
              }
              if (f.type === "image") {
                return (
                  <div
                    key={f.id}
                    role="button"
                    tabIndex={0}
                    className={`absolute flex touch-none items-center justify-center overflow-hidden rounded border-2 bg-white/40 ${
                      isSel ? "z-10 border-primary" : "z-1 border-zinc-400"
                    } cursor-grab active:cursor-grabbing`}
                    style={{
                      left: `${f.x * 100}%`,
                      top: `${f.y * 100}%`,
                      transform: "translate(-50%, -50%)",
                      width: `${f.width * 100}%`,
                      height: `${f.height * 100}%`,
                    }}
                    onPointerDown={(e) => beginDrag(e, f.id)}
                    onClick={() => setSelectedId(f.id)}
                  >
                    <span className="text-muted-foreground text-xs">{f.label}</span>
                  </div>
                );
              }
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
                  className={`absolute flex touch-none px-2 ${
                    isSel ? "z-10" : "z-1"
                  } cursor-grab active:cursor-grabbing`}
                  style={{
                    left: `${f.x * 100}%`,
                    top: `${f.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                    width: "88%",
                    justifyContent: justify,
                  }}
                  onPointerDown={(e) => beginDrag(e, f.id)}
                  onClick={() => setSelectedId(f.id)}
                >
                  <span
                    className="flex max-w-full items-center gap-1 rounded px-1.5 py-0.5"
                    style={{
                      fontFamily: fontFamilyForKey(f.fontKey),
                      fontSize: scaleFontSizeToContainer(
                        f.fontSize ?? 24,
                        previewContainerWidth,
                      ),
                      fontWeight: normalizeFontWeight(f.fontWeight),
                      fontStyle: f.fontStyle === "italic" ? "italic" : "normal",
                      textDecoration:
                        f.textDecoration === "underline" ? "underline" : "none",
                      color: f.color ?? "#1a1a1a",
                      backgroundColor: "transparent",
                      textAlign:
                        anchor === "center"
                          ? "center"
                          : anchor === "end"
                            ? "left"
                            : "right",
                      wordBreak: "break-word",
                    }}
                  >
                    <GripVertical className="size-4 shrink-0 opacity-60" aria-hidden />
                    {previewLabel(f)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {fields.length > 0 && (
        <ul className="space-y-3 rounded-lg border bg-muted/20 p-3">
          {fields.map((f) => (
            <li
              key={f.id}
              className={`flex flex-wrap items-end gap-2 rounded-md border p-2 ${
                selectedId === f.id ? "border-primary bg-primary/5" : "border-transparent"
              }`}
            >
              <div className="min-w-[100px] flex-1 space-y-1">
                <Label className="text-xs">
                  {f.type === "text" && "نص"}
                  {f.type === "select" && "قائمة"}
                  {f.type === "link" && "رابط"}
                  {f.type === "image" && "صورة"} — تسمية
                </Label>
                <Input
                  value={f.label}
                  onChange={(e) => updateField(f.id, { label: e.target.value })}
                  onFocus={() => setSelectedId(f.id)}
                />
              </div>
              <div className="min-w-[140px] space-y-1">
                <Label className="text-xs">القسم (نص + قائمة + … معاً)</Label>
                <Select
                  value={f.groupId ?? "__none__"}
                  onValueChange={(v) =>
                    updateField(f.id, {
                      groupId: v === "__none__" ? undefined : v,
                    })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">بدون قسم</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(f.type === "text" || f.type === "select" || f.type === "link") && (
                <div className="min-w-[180px] flex-1 space-y-1">
                  <Label className="text-xs">نص توضيحي (placeholder)</Label>
                  <Input
                    placeholder="يظهر داخل الحقل للمستخدم"
                    value={f.placeholder ?? ""}
                    onChange={(e) =>
                      updateField(f.id, {
                        placeholder: e.target.value.trim() || undefined,
                      })
                    }
                    onFocus={() => setSelectedId(f.id)}
                  />
                </div>
              )}
              {f.type === "select" && (
                <div className="w-full min-w-[200px] space-y-2 sm:flex-[2]">
                  <Label className="text-xs">خيارات القائمة</Label>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 w-full text-xs"
                      onClick={() => insertSelectOption(f.id, f.options, 0)}
                    >
                      + إضافة خيار في بداية القائمة
                    </Button>
                    {f.options.map((opt, idx) => (
                      <div key={`${f.id}-opt-${idx}`} className="flex flex-col gap-1.5">
                        <div className="flex gap-1">
                          <Input
                            value={opt}
                            onChange={(e) =>
                              updateSelectOption(f.id, f.options, idx, e.target.value)
                            }
                            onFocus={() => setSelectedId(f.id)}
                            placeholder={`خيار ${idx + 1}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            disabled={f.options.length <= 1}
                            onClick={() => removeSelectOption(f.id, f.options, idx)}
                            aria-label="حذف الخيار"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 w-full text-xs"
                          onClick={() => insertSelectOption(f.id, f.options, idx + 1)}
                        >
                          + إضافة خيار بين هذا والتالي
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive shrink-0"
                onClick={() => removeField(f.id)}
                aria-label="حذف"
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {selected && selected.type !== "link" && selected.type !== "image" && (
        <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">الخط العربي</Label>
            <ArabicFontCombobox
              value={selected.fontKey ?? DEFAULT_ARABIC_FONT_KEY}
              onChange={(v) => updateField(selected.id, { fontKey: v })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">سمك الخط</Label>
            <Select
              value={String(normalizeFontWeight(selected.fontWeight))}
              onValueChange={(v) =>
                updateField(selected.id, { fontWeight: Number(v) })
              }
            >
              <SelectTrigger>
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
              value={selected.fontStyle === "italic" ? "italic" : "normal"}
              onValueChange={(v) =>
                updateField(selected.id, {
                  fontStyle: v === "italic" ? "italic" : "normal",
                })
              }
            >
              <SelectTrigger>
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
          <div className="space-y-1">
            <Label className="text-xs">التسطير</Label>
            <Select
              value={
                selected.textDecoration === "underline" ? "underline" : "none"
              }
              onValueChange={(v) =>
                updateField(selected.id, {
                  textDecoration: v === "underline" ? "underline" : "none",
                })
              }
            >
              <SelectTrigger>
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
          <div className="space-y-1">
            <Label className="text-xs">حجم الخط</Label>
            <Input
              type="number"
              min={10}
              max={120}
              value={selected.fontSize ?? 24}
              onChange={(e) =>
                updateField(selected.id, {
                  fontSize: Number(e.target.value) || 24,
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">المحاذاة</Label>
            <Select
              value={selected.anchor ?? "center"}
              onValueChange={(v) =>
                updateField(selected.id, {
                  anchor: v as TemplateFieldText["anchor"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="start">يمين (RTL)</SelectItem>
                <SelectItem value="center">وسط</SelectItem>
                <SelectItem value="end">يسار (RTL)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">لون النص (اختياري)</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                className="h-9 w-14 cursor-pointer p-1"
                value={selected.color ?? "#1a1a1a"}
                onChange={(e) => updateField(selected.id, { color: e.target.value })}
              />
              <Input
                type="text"
                placeholder="#1a1a1a"
                value={selected.color ?? ""}
                onChange={(e) =>
                  updateField(selected.id, {
                    color: e.target.value.trim() || undefined,
                  })
                }
              />
            </div>
          </div>
        </div>
      )}

      {selected?.type === "link" && (
        <div className="rounded-lg border p-3">
          <Label className="text-xs">حجم QR (نسبة من عرض الصورة)</Label>
          <Input
            type="number"
            step={0.01}
            min={0.05}
            max={0.5}
            value={selected.qrSize ?? 0.14}
            onChange={(e) =>
              updateField(selected.id, {
                qrSize: Math.min(
                  0.5,
                  Math.max(0.05, Number(e.target.value) || 0.14),
                ),
              })
            }
          />
        </div>
      )}

      {selected?.type === "image" && (
        <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">عرض (نسبة)</Label>
            <Input
              type="number"
              step={0.01}
              min={0.05}
              max={1}
              value={selected.width}
              onChange={(e) =>
                updateField(selected.id, {
                  width: Math.min(1, Math.max(0.05, Number(e.target.value) || 0.2)),
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">ارتفاع (نسبة)</Label>
            <Input
              type="number"
              step={0.01}
              min={0.05}
              max={1}
              value={selected.height}
              onChange={(e) =>
                updateField(selected.id, {
                  height: Math.min(1, Math.max(0.05, Number(e.target.value) || 0.2)),
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
