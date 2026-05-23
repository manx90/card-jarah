import { getCategoryImageUrlById } from "@/lib/category-images";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";
import Link from "next/link";

export interface ShowcaseCategory {
  id: string;
  slug: string;
  nameAr: string;
  hasThumbnail: boolean;
}

interface CategoryShowcaseProps {
  categories: ShowcaseCategory[];
}

export function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  if (categories.length === 0) return null;

  return (
    <section
      className="border-border/60 border-y bg-muted/30 py-14 sm:py-16"
      aria-labelledby="categories-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 text-center sm:mb-10">
          <h2
            id="categories-heading"
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            تصفّح حسب المناسبة
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-pretty text-sm sm:text-base">
            اختر الفئة المناسبة واكتشف قوالب جاهزة للتخصيص.
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/templates?category=${c.id}`}
                className={cn(
                  "group relative block overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm",
                  "transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
                )}
              >
                <div className="bg-muted relative aspect-4/3 w-full overflow-hidden">
                  {c.hasThumbnail ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={getCategoryImageUrlById(c.id)}
                      alt=""
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div
                      className="text-muted-foreground flex size-full flex-col items-center justify-center gap-2 bg-muted"
                      aria-hidden
                    >
                      <ImageIcon className="size-10 opacity-40" />
                    </div>
                  )}
                  <div
                    className="absolute inset-0 bg-linear-to-t from-background/95 via-background/20 to-transparent"
                    aria-hidden
                  />
                  <span className="absolute inset-x-0 bottom-0 p-4 text-start">
                    <span className="text-lg font-semibold text-foreground">{c.nameAr}</span>
                    <span className="text-primary mt-1 block text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100">
                      استكشف القوالب
                    </span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
