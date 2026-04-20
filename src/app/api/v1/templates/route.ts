import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requireDatabaseConfigured } from "@/lib/api-db-guard";
import { getTemplateRepository } from "@/lib/db";
import { z } from "zod";

const querySchema = z.object({
  categoryId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = {
    categoryId: url.searchParams.get("categoryId") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  };
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "معاملات غير صالحة", 422);
  }

  const { categoryId, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const dbCheck = requireDatabaseConfigured();
  if (!dbCheck.ok) return dbCheck.response;

  try {
    const repo = await getTemplateRepository();
    const qb = repo
      .createQueryBuilder("t")
      .leftJoinAndSelect("t.category", "c")
      .orderBy("t.createdAt", "DESC")
      .skip(skip)
      .take(limit);

    if (categoryId) {
      qb.andWhere("t.category_id = :categoryId", { categoryId });
    }

    const [items, total] = await qb.getManyAndCount();

    return jsonSuccess({
      items: items.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        price: t.price,
        categoryId: t.categoryId,
        category: t.category
          ? { slug: t.category.slug, nameAr: t.category.nameAr }
          : null,
        previewUrl: `/api/v1/templates/${t.id}/preview`,
      })),
      page,
      limit,
      total,
    });
  } catch (e) {
    console.error("[templates list]", e);
    return jsonError("SERVER_ERROR", "تعذّر تحميل القوالب", 500);
  }
}
