import { Separator } from "@/components/ui/separator";
import { Heart, LayoutGrid, Mail, Sparkles } from "lucide-react";
import Link from "next/link";

const footerLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/templates", label: "القوالب" },
  { href: "/register", label: "إنشاء حساب" },
  { href: "/account", label: "حسابي" },
  { href: "/login", label: "تسجيل الدخول" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/60 bg-card/40 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
                <Sparkles className="size-4" aria-hidden />
              </span>
              <span className="text-lg font-bold tracking-tight">فرحة</span>
            </Link>
            <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
              بطاقات تهنئة رقمية قابلة للتخصيص — صمّم، اشترِ، وشارك فرحتك في دقائق.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">روابط سريعة</h3>
            <ul className="space-y-2.5">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">تواصل</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:mo.mansiyah@gmail.com"
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
                >
                  <Mail className="size-4 shrink-0 opacity-70" aria-hidden />
                  mo.mansiyah@gmail.com
                </a>
              </li>
              <li>
                <Link
                  href="/templates"
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
                >
                  <LayoutGrid className="size-4 shrink-0 opacity-70" aria-hidden />
                  تصفّح كل القوالب
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-border/60" />

        <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-start">
          <p className="text-muted-foreground text-xs sm:text-sm">
            © {year} فرحة — جميع الحقوق محفوظة
          </p>
          <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs sm:text-sm">
            صُنع بـ
            <Heart className="text-primary size-3.5 fill-primary/30" aria-hidden />
            للمناسبات السعيدة
          </p>
        </div>
      </div>
    </footer>
  );
}
