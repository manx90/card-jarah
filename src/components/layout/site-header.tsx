"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Home,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  Shield,
  Sparkles,
  User,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutToHome } from "@/lib/client-sign-out";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/", label: "الرئيسية", icon: Home, exact: true },
  { href: "/templates", label: "القوالب", icon: LayoutGrid, exact: false },
];

function isNavActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navLinkClass(active: boolean) {
  return cn(
    "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
    active
      ? "bg-primary/10 text-primary"
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
  );
}

const mobileNavItemClass = (active: boolean) =>
  cn(
    "flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-colors active:bg-accent/80",
    active
      ? "bg-primary/10 text-primary"
      : "text-foreground hover:bg-accent hover:text-accent-foreground",
  );

export function SiteHeader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const displayName =
    session?.user?.name?.trim() || session?.user?.email?.split("@")[0] || "حسابي";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md",
        "shadow-[0_1px_0_0_oklch(0_0_0/0.04)] dark:shadow-[0_1px_0_0_oklch(1_0_0/0.06)]",
      )}
    >
      <div
        className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:gap-6 sm:px-6"
        dir="ltr"
      >
        <Link
          href="/"
          className="group min-w-0 shrink-0 rounded-xl px-1 py-0.5 outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50"
          dir="rtl"
        >
          <span className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:bg-primary/15 sm:size-9 sm:rounded-xl">
              <Sparkles className="size-4" aria-hidden />
            </span>
            <span className="block truncate text-base font-bold tracking-tight text-foreground sm:text-lg">
              فرحة
            </span>
          </span>
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex"
          aria-label="التنقل الرئيسي"
          dir="rtl"
        >
          {navItems.map((item) => {
            const active = isNavActive(pathname, item.href, item.exact);
            return (
              <Link key={item.href} href={item.href} className={navLinkClass(active)}>
                {item.label}
                {active && (
                  <span
                    className="bg-primary absolute inset-x-2 -bottom-[calc(0.5rem+1px)] h-0.5 rounded-full"
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
          {session?.user?.role === "admin" && (
            <Link
              href="/admin"
              className={cn(
                navLinkClass(pathname.startsWith("/admin")),
                "gap-1.5",
              )}
            >
              <Shield className="size-3.5" aria-hidden />
              الإدارة
            </Link>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3" dir="ltr">
          <ThemeToggle />

          <Separator orientation="vertical" className="hidden h-7 sm:block" />

          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 border-border/80 bg-background/50 md:hidden"
                aria-label="فتح القائمة"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex h-full max-h-[100dvh] w-[min(100vw-1rem,20rem)] flex-col border-border/60 p-0 sm:max-w-sm"
              showCloseButton
            >
              <SheetHeader className="border-b border-border/60 bg-muted/30 px-5 py-6 text-start">
                <SheetTitle className="flex items-center gap-2 text-xl font-bold tracking-tight" dir="rtl">
                  <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                    <Sparkles className="size-4" aria-hidden />
                  </span>
                  فرحة
                </SheetTitle>
                <SheetDescription className="text-start text-muted-foreground" dir="rtl">
                  تنقّل سريع
                </SheetDescription>
              </SheetHeader>
              <nav
                className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3"
                aria-label="التنقل — جوال"
                dir="rtl"
              >
                {navItems.map((item) => {
                  const active = isNavActive(pathname, item.href, item.exact);
                  const Icon = item.icon;
                  return (
                    <SheetClose asChild key={item.href}>
                      <Link href={item.href} className={mobileNavItemClass(active)}>
                        <Icon className="size-5 shrink-0 opacity-80" aria-hidden />
                        {item.label}
                      </Link>
                    </SheetClose>
                  );
                })}
                {session?.user?.role === "admin" && (
                  <SheetClose asChild>
                    <Link
                      href="/admin"
                      className={cn(mobileNavItemClass(pathname.startsWith("/admin")), "text-primary")}
                    >
                      <Shield className="size-5 shrink-0" aria-hidden />
                      الإدارة
                    </Link>
                  </SheetClose>
                )}
              </nav>
              <SheetFooter className="mt-auto border-t border-border/60 bg-muted/20 p-4" dir="rtl">
                {status === "loading" ? (
                  <p className="text-muted-foreground text-center text-sm">…</p>
                ) : session ? (
                  <div className="flex flex-col gap-3">
                    <p
                      className="truncate text-center text-sm font-medium"
                      title={session.user?.email ?? undefined}
                    >
                      {displayName}
                    </p>
                    {session.user?.email && (
                      <p
                        className="truncate text-center text-xs text-muted-foreground"
                        dir="ltr"
                      >
                        {session.user.email}
                      </p>
                    )}
                    <SheetClose asChild>
                      <Button variant="outline" className="w-full gap-2" asChild>
                        <Link href="/account">
                          <User className="size-4 opacity-80" aria-hidden />
                          حسابي
                        </Link>
                      </Button>
                    </SheetClose>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => void signOutToHome()}
                    >
                      <LogOut className="size-4" aria-hidden />
                      تسجيل الخروج
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <SheetClose asChild>
                      <Button variant="outline" className="w-full gap-2" asChild>
                        <Link href="/login">
                          <LogIn className="size-4 opacity-80" aria-hidden />
                          تسجيل الدخول
                        </Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button className="w-full gap-2 shadow-sm" asChild>
                        <Link href="/register">
                          <UserPlus className="size-4 opacity-90" aria-hidden />
                          إنشاء حساب
                        </Link>
                      </Button>
                    </SheetClose>
                  </div>
                )}
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <div className="hidden md:flex md:items-center md:gap-2 lg:gap-3">
            {status === "loading" ? (
              <span className="text-muted-foreground px-2 text-sm tabular-nums">…</span>
            ) : session ? (
              <div className="flex items-center gap-2 lg:gap-3">
                <Button variant="ghost" size="sm" className="hidden gap-1.5 px-2 lg:inline-flex" asChild>
                  <Link href="/account" title={session.user?.email ?? undefined}>
                    <User className="size-3.5 opacity-80" aria-hidden />
                    <span className="max-w-[8rem] truncate">{displayName}</span>
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-border/80 shadow-none"
                  onClick={() => void signOutToHome()}
                >
                  <LogOut className="size-3.5" aria-hidden />
                  <span className="hidden sm:inline">خروج</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button variant="ghost" size="sm" className="gap-1.5 px-3" asChild>
                  <Link href="/login">
                    <LogIn className="size-3.5 opacity-80" aria-hidden />
                    دخول
                  </Link>
                </Button>
                <Button size="sm" className="gap-1.5 px-3 shadow-sm" asChild>
                  <Link href="/register">
                    <UserPlus className="size-3.5 opacity-90" aria-hidden />
                    تسجيل
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
