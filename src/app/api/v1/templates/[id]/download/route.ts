import { withApiHandler } from "@/lib/api-route";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { requireDatabaseConfigured } from "@/lib/api-db-guard";
import { auth } from "@/auth";
import { purchaseAccessStatusIn } from "@/lib/purchase-access";
import {
  getPurchaseRepository,
  getTemplateRepository,
} from "@/lib/db";
import { absoluteUploadPath } from "@/lib/storage";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { z } from "zod";

const idSchema = z.string().uuid();

function mimeFromName(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".pdf") return "application/pdf";
  return "application/octet-stream";
}

export const GET = withApiHandler(
  "v1.templates.download",
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) {
    return jsonError("VALIDATION_ERROR", "معرّف غير صالح", 422);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHORIZED", "يجب تسجيل الدخول", 401);
  }

  const dbCheck = requireDatabaseConfigured();
  if (!dbCheck.ok) return dbCheck.response;

  try {
    const purchased = await (await getPurchaseRepository()).exists({
      where: {
        userId: session.user.id,
        templateId: id,
        status: purchaseAccessStatusIn(),
      },
    });
    if (!purchased) {
      return jsonError("FORBIDDEN", "يجب شراء القالب أولاً", 403);
    }

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
      return jsonError("NOT_FOUND", "ملف التحميل غير موجود", 404);
    }

    const stream = createReadStream(abs);
    const mime = mimeFromName(abs);
    const filename = path.basename(abs);

    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    await logger.error("templates.download_failed", { error: String(e) });
    return jsonError("SERVER_ERROR", "تعذّر التحميل", 500);
  }
  },
);
