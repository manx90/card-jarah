import { withApiHandler } from "@/lib/api-route";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requireDatabaseConfigured } from "@/lib/api-db-guard";
import { auth } from "@/auth";
import { getPurchaseRepository, getUserRepository } from "@/lib/db";
import { buildPurchaseReceipt } from "@/lib/purchase-receipt";
import { purchaseAccessStatusIn } from "@/lib/purchase-access";

export const GET = withApiHandler(
  "v1.account.purchases.receipt",
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const session = await auth();
    if (!session?.user?.id) {
      return jsonError("UNAUTHORIZED", "يجب تسجيل الدخول", 401);
    }

    const dbCheck = requireDatabaseConfigured();
    if (!dbCheck.ok) return dbCheck.response;

    const { id } = await context.params;

    try {
      const purchase = await (await getPurchaseRepository()).findOne({
        where: {
          id,
          userId: session.user.id,
          status: purchaseAccessStatusIn(),
        },
        relations: ["template", "template.category"],
      });

      if (!purchase?.template) {
        return jsonError("NOT_FOUND", "الإيصال غير موجود", 404);
      }

      const user = await (await getUserRepository()).findOne({
        where: { id: session.user.id },
      });
      if (!user) {
        return jsonError("NOT_FOUND", "المستخدم غير موجود", 404);
      }

      const receipt = buildPurchaseReceipt(
        purchase,
        purchase.template,
        user,
        purchase.template.category?.nameAr ?? null,
      );

      return jsonSuccess({ receipt });
    } catch {
      return jsonError("SERVER_ERROR", "تعذّر تحميل الإيصال", 500);
    }
  },
);
