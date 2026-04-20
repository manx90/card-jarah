import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requireDatabaseConfigured } from "@/lib/api-db-guard";
import { auth } from "@/auth";
import {
  getPurchaseRepository,
  getTemplateRepository,
} from "@/lib/db";
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
      relations: ["category"],
    });
    if (!template) {
      return jsonError("NOT_FOUND", "القالب غير موجود", 404);
    }

    const session = await auth();
    let purchased = false;
    if (session?.user?.id) {
      purchased = await (await getPurchaseRepository()).exists({
        where: {
          userId: session.user.id,
          templateId: id,
          status: "mock_completed",
        },
      });
    }

    return jsonSuccess({
      id: template.id,
      title: template.title,
      description: template.description,
      price: template.price,
      categoryId: template.categoryId,
      category: template.category
        ? {
            slug: template.category.slug,
            nameAr: template.category.nameAr,
          }
        : null,
      fieldsJson: template.fieldsJson,
      previewUrl: `/api/v1/templates/${template.id}/preview`,
      downloadUrl: `/api/v1/templates/${template.id}/download`,
      purchased,
    });
  } catch (e) {
    console.error("[template detail]", e);
    return jsonError("SERVER_ERROR", "تعذّر تحميل القالب", 500);
  }
}
