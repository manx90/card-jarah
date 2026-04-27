import { MissingDatabaseNotice } from "@/components/setup/missing-database";
import { getCategoryRepository } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import { AdminTemplateForm } from "../admin-template-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminNewTemplatePage() {
  if (!isDatabaseConfigured()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">قالب جديد</h1>
        <MissingDatabaseNotice />
      </div>
    );
  }

  const categories = await (await getCategoryRepository()).find({
    order: { nameAr: "ASC" },
  });
  const defaultFields = JSON.stringify({ fields: [] }, null, 2);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">قالب جديد</h1>
          <p className="text-muted-foreground text-sm">
            رفع صورة — معاينة للزوار بعلامة مائية؛ التحميل الأصلي بعد الشراء
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/templates" className="gap-1">
            القائمة
            <ArrowRight className="size-4 rotate-180" />
          </Link>
        </Button>
      </div>
      <AdminTemplateForm
        categories={categories.map((c) => ({
          id: c.id,
          nameAr: c.nameAr,
        }))}
        defaultFieldsJson={defaultFields}
      />
    </div>
  );
}
