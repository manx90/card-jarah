import { MissingDatabaseNotice } from "@/components/setup/missing-database";
import { getCategoryRepository, getTemplateRepository } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import { notFound } from "next/navigation";
import { AdminTemplateEditForm } from "../../admin-template-edit-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminEditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isDatabaseConfigured()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">تعديل قالب</h1>
        <MissingDatabaseNotice />
      </div>
    );
  }

  const [template, categories] = await Promise.all([
    (await getTemplateRepository()).findOne({
      where: { id },
      relations: ["category"],
    }),
    (await getCategoryRepository()).find({ order: { nameAr: "ASC" } }),
  ]);

  if (!template) {
    notFound();
  }

  const fieldsStr = JSON.stringify(template.fieldsJson ?? { fields: [] }, null, 2);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">تعديل القالب</h1>
          <p className="text-muted-foreground text-sm">{template.title}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/templates" className="gap-1">
            القائمة
            <ArrowRight className="size-4 rotate-180" />
          </Link>
        </Button>
      </div>
      <AdminTemplateEditForm
        templateId={template.id}
        initialTitle={template.title}
        initialDescription={template.description}
        initialCategoryId={template.categoryId}
        initialPrice={String(template.price)}
        defaultFieldsJson={fieldsStr}
        categories={categories.map((c) => ({ id: c.id, nameAr: c.nameAr }))}
        sourcePreviewPath={`/api/v1/admin/templates/${template.id}/source`}
      />
    </div>
  );
}
