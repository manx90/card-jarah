import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { Sparkles } from "lucide-react";
import Link from "next/link";

interface AuthPageShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AuthPageShell({ title, description, children }: AuthPageShellProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-5xl flex-1 flex-col justify-center px-4 py-8 sm:min-h-[calc(100dvh-4rem)] sm:py-12">
      <div className="grid min-h-0 gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-8">
        <section className="relative hidden overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-8 shadow-sm backdrop-blur-sm lg:flex lg:flex-col lg:justify-between">
          <div
            className="pointer-events-none absolute -start-20 -top-20 size-56 rounded-full bg-primary/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -end-16 size-48 rounded-full bg-primary/10 blur-2xl"
            aria-hidden
          />
          <div className="relative space-y-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <Sparkles className="size-5" aria-hidden />
              </span>
              <span className="text-xl font-bold">فرحة</span>
            </Link>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold leading-tight">
                <AnimatedShinyText>بطاقات تهنئة رقمية</AnimatedShinyText>
              </h2>
              <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
                صمّم بطاقتك، اشترِ القالب، خصّصه باسمك، وحمّله بجودة كاملة — جاهز للمشاركة
                في أي مناسبة.
              </p>
            </div>
          </div>
          <ul className="text-muted-foreground relative space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="bg-primary size-1.5 rounded-full" aria-hidden />
              معاينة فورية للقوالب
            </li>
            <li className="flex items-center gap-2">
              <span className="bg-primary size-1.5 rounded-full" aria-hidden />
              تخصيص بالاسم والصورة
            </li>
            <li className="flex items-center gap-2">
              <span className="bg-primary size-1.5 rounded-full" aria-hidden />
              تحميل بدون علامة مائية
            </li>
          </ul>
        </section>

        <section className="flex flex-col justify-center">
          <div className="mb-6 text-center lg:text-start">
            <Link
              href="/"
              className="text-primary mb-4 inline-flex items-center gap-2 text-sm font-medium lg:hidden"
            >
              <Sparkles className="size-4" aria-hidden />
              فرحة
            </Link>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            <p className="text-muted-foreground mt-2 text-sm">{description}</p>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}
