import { CategoryShowcase } from "@/components/home/category-showcase";
import { HeroVideoBanner } from "@/components/home/hero-video-banner";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
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
      <HeroVideoBanner>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
          <Sparkles className="size-3.5" aria-hidden />
          بطاقات تهنئة رقمية
        </div>
        <h1
          id="hero-heading"
          className="relative text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.75rem] md:leading-tight"
        >
          <AnimatedShinyText className="from-white from-30% via-primary to-white to-80%">
            بطاقة تهنئة باسمك
          </AnimatedShinyText>
          <span className="mt-2 block text-2xl sm:text-3xl md:text-4xl">
            جاهزة للمشاركة في دقائق
          </span>
        </h1>
        <p className="relative max-w-xl text-pretty text-base leading-relaxed text-white/85 sm:text-lg">
          قوالب مصممة، تخصيص بالاسم والصورة والنص، ثم تحميل بجودة كاملة بعد الشراء —
          بلا علامة مائية.
        </p>
        <div className="relative flex w-full max-w-md flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-3">
          <Button asChild size="lg" className="w-full gap-2 shadow-lg sm:w-auto sm:min-w-44">
            <Link href="/templates">
              <ArrowLeft className="size-4" aria-hidden />
              استكشف القوالب
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="w-full gap-2 border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white sm:w-auto sm:min-w-44"
          >
            <Link href="/register">
              <UserPlus className="size-4" aria-hidden />
              إنشاء حساب
            </Link>
          </Button>
        </div>
      </HeroVideoBanner>

      <CategoryShowcase categories={showcaseCategories} />
    </main>
  );
}
