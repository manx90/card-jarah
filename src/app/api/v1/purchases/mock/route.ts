import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requireDatabaseConfigured } from "@/lib/api-db-guard";
import { auth } from "@/auth";
import {
  getPurchaseRepository,
  getTemplateRepository,
} from "@/lib/db";
import { createCheckoutStub } from "@/modules/payments/stub";
import { z } from "zod";

const bodySchema = z.object({
  templateId: z.string().uuid(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHORIZED", "يجب تسجيل الدخول", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "جسم الطلب ليس JSON", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "بيانات غير صالحة", 422);
  }

  const { templateId } = parsed.data;

  const dbCheck = requireDatabaseConfigured();
  if (!dbCheck.ok) return dbCheck.response;

  try {
    const template = await (await getTemplateRepository()).findOne({
      where: { id: templateId },
    });
    if (!template) {
      return jsonError("NOT_FOUND", "القالب غير موجود", 404);
    }

    await createCheckoutStub({
      userId: session.user.id,
      templateId,
      amount: template.price,
    });

    const repo = await getPurchaseRepository();
    let purchase = await repo.findOne({
      where: { userId: session.user.id, templateId },
    });
    if (!purchase) {
      purchase = repo.create({
        userId: session.user.id,
        templateId,
        status: "mock_completed",
      });
      await repo.save(purchase);
    } else if (purchase.status !== "mock_completed") {
      purchase.status = "mock_completed";
      await repo.save(purchase);
    }

    return jsonSuccess({
      purchaseId: purchase.id,
      status: purchase.status,
      downloadUrl: `/api/v1/templates/${templateId}/download`,
    });
  } catch (e) {
    console.error("[mock purchase]", e);
    return jsonError("SERVER_ERROR", "تعذّر إتمام الشراء", 500);
  }
}
