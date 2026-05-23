import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MissingDatabaseNotice } from "@/components/setup/missing-database";
import { getPurchaseRepository } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import { AdminOrdersTable } from "./admin-orders-table";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  if (!isDatabaseConfigured()) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="الطلبات" description="متابعة المشتريات وحالات الدفع" />
        <MissingDatabaseNotice />
      </div>
    );
  }

  const purchases = await (await getPurchaseRepository())
    .createQueryBuilder("p")
    .leftJoinAndSelect("p.user", "u")
    .leftJoinAndSelect("p.template", "t")
    .orderBy("p.createdAt", "DESC")
    .getMany();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="الطلبات"
        description="جميع عمليات الشراء — تجريبية، مدفوعة، أو قيد الانتظار"
      />
      <AdminOrdersTable
        initialRows={purchases.map((p) => ({
          id: p.id,
          userName: p.user?.name ?? null,
          userEmail: p.user?.email ?? "—",
          templateTitle: p.template?.title ?? "—",
          templateId: p.templateId,
          status: p.status,
          paymentProvider: p.paymentProvider,
          paymentTrackId: p.paymentTrackId,
          createdAt: p.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
