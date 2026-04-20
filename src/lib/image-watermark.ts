import sharp from "sharp";
import path from "path";

/** يُرجع نسخة من الصورة مع علامة مائية للمعاينة العامة */
export async function bufferWithWatermark(
  input: Buffer,
  sourceExt: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const ext = sourceExt.toLowerCase();
  const image = ext === ".gif" ? sharp(input, { pages: 1 }) : sharp(input);
  const meta = await image.metadata();
  const w = meta.width ?? 800;
  const h = meta.height ?? 600;
  const cx = w / 2;
  const cy = h / 2;
  const fontSize = Math.max(28, Math.round(Math.min(w, h) / 9));

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="rgba(0,0,0,0.06)"/>
  <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle"
    fill="rgba(255,255,255,0.28)" stroke="rgba(0,0,0,0.18)" stroke-width="1.5"
    font-size="${fontSize}" font-family="system-ui,sans-serif" font-weight="700"
    transform="rotate(-28 ${cx} ${cy})">معاينة</text>
</svg>`;

  const composited = image.composite([
    { input: Buffer.from(svg, "utf8"), blend: "over" },
  ]);

  if (ext === ".jpg" || ext === ".jpeg") {
    const buffer = await composited.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
    return { buffer, contentType: "image/jpeg" };
  }
  if (ext === ".webp") {
    const buffer = await composited.webp({ quality: 88 }).toBuffer();
    return { buffer, contentType: "image/webp" };
  }
  if (ext === ".gif") {
    const buffer = await composited.png({ compressionLevel: 8 }).toBuffer();
    return { buffer, contentType: "image/png" };
  }
  const buffer = await composited.png({ compressionLevel: 8 }).toBuffer();
  return { buffer, contentType: "image/png" };
}

export function contentTypeForSourcePath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "application/octet-stream";
}
