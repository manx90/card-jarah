import fs from "fs/promises";
import path from "path";

/** جذر الرفع المحلي (خارج public) */
export const STORAGE_UPLOADS_ROOT = path.join(
  process.cwd(),
  "storage",
  "uploads",
);

export function absoluteUploadPath(relativePath: string): string {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  return path.join(STORAGE_UPLOADS_ROOT, normalized);
}

/** يضمن وجود المجلد */
export async function ensureUploadsDir(subdir?: string): Promise<string> {
  const dir = subdir
    ? path.join(STORAGE_UPLOADS_ROOT, subdir)
    : STORAGE_UPLOADS_ROOT;
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/** مسار نسبي للتخزين في DB (مثلاً templates/uuid/preview.png) */
export function toDbRelative(absPath: string): string {
  const rel = path.relative(STORAGE_UPLOADS_ROOT, absPath);
  return rel.split(path.sep).join("/");
}

export async function removeUnderUploads(relativePath: string): Promise<void> {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const abs = absoluteUploadPath(normalized);
  if (!abs.startsWith(STORAGE_UPLOADS_ROOT)) return;
  await fs.rm(abs, { recursive: true, force: true });
}
