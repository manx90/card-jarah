import { MissingDatabaseNotice } from "@/components/setup/missing-database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCategoryRepository,
  getTemplateRepository,
  getUserRepository,
} from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import { FileStack, FolderOpen, UserRound } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  if (!isDatabaseConfigured()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <MissingDatabaseNotice />
      </div>
    );
  }

  const [nTemplates, nCategories, nUsers] = await Promise.all([
    (await getTemplateRepository()).count(),
    (await getCategoryRepository()).count(),
    (await getUserRepository()).count(),
  ]);

  const stats = [
    {
      label: "القوالب",
      value: nTemplates,
      href: "/admin/templates",
      icon: FileStack,
    },
    {
      label: "الفئات",
      value: nCategories,
      href: "/admin/categories",
      icon: FolderOpen,
    },
    {
      label: "المستخدمون",
      value: nUsers,
      href: null,
      icon: UserRound,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">لوحة التحكم</h1>
        <p className="text-muted-foreground mt-1 text-sm">إدارة الفئات والقوالب والمستخدمين</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          const content = (
            <Card
              className={
                s.href
                  ? "h-full border-border/80 shadow-sm transition-shadow hover:shadow-md"
                  : "h-full border-border/80 shadow-sm"
              }
            >
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
                <Icon className="text-primary size-4 opacity-80" aria-hidden />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums" dir="ltr">
                  {s.value}
                </p>
                {s.href && (
                  <CardDescription className="mt-2">اضغط للإدارة</CardDescription>
                )}
              </CardContent>
            </Card>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="block">
              {content}
            </Link>
          ) : (
            <div key={s.label}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
