"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  VOICE_MAX_SEC,
  VOICE_MIN_SEC,
  isVoiceSelectionValid,
  type VoiceMeta,
} from "@/types/editor-state";
import { Mic, Pause, Play, Square, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface VoiceTrimPanelProps {
  voiceMeta: VoiceMeta | null;
  voiceBlob: Blob | null;
  onChange: (meta: VoiceMeta | null, blob: Blob | null) => void;
  disabled?: boolean;
}

function formatSec(s: number): string {
  return `${s.toFixed(1)} ث`;
}

export function VoiceTrimPanel({
  voiceMeta,
  voiceBlob,
  onChange,
  disabled,
}: VoiceTrimPanelProps) {
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [range, setRange] = useState<[number, number]>([0, VOICE_MAX_SEC]);
  const [duration, setDuration] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (voiceMeta) {
      setRange([voiceMeta.trimStart, voiceMeta.trimEnd]);
      setDuration(voiceMeta.duration);
    }
  }, [voiceMeta]);

  const selectionDuration = range[1] - range[0];
  const selectionValid = selectionDuration >= VOICE_MIN_SEC && selectionDuration <= VOICE_MAX_SEC;

  const applyBlob = useCallback(
    async (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await new Promise<void>((resolve, reject) => {
        audio.onloadedmetadata = () => resolve();
        audio.onerror = () => reject(new Error("load failed"));
      });
      const d = audio.duration;
      URL.revokeObjectURL(url);
      const end = Math.min(d, VOICE_MAX_SEC);
      const start = 0;
      const meta: VoiceMeta = { trimStart: start, trimEnd: end, duration: d };
      setDuration(d);
      setRange([start, end]);
      onChange(meta, blob);
    },
    [onChange],
  );

  async function startRecording() {
    if (disabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        void applyBlob(blob);
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      /* الميكروفون غير متاح */
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    void applyBlob(file);
    e.target.value = "";
  }

  function commitRange(next: [number, number]) {
    if (!voiceBlob || duration <= 0) return;
    let [start, end] = next;
    start = Math.max(0, Math.min(start, duration));
    end = Math.max(0, Math.min(end, duration));
    if (end - start > VOICE_MAX_SEC) {
      end = start + VOICE_MAX_SEC;
    }
    if (end - start < VOICE_MIN_SEC) {
      end = Math.min(duration, start + VOICE_MIN_SEC);
    }
    setRange([start, end]);
    onChange({ trimStart: start, trimEnd: end, duration }, voiceBlob);
  }

  function togglePreview() {
    if (!voiceBlob) return;
    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    const url = URL.createObjectURL(voiceBlob);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.currentTime = range[0];
    audio.play();
    setPlaying(true);
    const onTime = () => {
      if (audio.currentTime >= range[1]) {
        audio.pause();
        setPlaying(false);
        URL.revokeObjectURL(url);
        audio.removeEventListener("timeupdate", onTime);
      }
    };
    audio.addEventListener("timeupdate", onTime);
    audio.onended = () => {
      setPlaying(false);
      URL.revokeObjectURL(url);
    };
  }

  function clearVoice() {
    onChange(null, null);
    setDuration(0);
    setRange([0, VOICE_MAX_SEC]);
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm leading-relaxed">
        سجّل أو ارفع صوتاً، ثم حدّد مقطعاً بين {VOICE_MIN_SEC} و{VOICE_MAX_SEC} ثانية
        للتصدير كفيديو.
      </p>

      <div className="flex flex-wrap gap-2">
        {!recording ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={disabled}
            onClick={() => void startRecording()}
          >
            <Mic className="size-4" />
            تسجيل
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={stopRecording}
          >
            <Square className="size-3.5 fill-current" />
            إيقاف
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="size-4" />
          رفع ملف
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={onFilePick}
        />
        {voiceBlob && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={togglePreview}
            >
              {playing ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
              معاينة المقطع
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={clearVoice}>
              حذف الصوت
            </Button>
          </>
        )}
      </div>

      {voiceBlob && duration > 0 && (
        <div className="border-border bg-muted/20 space-y-4 rounded-xl border p-4">
          <div className="flex items-center justify-between text-sm">
            <Label>تحديد المقطع</Label>
            <span
              className={cn(
                "font-medium tabular-nums",
                selectionValid ? "text-emerald-600" : "text-amber-600",
              )}
            >
              {formatSec(selectionDuration)}
              {!selectionValid && ` (مطلوب ${VOICE_MIN_SEC}–${VOICE_MAX_SEC} ث)`}
            </span>
          </div>

          <Slider
            min={0}
            max={duration}
            step={0.1}
            defaultValue={range}
            value={range}
            onValueChange={(v: number[]) => commitRange(v as [number, number])}
            minStepsBetweenThumbs={VOICE_MIN_SEC * 10}
            className="py-2"
          />

          <div className="text-muted-foreground flex justify-between text-xs tabular-nums">
            <span>البداية: {formatSec(range[0])}</span>
            <span>النهاية: {formatSec(range[1])}</span>
            <span>المدة الكلية: {formatSec(duration)}</span>
          </div>

          <div className="bg-muted/40 relative h-10 overflow-hidden rounded-lg">
            <div
              className="bg-primary/25 absolute inset-y-0 rounded-md border border-primary/40"
              style={{
                left: `${(range[0] / duration) * 100}%`,
                width: `${((range[1] - range[0]) / duration) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {voiceMeta && !isVoiceSelectionValid(voiceMeta) && (
        <p className="text-amber-600 text-xs">
          اضبط المقطع ليكون بين {VOICE_MIN_SEC} و{VOICE_MAX_SEC} ثانية قبل التصدير.
        </p>
      )}
    </div>
  );
}
