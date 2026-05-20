import { withApiHandler } from "@/lib/api-route";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { requireDatabaseConfigured } from "@/lib/api-db-guard";
import { getCategoryRepository } from "@/lib/db";

export const GET = withApiHandler("v1.categories.list", async () => {
  const dbCheck = requireDatabaseConfigured();
  if (!dbCheck.ok) return dbCheck.response;

  try {
    const rows = await (await getCategoryRepository()).find({
      order: { nameAr: "ASC" },
    });
    return jsonSuccess(
      rows.map((c) => ({
        id: c.id,
        slug: c.slug,
        nameAr: c.nameAr,
        imageUrl: `/api/v1/categories/${c.id}/thumbnail`,
      })),
    );
  } catch (e) {
    await logger.error("categories.list_failed", { error: String(e) });
    return jsonError("SERVER_ERROR", "تعذّر تحميل الفئات", 500);
  }
});
