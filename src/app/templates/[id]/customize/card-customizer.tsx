"use client";

import { WatermarkOverlay } from "@/components/templates/watermark-overlay";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DEFAULT_ARABIC_FONT_KEY,
  fontFamilyForKey,
  getFontEntryByKey,
} from "@/lib/arabic-fonts";
import { groupFieldsForForm } from "@/lib/template-fields-form-order";
import { exportCardVideo, validateVoiceMeta } from "@/lib/export-card-video";
import { captureCardToCanvas, captureCardToPng, fieldEditChromeClass } from "@/lib/capture-card-image";
import { ensureGoogleFontLoaded } from "@/lib/load-google-font";
import {
  readLocalDraft,
  writeLocalDraft,
} from "@/lib/local-design-draft";
import {
  scaleFontSizeToContainer,
  useCardPreviewContainerWidth,
} from "@/lib/card-preview-font-scale";
import { isTextLikeField } from "@/lib/template-fields-config";
import { cn } from "@/lib/utils";
import { mergeTextStyleWithPreview, resolveFieldTextStyle } from "@/lib/resolve-field-text-style";
import type { EditorState, FieldTextStyle, VoiceMeta } from "@/types/editor-state";
import { isVoiceSelectionValid } from "@/types/editor-state";
import type {
  TemplateField,
  TemplateFieldsConfig,
} from "@/types/template-fields";
import {
  Cloud,
  Download,
  HardDrive,
  ImageIcon,
  Link2,
  Loader2,
  RotateCcw,
  Save,
  Type,
  Video,
  Volume2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { VoiceTrimPanel } from "./voice-trim-panel";
import { FieldTextStylePanel } from "./field-text-style-panel";

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

interface CardCustomizerProps {
  templateId: string;
  templateTitle: string;
  previewUrl: string;
  fieldsJson: TemplateFieldsConfig;
  purchased: boolean;
  userId: string | null;
  initialDesignId?: string | null;
}

export function CardCustomizer({
  templateId,
  templateTitle,
  previewUrl,
  fieldsJson,
  purchased,
  userId,
  initialDesignId,
}: CardCustomizerProps) {
  const fields = useMemo(() => fieldsJson.fields ?? [], [fieldsJson]);
  const groups = useMemo(() => fieldsJson.groups ?? [], [fieldsJson]);
  const formSections = useMemo(
    () => groupFieldsForForm(fields, groups),
    [fields, groups],
  );

  const [values, setValues] = useState<Record<string, string>>(() =>
    buildInitialValues(fields),
  );
  const [offsets, setOffsets] = useState<Record<string, { dx: number; dy: number }>>({});
  const [fieldStyles, setFieldStyles] = useState<Record<string, FieldTextStyle>>({});
  const [voiceMeta, setVoiceMeta] = useState<VoiceMeta | null>(null);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [designId, setDesignId] = useState<string | null>(initialDesignId ?? null);
  const [designTitle, setDesignTitle] = useState(templateTitle);
  const [zoom, setZoom] = useState(1);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [stylePreview, setStylePreview] = useState<Partial<FieldTextStyle> | null>(null);
  const [isDraggingField, setIsDraggingField] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "local">("idle");
  const [exporting, setExporting] = useState<"png" | "video" | null>(null);
  const [isExportingCapture, setIsExportingCapture] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const captureRef = useRef<HTMLDivElement>(null);
  const fieldRowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const previewContainerWidth = useCardPreviewContainerWidth(captureRef, [previewUrl, zoom]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyRef = useRef<EditorState[]>([]);

  const pushHistory = useCallback((state: EditorState) => {
    historyRef.current = [...historyRef.current.slice(-19), state];
  }, []);

  const editorState = useMemo(
    (): EditorState => ({
      values,
      offsets,
      fieldStyles,
      voice: voiceMeta,
    }),
    [values, offsets, fieldStyles, voiceMeta],
  );

  useEffect(() => {
    for (const f of fields) {
      if (isTextLikeField(f)) {
        const style = resolveFieldTextStyle(f, fieldStyles);
        ensureGoogleFontLoaded(
          getFontEntryByKey(style?.fontKey ?? f.fontKey ?? DEFAULT_ARABIC_FONT_KEY)
            .googleFamily,
        );
      }
    }
  }, [fields, fieldStyles]);

  useEffect(() => {
    const previewKey =
      stylePreview?.fontKey ??
      (activeFieldId ? fieldStyles[activeFieldId]?.fontKey : undefined);
    if (previewKey) {
      ensureGoogleFontLoaded(getFontEntryByKey(previewKey).googleFamily);
    }
  }, [stylePreview, activeFieldId, fieldStyles]);

  useEffect(() => {
    setStylePreview(null);
    if (!activeFieldId) return;
    const row = fieldRowRefs.current[activeFieldId];
    row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeFieldId]);

  useEffect(() => {
    async function hydrate() {
      if (initialDesignId && userId) {
        try {
          const res = await fetch(`/api/v1/designs/${initialDesignId}`);
          const json = (await res.json()) as {
            success: boolean;
            data?: {
              id: string;
              title: string;
              editorState: EditorState;
              voiceUrl?: string | null;
            };
          };
          if (json.success && json.data) {
            setDesignId(json.data.id);
            setDesignTitle(json.data.title);
            setValues({ ...buildInitialValues(fields), ...json.data.editorState.values });
            if (json.data.editorState.offsets) {
              setOffsets(json.data.editorState.offsets);
            }
            if (json.data.editorState.fieldStyles) {
              setFieldStyles(json.data.editorState.fieldStyles);
            }
            if (json.data.editorState.voice) {
              setVoiceMeta(json.data.editorState.voice);
            }
            if (json.data.voiceUrl) {
              const vr = await fetch(json.data.voiceUrl);
              const blob = await vr.blob();
              setVoiceBlob(blob);
            }
            setLoaded(true);
            return;
          }
        } catch {
          /* fallback local */
        }
      }

      const local = readLocalDraft(templateId);
      if (local) {
        setValues((prev) => ({ ...buildInitialValues(fields), ...local.editorState.values }));
        if (local.editorState.offsets) setOffsets(local.editorState.offsets);
        if (local.editorState.fieldStyles) setFieldStyles(local.editorState.fieldStyles);
        if (local.editorState.voice) setVoiceMeta(local.editorState.voice);
        if (local.voiceDataUrl) {
          const res = await fetch(local.voiceDataUrl);
          setVoiceBlob(await res.blob());
        }
        setDesignTitle(local.title);
      }
      setLoaded(true);
    }
    void hydrate();
  }, [fields, initialDesignId, templateId, userId]);

  const persist = useCallback(async () => {
    if (!loaded) return;

    const draft = {
      templateId,
      title: designTitle,
      editorState,
      voiceDataUrl: voiceBlob
        ? await blobToDataUrl(voiceBlob)
        : null,
      savedAt: new Date().toISOString(),
    };

    if (userId) {
      setSaveStatus("saving");
      try {
        let voiceBase64: string | undefined;
        if (voiceBlob && voiceBlob.size < 800_000) {
          voiceBase64 = await blobToDataUrl(voiceBlob);
        }
        const res = await fetch("/api/v1/designs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId,
            designId: designId ?? undefined,
            title: designTitle,
            editorState,
            voiceBase64,
          }),
        });
        const json = (await res.json()) as {
          success: boolean;
          data?: { id: string };
          error?: { message: string };
        };
        if (json.success && json.data) {
          setDesignId(json.data.id);
          setSaveStatus("saved");
          writeLocalDraft(draft);
          return;
        }
        writeLocalDraft(draft);
        setSaveStatus("local");
      } catch {
        writeLocalDraft(draft);
        setSaveStatus("local");
      }
    } else {
      writeLocalDraft(draft);
      setSaveStatus("local");
    }
  }, [designId, designTitle, editorState, loaded, templateId, userId, voiceBlob]);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void persist();
    }, 2500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [editorState, designTitle, loaded, persist]);

  const updateValue = useCallback((id: string, v: string) => {
    setValues((prev) => {
      pushHistory({ values: prev, offsets, fieldStyles, voice: voiceMeta });
      return { ...prev, [id]: v };
    });
  }, [offsets, fieldStyles, pushHistory, voiceMeta]);

  const updateFieldStyle = useCallback((id: string, patch: FieldTextStyle) => {
    pushHistory({ values, offsets, fieldStyles, voice: voiceMeta });
    setFieldStyles((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  }, [values, offsets, fieldStyles, voiceMeta, pushHistory]);

  const scaledFont = useCallback(
    (storedPx: number) =>
      scaleFontSizeToContainer(storedPx, previewContainerWidth),
    [previewContainerWidth],
  );

  function fieldPosition(f: TemplateField) {
    const off = offsets[f.id];
    return {
      x: f.x + (off?.dx ?? 0),
      y: f.y + (off?.dy ?? 0),
    };
  }

  function displayTextStyle(f: TemplateField) {
    const base = resolveFieldTextStyle(f, fieldStyles);
    if (!base) return null;
    if (f.id === activeFieldId && stylePreview) {
      return mergeTextStyleWithPreview(base, stylePreview);
    }
    return base;
  }

  const DRAG_THRESHOLD_PX = 5;

  function onFieldPointerDown(fieldId: string, e: React.PointerEvent) {
    if (e.button !== 0) return;
    setActiveFieldId(fieldId);
    if (!purchased) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startOff = offsets[fieldId] ?? { dx: 0, dy: 0 };
    const el = captureRef.current;
    if (!el) return;

    let dragging = false;

    function onMove(ev: PointerEvent) {
      if (!dragging) {
        const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
        if (dist < DRAG_THRESHOLD_PX) return;
        dragging = true;
        setIsDraggingField(true);
      }
      const rect = el!.getBoundingClientRect();
      const dx = (ev.clientX - startX) / rect.width;
      const dy = (ev.clientY - startY) / rect.height;
      setOffsets((prev) => ({
        ...prev,
        [fieldId]: {
          dx: Math.max(-0.4, Math.min(0.4, startOff.dx + dx)),
          dy: Math.max(-0.4, Math.min(0.4, startOff.dy + dy)),
        },
      }));
    }

    function onUp() {
      setIsDraggingField(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function undo() {
    const prev = historyRef.current.pop();
    if (!prev) return;
    setValues(prev.values);
    if (prev.offsets) setOffsets(prev.offsets);
    if (prev.fieldStyles) setFieldStyles(prev.fieldStyles);
    if (prev.voice !== undefined) setVoiceMeta(prev.voice ?? null);
  }

  async function runCleanCapture<T>(work: (node: HTMLElement) => Promise<T>): Promise<T> {
    if (!captureRef.current) throw new Error("NO_CAPTURE");
    setStylePreview(null);
    setIsExportingCapture(true);
    await document.fonts.ready;
    await new Promise<void>((r) => {
      requestAnimationFrame(() => requestAnimationFrame(() => r()));
    });
    try {
      return await work(captureRef.current);
    } finally {
      setIsExportingCapture(false);
    }
  }

  async function exportPng() {
    if (!purchased || !captureRef.current) {
      toast.error("اشترِ القالب لتصدير PNG بدون علامة مائية");
      return;
    }
    setExporting("png");
    try {
      const url = await runCleanCapture((node) => captureCardToPng(node));
      const a = document.createElement("a");
      a.href = url;
      a.download = `card-${templateId}.png`;
      a.click();
      toast.success("تم تصدير PNG");
    } catch {
      toast.error("فشل التصدير");
    } finally {
      setExporting(null);
    }
  }

  async function exportVideo() {
    if (!purchased) {
      toast.error("اشترِ القالب لتصدير الفيديو");
      return;
    }
    if (!voiceBlob || !voiceMeta) {
      toast.error("أضف صوتاً أولاً");
      return;
    }
    const err = validateVoiceMeta(voiceMeta);
    if (err) {
      toast.error(err);
      return;
    }
    if (!captureRef.current) return;

    setExporting("video");
    try {
      const canvas = await runCleanCapture((node) => captureCardToCanvas(node));
      const blob = await exportCardVideo({
        canvas,
        audioBlob: voiceBlob,
        trimStart: voiceMeta.trimStart,
        trimEnd: voiceMeta.trimEnd,
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `card-${templateId}.webm`;
      a.click();
      toast.success("تم تصدير الفيديو");
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      if (code === "RECORD_EMPTY" || code === "CANVAS_EMPTY" || code === "AUDIO_EMPTY") {
        toast.error("فشل التصدير — الصورة أو الصوت فارغ");
      } else if (code === "VOICE_DURATION_INVALID") {
        toast.error("اضبط مقطع الصوت بين 3 و15 ثانية");
      } else {
        toast.error("فشل تصدير الفيديو — جرّب متصفح Chrome");
      }
    } finally {
      setExporting(null);
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
      const safe = f.options.includes(v) ? v : (f.options[0] ?? "");
      return (
        <Select value={safe} onValueChange={(nv) => updateValue(f.id, nv)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={ph} />
          </SelectTrigger>
          <SelectContent
            position="popper"
            side="bottom"
            align="start"
            sideOffset={4}
            className="z-[100] max-h-60 min-w-[var(--radix-select-trigger-width)]"
          >
            {f.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

  const saveLabel =
    saveStatus === "saving"
      ? "جاري الحفظ…"
      : saveStatus === "saved"
        ? "محفوظ في حسابك"
        : saveStatus === "local"
          ? userId
            ? "محفوظ محلياً"
            : "محفوظ على الجهاز"
          : "حفظ تلقائي";

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-0 rounded-2xl border border-border/60 bg-background shadow-sm">
      {/* شريط أدوات */}
      <div className="border-border/60 bg-muted/30 flex flex-wrap items-center gap-2 border-b px-3 py-2 sm:px-4">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" onClick={undo}>
                <RotateCcw className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="">تراجع</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              >
                <ZoomOut className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="">تصغير</TooltipContent>
          </Tooltip>
          <span className="text-muted-foreground w-10 text-center text-xs tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
              >
                <ZoomIn className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="">تكبير</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="hidden h-6 sm:block" />

        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          {saveStatus === "saving" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : userId && saveStatus === "saved" ? (
            <Cloud className="size-3.5 text-emerald-600" />
          ) : (
            <HardDrive className="size-3.5" />
          )}
          <span>{saveLabel}</span>
        </div>

        <div className="ms-auto flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!!exporting}
            onClick={() => void persist()}
          >
            <Save className="size-4" />
            حفظ
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!!exporting || !purchased}
            onClick={() => void exportPng()}
          >
            {exporting === "png" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            PNG
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            disabled={
              !!exporting ||
              !purchased ||
              !voiceBlob ||
              !voiceMeta ||
              !isVoiceSelectionValid(voiceMeta)
            }
            onClick={() => void exportVideo()}
          >
            {exporting === "video" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Video className="size-4" />
            )}
            فيديو
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,360px)_1fr]">
        {/* لوحة جانبية — تمرير مستقل */}
        <aside className="border-border/60 bg-muted/10 flex min-h-0 flex-col border-b lg:max-h-[calc(100dvh-9rem)] lg:border-b-0 lg:border-e">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <Tabs defaultValue="content" className="p-4">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="content" className="flex-1 gap-1.5">
                <Type className="size-3.5" />
                المحتوى
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex-1 gap-1.5">
                <Volume2 className="size-3.5" />
                الصوت
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="design-title">اسم التصميم</Label>
                <Input
                  id="design-title"
                  value={designTitle}
                  onChange={(e) => setDesignTitle(e.target.value)}
                  placeholder="تصميمي"
                />
              </div>

              {!purchased && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                  <Link href={`/templates/${templateId}`} className="font-medium underline">
                    اشترِ القالب
                  </Link>{" "}
                  لتفعيل التصدير وتحريك العناصر. تنسيق الخط متاح للجميع.
                </p>
              )}

              {fields.length === 0 ? (
                <p className="text-muted-foreground text-sm">لا حقول في هذا القالب.</p>
              ) : (
                formSections.map((section, si) => (
                  <div
                    key={si}
                    className={
                      section.title
                        ? "border-border space-y-3 rounded-lg border bg-background p-3"
                        : "space-y-3"
                    }
                  >
                    {section.title && (
                      <h3 className="text-sm font-semibold">{section.title}</h3>
                    )}
                    {section.fields.map((f) => (
                      <div
                        key={f.id}
                        ref={(el) => {
                          fieldRowRefs.current[f.id] = el;
                        }}
                        className={cn(
                          "space-y-2 rounded-md p-2 transition-colors",
                          activeFieldId === f.id && "bg-primary/10 ring-primary/30 ring-1",
                        )}
                        onClick={() => setActiveFieldId(f.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") setActiveFieldId(f.id);
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <Label htmlFor={f.id} className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold">
                          {f.type === "image" && <ImageIcon className="size-3" />}
                          {f.type === "link" && <Link2 className="size-3" />}
                          {f.label}
                        </Label>
                        <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                          {renderFieldControls(f)}
                        </div>
                        {activeFieldId === f.id && isTextLikeField(f) && (
                          <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                            <FieldTextStylePanel
                              compact
                              field={f}
                              fieldStyles={fieldStyles}
                              onChange={updateFieldStyle}
                              onStylePreview={setStylePreview}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="voice" className="">
              <VoiceTrimPanel
                voiceMeta={voiceMeta}
                voiceBlob={voiceBlob}
                disabled={!purchased}
                onChange={(meta, blob) => {
                  pushHistory(editorState);
                  setVoiceMeta(meta);
                  setVoiceBlob(blob);
                }}
              />
            </TabsContent>
          </Tabs>
          </div>
        </aside>

        {/* معاينة ثابتة أثناء التمرير */}
        <div className="bg-muted/20 flex min-h-[min(420px,50dvh)] flex-col lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:min-h-0 lg:self-start">
          <div className="flex flex-1 flex-col overflow-auto p-4 sm:p-6">
          <p className="text-muted-foreground mb-3 shrink-0 text-xs">
            {purchased
              ? "انقر لتحديد — اسحب لتحريك — الصورة ثابتة أثناء التعديل"
              : "انقر على نص لتعديل الخط — علامة مائية حتى الشراء"}
          </p>
          <div
            className="relative mx-auto w-full max-w-2xl transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
          >
            <div className="relative overflow-hidden rounded-xl border shadow-md">
              <div
                ref={captureRef}
                className="relative w-full bg-[#f4f4f5]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt=""
                  className="block h-auto w-full object-contain"
                  crossOrigin="anonymous"
                  draggable={false}
                />
                {fields.map((f) => {
                  const pos = fieldPosition(f);
                  if (f.type === "text" || f.type === "select") {
                    const v = values[f.id] ?? "";
                    const display =
                      f.type === "select"
                        ? (f.options.includes(v) ? v : (f.options[0] ?? ""))
                        : v;
                    const style = displayTextStyle(f)!;
                    const anchor = style.anchor;
                    const justify =
                      anchor === "start"
                        ? "flex-start"
                        : anchor === "end"
                          ? "flex-end"
                          : "center";
                    return (
                      <div
                        key={f.id}
                        data-card-text-field=""
                        className={cn(
                          "absolute flex select-none",
                          purchased && "cursor-grab touch-none",
                          isDraggingField && activeFieldId === f.id && "cursor-grabbing",
                          fieldEditChromeClass(f.id, activeFieldId, isExportingCapture),
                        )}
                        style={{
                          left: `${pos.x * 100}%`,
                          top: `${pos.y * 100}%`,
                          transform: "translate(-50%, -50%)",
                          width: "fit-content",
                          maxWidth: "92%",
                          justifyContent: justify,
                        }}
                        onPointerDown={(e) => onFieldPointerDown(f.id, e)}
                      >
                        <span
                          style={{
                            fontFamily: fontFamilyForKey(style.fontKey),
                            fontSize: scaledFont(style.fontSize),
                            fontWeight: style.fontWeight,
                            fontStyle: style.fontStyle,
                            textDecoration:
                              style.textDecoration === "underline"
                                ? "underline"
                                : "none",
                            color: style.color,
                            textAlign:
                              anchor === "center"
                                ? "center"
                                : anchor === "end"
                                  ? "left"
                                  : "right",
                            display: "inline-block",
                            width: "max-content",
                            maxWidth: "100%",
                            wordBreak: "normal",
                            lineHeight: 1.15,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {display || "…"}
                        </span>
                      </div>
                    );
                  }
                  if (f.type === "link") {
                    const w = `${Math.min(0.55, f.qrSize ?? 0.14) * 100}%`;
                    const url = values[f.id] ?? "";
                    return (
                      <div
                        key={f.id}
                        data-card-qr-field=""
                        className={cn(
                          "absolute flex items-center justify-center bg-white/90",
                          purchased && "cursor-grab touch-none",
                          fieldEditChromeClass(f.id, activeFieldId, isExportingCapture),
                        )}
                        style={{
                          left: `${pos.x * 100}%`,
                          top: `${pos.y * 100}%`,
                          transform: "translate(-50%, -50%)",
                          width: w,
                          aspectRatio: "1",
                        }}
                        onPointerDown={(e) => onFieldPointerDown(f.id, e)}
                      >
                        <QrCanvasImage url={url} className="size-full object-contain p-0.5" />
                      </div>
                    );
                  }
                  const src = values[f.id];
                  if (!src) return null;
                  return (
                    <div
                      key={f.id}
                      className={cn(
                        "absolute overflow-hidden rounded",
                        purchased && "cursor-grab touch-none",
                        isDraggingField && activeFieldId === f.id && "cursor-grabbing",
                        fieldEditChromeClass(f.id, activeFieldId, isExportingCapture),
                      )}
                      style={{
                        left: `${pos.x * 100}%`,
                        top: `${pos.y * 100}%`,
                        transform: "translate(-50%, -50%)",
                        width: `${f.width * 100}%`,
                        height: `${f.height * 100}%`,
                      }}
                      onPointerDown={(e) => onFieldPointerDown(f.id, e)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="size-full object-cover" draggable={false} />
                    </div>
                  );
                })}
              </div>
              {!purchased && <WatermarkOverlay />}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("read failed"));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
