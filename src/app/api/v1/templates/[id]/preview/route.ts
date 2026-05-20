import { jsonError } from "@/lib/api-response";
import { requireDatabaseConfigured } from "@/lib/api-db-guard";
import { auth } from "@/auth";
import {
  bufferWithWatermark,
  contentTypeForSourcePath,
} from "@/lib/image-watermark";
import { purchaseAccessStatusIn } from "@/lib/purchase-access";
import { getPurchaseRepository, getTemplateRepository } from "@/lib/db";
import { absoluteUploadPath } from "@/lib/storage";
import { readFile } from "fs/promises";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { z } from "zod";

const idSchema = z.string().uuid();

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) {
    return jsonError("VALIDATION_ERROR", "معرّف غير صالح", 422);
  }

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

    const session = await auth();
    let showClean = false;
    if (session?.user?.id) {
      const purchased = await (await getPurchaseRepository()).exists({
        where: {
          userId: session.user.id,
          templateId: id,
          status: purchaseAccessStatusIn(),
        },
      });
      showClean = purchased;
    }

    if (showClean) {
      const stream = createReadStream(abs);
      const mime = contentTypeForSourcePath(abs);
      return new NextResponse(stream as unknown as BodyInit, {
        headers: {
          "Content-Type": mime,
          "Cache-Control": "private, max-age=300",
        },
      });
    }

    const raw = await readFile(abs);
    const ext = path.extname(abs);
    const { buffer, contentType } = await bufferWithWatermark(raw, ext);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("[preview]", e);
    return jsonError("SERVER_ERROR", "تعذّر تحميل المعاينة", 500);
  }
}
