"use client";

import { CategoryFilterChips } from "@/components/templates/category-filter-chips";
import { TemplateCard } from "@/components/templates/template-card";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { LayoutGrid } from "lucide-react";
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
          <span className="font-medium text-foreground">{selectedCategoryName}</span>
        </p>
      )}

      <div className="grid min-w-0 flex-1 grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {templates.length === 0 ? (
          <Empty className="col-span-full border-border/80 bg-muted/20 py-16">
            <EmptyHeader className="">
              <EmptyMedia variant="icon" className="">
                <LayoutGrid aria-hidden />
              </EmptyMedia>
              <EmptyTitle className="">لا توجد قوالب في هذا العرض</EmptyTitle>
              <EmptyDescription className="">
                {selectedCategoryId
                  ? "جرّب فئة أخرى أو اعرض كل القوالب المتاحة."
                  : "أضف قوالب من لوحة الإدارة لتظهر هنا."}
              </EmptyDescription>
            </EmptyHeader>
            {selectedCategoryId && (
              <EmptyContent className="">
                <Button type="button" variant="outline" size="sm" onClick={() => setCategory(null)}>
                  عرض كل القوالب
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          templates.map((t) => (
            <TemplateCard
              key={t.id}
              id={t.id}
              title={t.title}
              description={t.description}
              price={t.price}
              categoryName={t.categoryName}
              previewUrl={t.previewUrl}
            />
          ))
        )}
      </div>
    </div>
  );
}
