export interface VoiceMeta {
  /** بداية المقطع بالثواني */
  trimStart: number;
  /** نهاية المقطع بالثواني */
  trimEnd: number;
  /** مدة الملف الكامل */
  duration: number;
  /** مسار صوت على الخادم (للمستخدمين المسجّلين) */
  voicePath?: string | null;
}

export interface FieldTextStyle {
  fontKey?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
  color?: string;
  anchor?: "center" | "start" | "end";
}

export interface EditorState {
  values: Record<string, string>;
  /** إزاحة اختيارية لكل حقل (نسبة 0–1 من عرض/ارتفاع المعاينة) */
  offsets?: Record<string, { dx: number; dy: number }>;
  /** تنسيق الخط الذي يعدّله العميل لكل حقل نصي */
  fieldStyles?: Record<string, FieldTextStyle>;
  voice?: VoiceMeta | null;
}

export interface LocalDesignDraft {
  templateId: string;
  title: string;
  editorState: EditorState;
  /** صوت base64 للتخزين المحلي فقط */
  voiceDataUrl?: string | null;
  savedAt: string;
}

export const VOICE_MIN_SEC = 3;
export const VOICE_MAX_SEC = 15;

export function voiceSelectionDuration(voice: VoiceMeta): number {
  return Math.max(0, voice.trimEnd - voice.trimStart);
}

export function isVoiceSelectionValid(voice: VoiceMeta): boolean {
  const d = voiceSelectionDuration(voice);
  return d >= VOICE_MIN_SEC && d <= VOICE_MAX_SEC;
}
