import sharp from "sharp";

const MAX_BYTES = 2 * 1024 * 1024;
const MIN_SIDE = 200;
const THUMB_SIZE = 512;

export interface ProcessedCategoryImage {
  buffer: Buffer;
  ext: ".webp";
}

export async function validateAndProcessCategoryThumbnail(
  input: Buffer,
): Promise<{ ok: true; data: ProcessedCategoryImage } | { ok: false; error: string }> {
  if (input.length === 0) {
    return { ok: false, error: "الصورة فارغة" };
  }
  if (input.length > MAX_BYTES) {
    return { ok: false, error: "حجم الصورة يتجاوز 2 ميغابايت" };
  }

  try {
    const img = sharp(input, { failOn: "error" });
    const meta = await img.metadata();
    if (!meta.width || !meta.height) {
      return { ok: false, error: "تعذّر قراءة أبعاد الصورة" };
    }
    if (meta.width < MIN_SIDE || meta.height < MIN_SIDE) {
      return {
        ok: false,
        error: `الحد الأدنى للصورة ${MIN_SIDE}×${MIN_SIDE} بكسل`,
      };
    }

    const buffer = await img
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: "cover", position: "centre" })
      .webp({ quality: 85 })
      .toBuffer();

    return { ok: true, data: { buffer, ext: ".webp" } };
  } catch {
    return { ok: false, error: "ملف الصورة غير صالح" };
  }
}
