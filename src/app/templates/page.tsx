import { PageHero } from "@/components/layout/page-hero";
import { MissingDatabaseNotice } from "@/components/setup/missing-database";
import { TemplatesGridSkeleton } from "@/components/templates/templates-grid-skeleton";
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
    <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <PageHero
        eyebrow="المتجر"
        title="قوالب بطاقات التهنئة"
        description="معاينة بعلامة مائية — التحميل الكامل والتخصيص بعد الشراء."
      />
      <Suspense fallback={<TemplatesGridSkeleton />}>
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
    </main>
  );
}
