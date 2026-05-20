import { withApiHandler } from "@/lib/api-route";
import { getCategoryRepository } from "@/lib/db";
import { requireDatabaseConfigured } from "@/lib/api-db-guard";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { absoluteUploadPath } from "@/lib/storage";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { z } from "zod";

const idSchema = z.string().uuid();

function mimeForFile(abs: string): string {
  const ext = path.extname(abs).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "application/octet-stream";
}

export const GET = withApiHandler(
  "v1.categories.thumbnail",
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) {
    return jsonError("VALIDATION_ERROR", "معرّف غير صالح", 422);
  }
  const dbCheck = requireDatabaseConfigured();
  if (!dbCheck.ok) return dbCheck.response;

  try {
    const row = await (await getCategoryRepository()).findOne({ where: { id } });
    if (!row) {
      return jsonError("NOT_FOUND", "الفئة غير موجودة", 404);
    }

    if (row.thumbnailPath) {
      const abs = absoluteUploadPath(row.thumbnailPath);
      if (existsSync(abs)) {
        const buf = await readFile(abs);
        return new NextResponse(new Uint8Array(buf), {
          headers: {
            "Content-Type": mimeForFile(abs),
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    }

    return jsonError("NOT_FOUND", "لا توجد صورة لهذه الفئة", 404);
  } catch (e) {
    await logger.error("categories.thumbnail_failed", { error: String(e) });
    return jsonError("SERVER_ERROR", "تعذّر تحميل الصورة", 500);
  }
  },
);
