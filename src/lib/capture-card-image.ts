import type { Options } from "html-to-image/lib/types";
import { ensureGoogleFontLoaded } from "@/lib/load-google-font";

const FONT_WEIGHTS = [300, 400, 500, 600, 700, 800] as const;

const BASE_CAPTURE_OPTIONS: Options = {
  cacheBust: true,
  pixelRatio: 2,
  backgroundColor: "#f4f4f5",
  skipAutoScale: true,
  skipFonts: true,
  includeQueryParams: true,
};

function extractGoogleFamilyFromFontFamily(cssValue: string): string | null {
  const match = cssValue.match(/['"]([^'"]+)['"]/);
  return match?.[1] ?? null;
}

export function collectGoogleFamiliesFromNode(node: HTMLElement): string[] {
  const families = new Set<string>();
  for (const el of node.querySelectorAll("[data-card-text-field] span[style]")) {
    const html = el as HTMLElement;
    const fromInline = extractGoogleFamilyFromFontFamily(html.style.fontFamily);
    if (fromInline) families.add(fromInline);
  }
  return [...families];
}

function collectFontLoadSpecs(
  node: HTMLElement,
): Array<{ family: string; weight: number; sizePx: number }> {
  const specs = new Map<string, { family: string; weight: number; sizePx: number }>();
  for (const el of node.querySelectorAll("[data-card-text-field] span[style]")) {
    const span = el as HTMLElement;
    const family = extractGoogleFamilyFromFontFamily(span.style.fontFamily);
    if (!family) continue;
    const weight =
      Number.parseInt(span.style.fontWeight, 10) ||
      Number.parseInt(getComputedStyle(span).fontWeight, 10) ||
      400;
    const sizePx =
      Number.parseFloat(span.style.fontSize) ||
      Number.parseFloat(getComputedStyle(span).fontSize) ||
      16;
    const key = `${family}:${weight}:${Math.round(sizePx)}`;
    specs.set(key, { family, weight, sizePx });
  }
  return [...specs.values()];
}

async function fetchGoogleFontCss(family: string): Promise<string> {
  ensureGoogleFontLoaded(family);
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@300;400;500;600;700;800&display=swap`;
  const res = await fetch(url);
  if (!res.ok) return "";
  return res.text();
}

async function embedFontFilesAsBase64(css: string): Promise<string> {
  const urlPattern = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
  const urls = [...css.matchAll(urlPattern)].map((m) => m[1]);
  let result = css;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
      const b64 = btoa(binary);
      const mime = url.includes(".woff2") ? "font/woff2" : "font/woff";
      result = result.split(`url(${url})`).join(`url(data:${mime};base64,${b64})`);
    } catch {
      /* keep remote url */
    }
  }
  return result;
}

async function buildFontEmbedCss(families: string[]): Promise<string> {
  const chunks = await Promise.all(
    families.map(async (family) => {
      try {
        const css = await fetchGoogleFontCss(family);
        if (!css) return "";
        return embedFontFilesAsBase64(css);
      } catch {
        return "";
      }
    }),
  );
  return chunks.filter(Boolean).join("\n");
}

export async function ensureGoogleFamiliesLoaded(node: HTMLElement): Promise<void> {
  const specs = collectFontLoadSpecs(node);
  const families = collectGoogleFamiliesFromNode(node);
  for (const family of families) ensureGoogleFontLoaded(family);

  await Promise.all(
    specs.map(({ family, weight, sizePx }) =>
      document.fonts.load(`${weight} ${sizePx}px "${family}"`).catch(() => undefined),
    ),
  );
  await Promise.all(
    families.flatMap((family) =>
      FONT_WEIGHTS.map((weight) =>
        document.fonts.load(`${weight} 16px "${family}"`).catch(() => undefined),
      ),
    ),
  );
  await document.fonts.ready;
}

interface StyleBackup {
  el: HTMLElement;
  styleText: string;
}

function restoreStyleBackups(backups: StyleBackup[]): void {
  for (const { el, styleText } of backups) {
    if (styleText) el.setAttribute("style", styleText);
    else el.removeAttribute("style");
  }
}

function resolveInlineOrComputed(span: HTMLElement, prop: keyof CSSStyleDeclaration): string {
  const inline = span.style[prop as keyof CSSStyleDeclaration];
  if (typeof inline === "string" && inline.trim()) return inline;
  const computed = getComputedStyle(span);
  const value = computed[prop as keyof CSSStyleDeclaration];
  return typeof value === "string" ? value : "";
}

function measureNaturalTextBox(
  wrapper: HTMLElement,
  spanEl: HTMLElement,
  hasNewline: boolean,
): { width: number; height: number; isMultiLine: boolean } {
  const prevWrapWidth = wrapper.style.width;
  const prevWrapMax = wrapper.style.maxWidth;
  const prevSpanWidth = spanEl.style.width;
  const prevSpanMax = spanEl.style.maxWidth;
  const prevSpanWhite = spanEl.style.whiteSpace;

  wrapper.style.maxWidth = "none";
  wrapper.style.width = "max-content";
  spanEl.style.width = "max-content";
  spanEl.style.maxWidth = "none";
  spanEl.style.whiteSpace = hasNewline ? "pre-wrap" : "nowrap";

  void spanEl.offsetHeight;

  const width = Math.ceil(Math.max(spanEl.scrollWidth, wrapper.scrollWidth, 1));
  const height = Math.ceil(Math.max(spanEl.scrollHeight, wrapper.scrollHeight, 1));
  const lineHeightPx =
    Number.parseFloat(getComputedStyle(spanEl).lineHeight) ||
    Number.parseFloat(getComputedStyle(spanEl).fontSize) * 1.15;
  const isMultiLine = hasNewline || height > lineHeightPx * 1.35;

  wrapper.style.width = prevWrapWidth;
  wrapper.style.maxWidth = prevWrapMax;
  spanEl.style.width = prevSpanWidth;
  spanEl.style.maxWidth = prevSpanMax;
  spanEl.style.whiteSpace = prevSpanWhite;

  return { width, height, isMultiLine };
}

/** تثبيت أبعاد النص بعد تحميل الخطوط — max-content لا يعمل في foreignObject */
function prepareTextFieldsForCapture(node: HTMLElement): () => void {
  const backups: StyleBackup[] = [];

  for (const el of node.querySelectorAll("[data-card-text-field]")) {
    const wrapper = el as HTMLElement;
    const span = wrapper.querySelector("span");
    if (!span) continue;

    const spanEl = span as HTMLElement;
    const text = spanEl.textContent ?? "";
    const hasNewline = text.includes("\n");

    backups.push({ el: wrapper, styleText: wrapper.getAttribute("style") ?? "" });
    backups.push({ el: spanEl, styleText: spanEl.getAttribute("style") ?? "" });

    const { width, height, isMultiLine } = measureNaturalTextBox(
      wrapper,
      spanEl,
      hasNewline,
    );

    wrapper.style.width = `${width}px`;
    wrapper.style.minWidth = `${width}px`;
    wrapper.style.maxWidth = "none";
    wrapper.style.minHeight = `${height}px`;
    wrapper.style.height = "auto";
    wrapper.style.overflow = "visible";
    wrapper.style.flexWrap = "nowrap";
    wrapper.style.alignItems = "flex-start";
    wrapper.style.boxSizing = "border-box";

    spanEl.style.fontFamily = resolveInlineOrComputed(spanEl, "fontFamily");
    spanEl.style.fontSize = resolveInlineOrComputed(spanEl, "fontSize");
    spanEl.style.fontWeight = resolveInlineOrComputed(spanEl, "fontWeight");
    spanEl.style.fontStyle = resolveInlineOrComputed(spanEl, "fontStyle");
    spanEl.style.textDecoration =
      spanEl.style.textDecoration ||
      getComputedStyle(spanEl).textDecorationLine ||
      "none";
    spanEl.style.color = resolveInlineOrComputed(spanEl, "color");
    spanEl.style.textAlign = resolveInlineOrComputed(spanEl, "textAlign");
    spanEl.style.lineHeight = resolveInlineOrComputed(spanEl, "lineHeight") || "1.15";
    spanEl.style.direction = resolveInlineOrComputed(spanEl, "direction") || "rtl";
    spanEl.style.unicodeBidi = "plaintext";
    spanEl.style.display = "block";
    spanEl.style.width = `${width}px`;
    spanEl.style.minWidth = `${width}px`;
    spanEl.style.minHeight = `${height}px`;
    spanEl.style.height = "auto";
    spanEl.style.maxWidth = "none";
    spanEl.style.overflow = "visible";
    spanEl.style.wordBreak = "normal";
    spanEl.style.whiteSpace = isMultiLine ? "pre-wrap" : "nowrap";
  }

  return () => restoreStyleBackups(backups);
}

function expandCaptureRootForOverlays(node: HTMLElement): () => void {
  const backup = node.getAttribute("style") ?? "";
  const img = node.querySelector("img") as HTMLImageElement | null;
  const baseW = img?.offsetWidth ?? node.offsetWidth;
  const baseH = img?.offsetHeight ?? node.offsetHeight;
  const nodeRect = node.getBoundingClientRect();

  let maxBottom = baseH;
  let maxRight = baseW;

  for (const el of node.querySelectorAll("[data-card-text-field], [data-card-qr-field]")) {
    const r = (el as HTMLElement).getBoundingClientRect();
    maxBottom = Math.max(maxBottom, r.bottom - nodeRect.top + 4);
    maxRight = Math.max(maxRight, r.right - nodeRect.left + 4);
  }

  node.style.width = `${Math.ceil(maxRight)}px`;
  node.style.minWidth = `${Math.ceil(maxRight)}px`;
  node.style.height = `${Math.ceil(maxBottom)}px`;
  node.style.minHeight = `${Math.ceil(maxBottom)}px`;
  node.style.overflow = "visible";

  return () => {
    if (backup) node.setAttribute("style", backup);
    else node.removeAttribute("style");
  };
}

function prepareNodeForCapture(node: HTMLElement): () => void {
  const restoreText = prepareTextFieldsForCapture(node);
  void node.offsetHeight;
  const restoreRoot = expandCaptureRootForOverlays(node);
  void node.offsetHeight;

  return () => {
    restoreRoot();
    restoreText();
  };
}

async function buildCaptureOptions(node: HTMLElement): Promise<Options> {
  const families = collectGoogleFamiliesFromNode(node);
  const fontEmbedCSS = await buildFontEmbedCss(families);
  const img = node.querySelector("img") as HTMLImageElement | null;

  const width = Math.max(
    1,
    node.offsetWidth || img?.naturalWidth || img?.offsetWidth || 1,
  );
  const height = Math.max(
    1,
    node.offsetHeight || img?.naturalHeight || img?.offsetHeight || 1,
  );

  return {
    ...BASE_CAPTURE_OPTIONS,
    fontEmbedCSS,
    width,
    height,
    filter: (el) => {
      if (el instanceof HTMLLinkElement && el.rel === "stylesheet") return false;
      return true;
    },
  };
}

async function waitForCaptureImage(node: HTMLElement): Promise<void> {
  const img = node.querySelector("img") as HTMLImageElement | null;
  if (!img || img.complete) return;
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
}

async function runCapture<T>(
  node: HTMLElement,
  render: (node: HTMLElement, options: Options) => Promise<T>,
): Promise<T> {
  await waitForCaptureImage(node);
  await ensureGoogleFamiliesLoaded(node);
  await document.fonts.ready;

  const restoreStyles = prepareNodeForCapture(node);
  try {
    void node.offsetHeight;
    const options = await buildCaptureOptions(node);
    return await render(node, options);
  } finally {
    restoreStyles();
  }
}

export async function captureCardToCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  const canvas = await runCapture(node, async (n, options) => {
    const { toCanvas } = await import("html-to-image");
    return toCanvas(n, options);
  });
  if (canvas.width < 1 || canvas.height < 1) {
    throw new Error("CANVAS_EMPTY");
  }
  return canvas;
}

export async function captureCardToPng(node: HTMLElement): Promise<string> {
  return runCapture(node, async (n, options) => {
    const { toPng } = await import("html-to-image");
    return toPng(n, options);
  });
}

export function fieldEditChromeClass(
  fieldId: string,
  activeFieldId: string | null,
  isExportingCapture: boolean,
): string {
  if (isExportingCapture) return "";
  return [
    "rounded border border-dashed border-sky-400/70",
    activeFieldId === fieldId
      ? "border-primary ring-2 ring-primary/50 shadow-sm"
      : "border-sky-400/50",
  ].join(" ");
}
