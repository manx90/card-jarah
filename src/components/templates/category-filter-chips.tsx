"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className="w-full rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">تصفية حسب الفئة</h2>
        {selectedCategoryId && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-muted-foreground hover:text-foreground text-xs font-medium underline-offset-4 transition-colors hover:underline"
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
          className="shrink-0 snap-start"
        >
          <Badge
            variant={!selectedCategoryId ? "default" : "outline"}
            className={cn(
              "cursor-pointer gap-1.5 rounded-full px-4 py-2 text-sm transition-all",
              !selectedCategoryId
                ? "shadow-sm"
                : "hover:border-primary/40 hover:bg-accent",
            )}
          >
            <LayoutList className="size-3.5 opacity-80" aria-hidden />
            الكل
          </Badge>
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
              className="shrink-0 snap-start"
            >
              <Badge
                variant={active ? "default" : "outline"}
                className={cn(
                  "cursor-pointer rounded-full px-4 py-2 text-sm transition-all",
                  active ? "shadow-sm" : "hover:border-primary/40 hover:bg-accent",
                )}
              >
                {c.nameAr}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
