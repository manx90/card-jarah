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
        <h1 className="text-2xl font-bold">القوالب</h1>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">القوالب</h1>
          <p className="text-muted-foreground text-sm">إنشاء، تعديل، حذف</p>
        </div>
        <Button asChild>
          <Link href="/admin/templates/new" className="gap-1.5">
            <Plus className="size-4" />
            قالب جديد
          </Link>
        </Button>
      </div>
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
