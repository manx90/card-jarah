"use client";

import { BorderBeam } from "@/components/magicui/border-beam";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  FolderOpen,
  Home,
  LayoutGrid,
  LayoutTemplate,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav: { href: string; label: string; icon: React.ElementType }[] = [
  { href: "/admin", label: "لوحة التحكم", icon: Home },
  { href: "/admin/categories", label: "الفئات", icon: FolderOpen },
  { href: "/admin/templates", label: "القوالب", icon: LayoutTemplate },
  { href: "/templates", label: "المتجر (عرض)", icon: LayoutGrid },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar side="right" className="border-e border-sidebar-border" dir="rtl">
        <SidebarHeader className="border-b border-sidebar-border/80 px-2 py-3">
          <p className="px-2 text-sm font-bold tracking-tight text-sidebar-foreground">
            <AnimatedShinyText>إدارة جرّة</AnimatedShinyText>
          </p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>القائمة</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {nav.map((item) => {
                  const active =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link href={item.href} className="gap-2">
                          <Icon className="size-4 shrink-0" aria-hidden />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="text-muted-foreground border-t border-sidebar-border/80 p-2 text-xs">
          <Button variant="ghost" size="sm" className="w-full justify-center" asChild>
            <Link href="/">الرئيسية</Link>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset
        className="min-w-0 bg-linear-to-b from-background to-muted/20"
        dir="rtl"
      >
        <header
          className="border-border/60 sticky top-14 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:top-16 sm:h-16 sm:px-6"
        >
          <SidebarTrigger className="text-muted-foreground" />
          <span className="text-muted-foreground text-sm">لوحة الإدارة</span>
        </header>
        <div className="relative flex-1 p-4 sm:p-6">
          {/* لا تضع overflow-hidden هنا: يكسر position: sticky لمعاينة القالب */}
          <div className="relative z-0 mx-auto max-w-6xl rounded-2xl border border-border/50 shadow-sm">
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
              <BorderBeam />
            </div>
            <div className="relative m-px min-h-[12rem] overflow-visible rounded-[calc(1.125rem-1px)] bg-card p-4 sm:p-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
