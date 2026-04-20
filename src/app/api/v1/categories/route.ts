import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requireDatabaseConfigured } from "@/lib/api-db-guard";
import { getCategoryRepository } from "@/lib/db";

export async function GET() {
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
      })),
    );
  } catch (e) {
    console.error("[categories]", e);
    return jsonError("SERVER_ERROR", "تعذّر تحميل الفئات", 500);
  }
}
