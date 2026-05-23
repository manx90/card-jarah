import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MissingDatabaseNotice } from "@/components/setup/missing-database";
import { getTemplateRepository } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminTemplatesTable } from "./admin-templates-table";

export const dynamic = "force-dynamic";

export default async function AdminTemplatesListPage() {
  if (!isDatabaseConfigured()) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="القوالب" />
        <MissingDatabaseNotice />
      </div>
    );
  }

  const items = await (await getTemplateRepository())
    .createQueryBuilder("t")
    .leftJoinAndSelect("t.category", "c")
    .orderBy("t.createdAt", "DESC")
    .getMany();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="القوالب"
        description="إنشاء، تعديل، حذف"
        actions={
          <Button asChild>
            <Link href="/admin/templates/new" className="gap-1.5">
              <Plus className="size-4" />
              قالب جديد
            </Link>
          </Button>
        }
      />
      <AdminTemplatesTable
        rows={items.map((t) => ({
          id: t.id,
          title: t.title,
          price: t.price,
          createdAt: t.createdAt.toISOString(),
          categoryName: t.category?.nameAr ?? "—",
        }))}
      />
    </div>
  );
}
