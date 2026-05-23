import { withApiHandler } from "@/lib/api-route";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requireDatabaseConfigured } from "@/lib/api-db-guard";
import { auth } from "@/auth";
import { getPurchaseRepository } from "@/lib/db";
import { purchaseAccessStatusIn } from "@/lib/purchase-access";

export const GET = withApiHandler("v1.account.purchases", async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHORIZED", "يجب تسجيل الدخول", 401);
  }

  const dbCheck = requireDatabaseConfigured();
  if (!dbCheck.ok) return dbCheck.response;

  try {
    const purchases = await (await getPurchaseRepository()).find({
      where: {
        userId: session.user.id,
        status: purchaseAccessStatusIn(),
      },
      relations: ["template", "template.category"],
      order: { createdAt: "DESC" },
    });

    const items = purchases.map((p) => ({
      id: p.id,
      templateId: p.templateId,
      templateTitle: p.template?.title ?? "",
      categoryName: p.template?.category?.nameAr ?? null,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      customizeUrl: `/templates/${p.templateId}/customize`,
    }));

    return jsonSuccess({ items });
  } catch {
    return jsonError("SERVER_ERROR", "تعذّر جلب الطلبات", 500);
  }
});
