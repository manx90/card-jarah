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
        <h1 className="text-2xl font-bold">الفئات</h1>
        <MissingDatabaseNotice />
      </div>
    );
  }

  const rows = await (await getCategoryRepository()).find({
    order: { nameAr: "ASC" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">الفئات</h1>
        <p className="text-muted-foreground text-sm">المعرّف، الاسم، وصورة الغلاف</p>
      </div>
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
