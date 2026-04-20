import { MissingDatabaseNotice } from "@/components/setup/missing-database";
import {
  getCategoryRepository,
  getTemplateRepository,
} from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import { Suspense } from "react";
import { TemplatesBrowser } from "./templates-browser";

export const dynamic = "force-dynamic";

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categoryId } = await searchParams;

  if (!isDatabaseConfigured()) {
    return (
      <div className="mx-auto flex max-w-6xl flex-1 flex-col items-center px-4 py-16">
        <MissingDatabaseNotice />
      </div>
    );
  }

  const categories = await (
    await getCategoryRepository()
  ).find({
    order: { nameAr: "ASC" },
  });

  const qb = (await getTemplateRepository())
    .createQueryBuilder("t")
    .leftJoinAndSelect("t.category", "c")
    .orderBy("t.createdAt", "DESC");

  if (categoryId) {
    qb.andWhere("t.category_id = :categoryId", { categoryId });
  }

  const templates = await qb.getMany();

  const selectedCategoryName =
    categoryId && categories.length
      ? (categories.find((c) => c.id === categoryId)?.nameAr ?? null)
      : null;

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="mb-2 break-words text-2xl font-bold">القوالب</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        معاينة بعلامة مائية؛ التحميل الكامل بعد الشراء.
      </p>
      <Suspense fallback={<p className="text-muted-foreground py-8 text-center">تحميل…</p>}>
        <TemplatesBrowser
          categories={categories.map((c) => ({
            id: c.id,
            slug: c.slug,
            nameAr: c.nameAr,
          }))}
          templates={templates.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            price: t.price,
            categoryId: t.categoryId,
            categoryName: t.category?.nameAr ?? "",
            previewUrl: `/api/v1/templates/${t.id}/preview`,
          }))}
          selectedCategoryId={categoryId ?? null}
          selectedCategoryName={selectedCategoryName}
        />
      </Suspense>
    </div>
  );
}
