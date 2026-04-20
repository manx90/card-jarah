"use client";

import { CategoryFilterChips } from "@/components/templates/category-filter-chips";
import { TemplatePreviewImage } from "@/components/templates/template-preview-image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface CategoryItem {
  id: string;
  slug: string;
  nameAr: string;
}

interface TemplateItem {
  id: string;
  title: string;
  description: string | null;
  price: string;
  categoryId: string;
  categoryName: string;
  previewUrl: string;
}

export function TemplatesBrowser({
  categories,
  templates,
  selectedCategoryId,
  selectedCategoryName,
}: {
  categories: CategoryItem[];
  templates: TemplateItem[];
  selectedCategoryId: string | null;
  /** اسم الفئة عند التصفية — للعرض فقط */
  selectedCategoryName: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setCategory(id: string | null) {
    const p = new URLSearchParams(searchParams.toString());
    if (id) p.set("category", id);
    else p.delete("category");
    router.push(`/templates?${p.toString()}`);
  }

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <CategoryFilterChips
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelect={setCategory}
      />

      {selectedCategoryId && selectedCategoryName && (
        <p className="text-muted-foreground -mt-4 text-sm">
          عرض القوالب ضمن:{" "}
          <span className="text-foreground font-medium">{selectedCategoryName}</span>
        </p>
      )}

      <div className="grid min-w-0 flex-1 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates.length === 0 ? (
          <div className="text-muted-foreground col-span-full rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-14 text-center">
            <p className="font-medium text-foreground">لا توجد قوالب في هذا العرض</p>
            <p className="mt-2 text-sm">
              {selectedCategoryId
                ? "جرّب فئة أخرى أو عرض الكل."
                : "أضف قوالب من لوحة الإدارة."}
            </p>
            {selectedCategoryId && (
              <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => setCategory(null)}>
                عرض كل القوالب
              </Button>
            )}
          </div>
        ) : (
          templates.map((t) => (
            <Card key={t.id} className="min-w-0 overflow-hidden pt-0 transition-shadow hover:shadow-md">
              <div className="bg-muted relative w-full min-w-0 overflow-hidden">
                <TemplatePreviewImage
                  templateId={t.id}
                  previewUrl={t.previewUrl}
                  title={t.title}
                />
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  aria-hidden
                >
                  <span className="text-foreground/20 rotate-[-24deg] text-2xl font-bold tracking-widest sm:text-3xl">
                    معاينة
                  </span>
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base leading-tight">{t.title}</CardTitle>
                <p className="text-muted-foreground text-xs">{t.categoryName}</p>
              </CardHeader>
              <CardContent className="pb-2">
                {t.description && (
                  <p className="text-muted-foreground line-clamp-2 text-sm">{t.description}</p>
                )}
                <p className="mt-2 text-sm font-semibold">{t.price} ر.س</p>
              </CardContent>
              <CardFooter className="gap-2 pt-0">
                <Button size="sm" className="flex-1" asChild>
                  <Link href={`/templates/${t.id}`}>التفاصيل</Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
