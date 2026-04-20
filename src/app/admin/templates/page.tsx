import { MissingDatabaseNotice } from "@/components/setup/missing-database";
import { getCategoryRepository } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import { AdminTemplateForm } from "./admin-template-form";

export const dynamic = "force-dynamic";

export default async function AdminTemplatesPage() {
  if (!isDatabaseConfigured()) {
    return (
      <div className="mx-auto flex max-w-2xl flex-1 flex-col items-center px-4 py-16">
        <MissingDatabaseNotice />
      </div>
    );
  }

  const categories = await (await getCategoryRepository()).find({
    order: { nameAr: "ASC" },
  });

  const defaultFields = JSON.stringify({ fields: [] }, null, 2);

  return (
    <div className="mx-auto max-w-3xl flex-1 px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">رفع قالب جديد</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        صورة واحدة للقالب — تُعرض للزوار بعلامة مائية؛ بعد الشراء يُحمّل الملف الأصلي من{" "}
        <code className="bg-muted rounded px-1 text-xs">storage/uploads</code>.
      </p>
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
