import { CategoryShowcase } from "@/components/home/category-showcase";
import { Button } from "@/components/ui/button";
import { getCategoryRepository } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import Link from "next/link";

export default async function HomePage() {
  let showcaseCategories: { id: string; slug: string; nameAr: string }[] = [];
  if (isDatabaseConfigured()) {
    const rows = await (await getCategoryRepository()).find({
      order: { nameAr: "ASC" },
    });
    showcaseCategories = rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      nameAr: c.nameAr,
    }));
  }

  return (
    <main className="flex flex-1 flex-col">
      <section
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 py-14 text-center sm:gap-8 sm:py-20"
        aria-labelledby="hero-heading"
      >
        <h1
          id="hero-heading"
          className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-[2.5rem] md:leading-tight"
        >
          بطاقة تهنئة رقمية باسمك — جاهزة للمشاركة في دقائق
        </h1>
        <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:max-w-xl sm:text-lg">
          قوالب مصممة، تخصيص بالاسم والصورة والنص، ثم تحميل بجودة كاملة بعد الشراء —
          بلا علامة مائية.
        </p>
        <div className="flex w-full max-w-md flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-3">
          <Button asChild size="lg" className="w-full sm:w-auto sm:min-w-44">
            <Link href="/templates">استكشف القوالب</Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="w-full sm:w-auto sm:min-w-44">
            <Link href="/register">تسجيل</Link>
          </Button>
        </div>
      </section>

      <CategoryShowcase categories={showcaseCategories} />
    </main>
  );
}
