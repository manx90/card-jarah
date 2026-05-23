import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MissingDatabaseNotice } from "@/components/setup/missing-database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCategoryRepository,
  getPurchaseRepository,
  getTemplateRepository,
  getUserRepository,
} from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import { FileStack, FolderOpen, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  if (!isDatabaseConfigured()) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="لوحة التحكم" />
        <MissingDatabaseNotice />
      </div>
    );
  }

  const [nTemplates, nCategories, nUsers, nOrders] = await Promise.all([
    (await getTemplateRepository()).count(),
    (await getCategoryRepository()).count(),
    (await getUserRepository()).count(),
    (await getPurchaseRepository()).count(),
  ]);

  const stats = [
    {
      label: "القوالب",
      value: nTemplates,
      href: "/admin/templates",
      icon: FileStack,
      hint: "إدارة القوالب والحقول",
    },
    {
      label: "الفئات",
      value: nCategories,
      href: "/admin/categories",
      icon: FolderOpen,
      hint: "تصنيفات المناسبات",
    },
    {
      label: "الحسابات",
      value: nUsers,
      href: "/admin/accounts",
      icon: UserRound,
      hint: "المستخدمون والأدوار",
    },
    {
      label: "الطلبات",
      value: nOrders,
      href: "/admin/orders",
      icon: ShoppingBag,
      hint: "المشتريات والدفع",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="لوحة التحكم"
        description="نظرة عامة على المحتوى والحسابات والطلبات"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href} className="group block">
              <Card className="h-full border-border/80 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
                  <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg transition-colors group-hover:bg-primary/15">
                    <Icon className="size-4" aria-hidden />
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold tabular-nums" dir="ltr">
                    {s.value}
                  </p>
                  <CardDescription className="mt-2">{s.hint}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
