import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { Button } from "@/components/ui/button";
import { getCategoryRepository } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import { ArrowLeft, Sparkles, UserPlus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let showcaseCategories: {
    id: string;
    slug: string;
    nameAr: string;
    hasThumbnail: boolean;
  }[] = [];
  if (isDatabaseConfigured()) {
    const rows = await (await getCategoryRepository()).find({
      order: { nameAr: "ASC" },
    });
    showcaseCategories = rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      nameAr: c.nameAr,
      hasThumbnail: Boolean(c.thumbnailPath),
    }));
  }

  return (
    <main className="flex flex-1 flex-col">
      <section
        className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-4 py-14 text-center sm:gap-8 sm:py-20"
        aria-labelledby="hero-heading"
      >
        <div
          className="pointer-events-none absolute -top-20 inset-s-1/2 size-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full border border-primary/20 px-4 py-1.5 text-xs font-medium">
          <Sparkles className="size-3.5" aria-hidden />
          بطاقات تهنئة رقمية
        </div>
        <h1
          id="hero-heading"
          className="relative text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-[2.75rem] md:leading-tight"
        >
          <AnimatedShinyText>بطاقة تهنئة باسمك</AnimatedShinyText>
          <span className="mt-2 block text-2xl sm:text-3xl md:text-4xl">
            جاهزة للمشاركة في دقائق
          </span>
        </h1>
        <p className="text-pretty relative max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          قوالب مصممة، تخصيص بالاسم والصورة والنص، ثم تحميل بجودة كاملة بعد الشراء —
          بلا علامة مائية.
        </p>
        <div className="relative flex w-full max-w-md flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-3">
          <Button asChild size="lg" className="w-full gap-2 shadow-sm sm:w-auto sm:min-w-44">
            <Link href="/templates">
              <ArrowLeft className="size-4" aria-hidden />
              استكشف القوالب
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="w-full gap-2 sm:w-auto sm:min-w-44">
            <Link href="/register">
              <UserPlus className="size-4" aria-hidden />
              إنشاء حساب
            </Link>
          </Button>
        </div>
      </section>

      <CategoryShowcase categories={showcaseCategories} />
    </main>
  );
}
