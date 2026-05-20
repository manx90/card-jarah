import { withApiHandler } from "@/lib/api-route";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { requireDatabaseConfigured } from "@/lib/api-db-guard";
import { getAdminOr403 } from "@/lib/require-admin-api";
import { getTemplateRepository } from "@/lib/db";
import { contentTypeForSourcePath } from "@/lib/image-watermark";
import { absoluteUploadPath } from "@/lib/storage";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { NextResponse } from "next/server";
import { z } from "zod";

const idSchema = z.string().uuid();

export const GET = withApiHandler(
  "v1.admin.templates.source",
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) {
    return jsonError("VALIDATION_ERROR", "معرّف غير صالح", 422);
  }

  const admin = await getAdminOr403();
  if (!admin.ok) return admin.response;

  const dbCheck = requireDatabaseConfigured();
  if (!dbCheck.ok) return dbCheck.response;

  try {
    const template = await (await getTemplateRepository()).findOne({
      where: { id },
    });
    if (!template) {
      return jsonError("NOT_FOUND", "القالب غير موجود", 404);
    }

    const abs = absoluteUploadPath(template.sourcePath);
    try {
      await stat(abs);
    } catch {
      return jsonError("NOT_FOUND", "ملف الصورة غير موجود", 404);
    }

    const stream = createReadStream(abs);
    const mime = contentTypeForSourcePath(abs);
    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    await logger.error("admin.template_source_failed", { error: String(e) });
    return jsonError("SERVER_ERROR", "تعذّر تحميل الملف", 500);
  }
  },
);
