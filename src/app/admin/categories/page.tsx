import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MissingDatabaseNotice } from "@/components/setup/missing-database";
import { getCategoryImageUrlById } from "@/lib/category-images";
import { getCategoryRepository } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import { AdminCategoriesTable } from "./admin-categories-table";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  if (!isDatabaseConfigured()) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="الفئات" />
        <MissingDatabaseNotice />
      </div>
    );
  }

  const rows = await (await getCategoryRepository()).find({
    order: { nameAr: "ASC" },
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="الفئات"
        description="المعرّف، الاسم، وصورة الغلاف"
      />
      <AdminCategoriesTable
        initialRows={rows.map((c) => ({
          id: c.id,
          slug: c.slug,
          nameAr: c.nameAr,
          imageUrl: getCategoryImageUrlById(c.id),
        }))}
      />
    </div>
  );
}
