import {
  VOICE_MAX_SEC,
  VOICE_MIN_SEC,
  type VoiceMeta,
} from "@/types/editor-state";

export interface ExportVideoInput {
  canvas: HTMLCanvasElement;
  audioBlob: Blob;
  trimStart: number;
  trimEnd: number;
}

function pickMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "video/webm";
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function attachOffscreen(canvas: HTMLCanvasElement): () => void {
  canvas.style.position = "fixed";
  canvas.style.left = "-10000px";
  canvas.style.top = "0";
  canvas.style.pointerEvents = "none";
  document.body.appendChild(canvas);
  return () => canvas.remove();
}

/** captureStream يحتاج إعادة رسم مستمرة حتى مع صورة ثابتة */
function startFramePump(
  recordCanvas: HTMLCanvasElement,
  source: HTMLCanvasElement,
): () => void {
  const ctx = recordCanvas.getContext("2d", { alpha: false });
  if (!ctx) return () => {};

  const draw = () => {
    ctx.fillStyle = "#f4f4f5";
    ctx.fillRect(0, 0, recordCanvas.width, recordCanvas.height);
    ctx.drawImage(source, 0, 0, recordCanvas.width, recordCanvas.height);
  };

  draw();
  const id = window.setInterval(draw, 1000 / 30);
  return () => clearInterval(id);
}

/** تصدير فيديو من صورة ثابتة + مقطع صوت (3–15 ث) */
export async function exportCardVideo(input: ExportVideoInput): Promise<Blob> {
  const duration = input.trimEnd - input.trimStart;
  if (duration < VOICE_MIN_SEC || duration > VOICE_MAX_SEC) {
    throw new Error("VOICE_DURATION_INVALID");
  }
  if (input.canvas.width < 1 || input.canvas.height < 1) {
    throw new Error("CANVAS_EMPTY");
  }
  if (input.audioBlob.size < 32) {
    throw new Error("AUDIO_EMPTY");
  }

  const recordCanvas = document.createElement("canvas");
  recordCanvas.width = input.canvas.width;
  recordCanvas.height = input.canvas.height;
  const detach = attachOffscreen(recordCanvas);

  const audioCtx = new AudioContext();
  let stopFrames: () => void = () => {};

  try {
    if (audioCtx.state === "suspended") await audioCtx.resume();

    const audioBuffer = await audioCtx.decodeAudioData(
      await input.audioBlob.arrayBuffer(),
    );

    stopFrames = startFramePump(recordCanvas, input.canvas);
    await waitMs(120);

    const videoStream = recordCanvas.captureStream(30);
    const audioDest = audioCtx.createMediaStreamDestination();

    const audioSource = audioCtx.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.connect(audioDest);

    const videoTracks = videoStream.getVideoTracks();
    const audioTracks = audioDest.stream.getAudioTracks();
    if (videoTracks.length === 0 || audioTracks.length === 0) {
      throw new Error("STREAM_FAILED");
    }

    const combined = new MediaStream([...videoTracks, ...audioTracks]);
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(combined, {
      mimeType,
      videoBitsPerSecond: 2_500_000,
      audioBitsPerSecond: 128_000,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const stopped = new Promise<void>((resolve, reject) => {
      recorder.onstop = () => resolve();
      recorder.onerror = () => reject(new Error("RECORD_FAILED"));
    });

    recorder.start(200);

    await new Promise<void>((resolve, reject) => {
      audioSource.onended = () => resolve();
      try {
        audioSource.start(0, input.trimStart, duration);
      } catch {
        reject(new Error("AUDIO_PLAY_FAILED"));
      }
    });

    await waitMs(450);
    if (recorder.state === "recording") {
      recorder.requestData();
      recorder.stop();
    }
    await stopped;

    const type = mimeType.split(";")[0] ?? "video/webm";
    const blob = new Blob(chunks, { type });
    if (blob.size < 256) throw new Error("RECORD_EMPTY");
    return blob;
  } finally {
    stopFrames();
    detach();
    await audioCtx.close();
  }
}

export function validateVoiceMeta(voice: VoiceMeta): string | null {
  const d = voice.trimEnd - voice.trimStart;
  if (d < VOICE_MIN_SEC) return `الحد الأدنى ${VOICE_MIN_SEC} ثوانٍ`;
  if (d > VOICE_MAX_SEC) return `الحد الأقصى ${VOICE_MAX_SEC} ثانية`;
  if (voice.trimEnd > voice.duration) return "نهاية المقطع تتجاوز مدة الملف";
  return null;
}
