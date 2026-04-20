"use client";

import { cn } from "@/lib/utils";
import { LayoutList } from "lucide-react";

interface CategoryItem {
  id: string;
  slug: string;
  nameAr: string;
}

interface CategoryFilterChipsProps {
  categories: CategoryItem[];
  selectedCategoryId: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryFilterChips({
  categories,
  selectedCategoryId,
  onSelect,
}: CategoryFilterChipsProps) {
  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">تصفية حسب الفئة</h2>
        {selectedCategoryId && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-muted-foreground hover:text-foreground text-xs font-medium underline-offset-4 hover:underline"
          >
            مسح التصفية
          </button>
        )}
      </div>
      <div
        className={cn(
          "-mx-1 flex gap-2 overflow-x-auto px-1 pb-1",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "snap-x snap-mandatory sm:flex-wrap sm:overflow-visible sm:snap-none",
        )}
        role="tablist"
        aria-label="فئات القوالب"
      >
        <button
          type="button"
          role="tab"
          aria-selected={!selectedCategoryId}
          onClick={() => onSelect(null)}
          className={cn(
            "inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            !selectedCategoryId
              ? "border-primary bg-primary text-primary-foreground shadow-sm"
              : "border-border/80 bg-background text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <LayoutList className="size-3.5 opacity-80" aria-hidden />
          الكل
        </button>
        {categories.map((c) => {
          const active = selectedCategoryId === c.id;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(c.id)}
              className={cn(
                "shrink-0 snap-start rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border/80 bg-background text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {c.nameAr}
            </button>
          );
        })}
      </div>
    </div>
  );
}
