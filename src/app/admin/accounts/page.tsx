import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MissingDatabaseNotice } from "@/components/setup/missing-database";
import { auth } from "@/auth";
import { getUserRepository } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import { redirect } from "next/navigation";
import { AdminAccountsTable } from "./admin-accounts-table";

export const dynamic = "force-dynamic";

export default async function AdminAccountsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin/accounts");

  if (!isDatabaseConfigured()) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="الحسابات" description="إدارة المستخدمين والأدوار" />
        <MissingDatabaseNotice />
      </div>
    );
  }

  const users = await (await getUserRepository()).find({
    order: { createdAt: "DESC" },
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="الحسابات"
        description="عرض المستخدمين، تغيير الأدوار، وإعادة تعيين كلمات المرور"
      />
      <AdminAccountsTable
        currentUserId={session.user.id}
        initialRows={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
