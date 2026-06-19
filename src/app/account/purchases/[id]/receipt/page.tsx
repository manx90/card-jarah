import { MissingDatabaseNotice } from "@/components/setup/missing-database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/auth";
import { isDatabaseConfigured } from "@/lib/db-config";
import { getPurchaseRepository, getUserRepository } from "@/lib/db";
import { buildPurchaseReceipt } from "@/lib/purchase-receipt";
import { purchaseAccessStatusIn } from "@/lib/purchase-access";
import { ArrowRight, CheckCircle2, Palette } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReceiptPrintActions } from "./receipt-print-actions";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ar-KW", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function paymentProviderLabel(provider: string | null) {
  if (provider === "cbk_hosted") return "بوابة CBK (KNET / T-Pay)";
  if (provider === "mock") return "شراء تجريبي";
  return provider ?? "—";
}

export default async function PurchaseReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ payment?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/designs");
  }

  if (!isDatabaseConfigured()) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-8">
        <MissingDatabaseNotice />
      </main>
    );
  }

  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const isFreshPayment = sp.payment === "success";

  const purchase = await (await getPurchaseRepository()).findOne({
    where: {
      id,
      userId: session.user.id,
      status: purchaseAccessStatusIn(),
    },
    relations: ["template", "template.category"],
  });

  if (!purchase?.template) notFound();

  const user = await (await getUserRepository()).findOne({
    where: { id: session.user.id },
  });
  if (!user) notFound();

  const receipt = buildPurchaseReceipt(
    purchase,
    purchase.template,
    user,
    purchase.template.category?.nameAr ?? null,
  );

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" size="sm" className="gap-2 px-2" asChild>
          <Link href="/account/designs">
            <ArrowRight className="size-4" aria-hidden />
            العودة للحساب
          </Link>
        </Button>
        <ReceiptPrintActions />
      </div>

      {isFreshPayment && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 print:hidden dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">تم الدفع بنجاح</p>
            <p className="mt-0.5 opacity-90">
              يمكنك طباعة هذا الإيصال أو حفظه كـ PDF للرجوع إليه لاحقاً.
            </p>
          </div>
        </div>
      )}

      <Card id="receipt" className="border-border/60 shadow-sm print:border print:shadow-none">
        <CardHeader className="gap-3 border-b border-border/60 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-xl">إيصال دفع</CardTitle>
            <Badge className="" variant={receipt.status === "paid" ? "default" : "secondary"}>
              {receipt.statusLabel}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            رقم الإيصال: <span className="font-mono text-xs">{receipt.id}</span>
          </p>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold">تفاصيل القالب</h2>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
              <p className="font-medium">{receipt.template.title}</p>
              {receipt.template.categoryName && (
                <p className="text-muted-foreground mt-1">{receipt.template.categoryName}</p>
              )}
              <p className="mt-2 text-lg font-bold text-primary">{receipt.amountFormatted}</p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">العميل</h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">الاسم</dt>
                <dd>{receipt.customer.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">البريد</dt>
                <dd className="break-all">{receipt.customer.email}</dd>
              </div>
            </dl>
          </section>

          <Separator className="" />

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">تفاصيل الدفع</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">التاريخ</dt>
                <dd>{formatDate(receipt.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">طريقة الدفع</dt>
                <dd>{paymentProviderLabel(receipt.payment.provider)}</dd>
              </div>
              {receipt.payment.trackId && (
                <div>
                  <dt className="text-muted-foreground">رقم التتبع</dt>
                  <dd className="font-mono text-xs">{receipt.payment.trackId}</dd>
                </div>
              )}
              {receipt.payment.receiptNo && (
                <div>
                  <dt className="text-muted-foreground">رقم إيصال البوابة</dt>
                  <dd className="font-mono text-xs">{receipt.payment.receiptNo}</dd>
                </div>
              )}
              {receipt.payment.transactionId && (
                <div>
                  <dt className="text-muted-foreground">رقم العملية</dt>
                  <dd className="font-mono text-xs">{receipt.payment.transactionId}</dd>
                </div>
              )}
              {receipt.payment.referenceId && (
                <div>
                  <dt className="text-muted-foreground">المرجع</dt>
                  <dd className="font-mono text-xs">{receipt.payment.referenceId}</dd>
                </div>
              )}
              {receipt.payment.authCode && (
                <div>
                  <dt className="text-muted-foreground">رمز التفويض</dt>
                  <dd className="font-mono text-xs">{receipt.payment.authCode}</dd>
                </div>
              )}
              {receipt.payment.settledAt && (
                <div>
                  <dt className="text-muted-foreground">تاريخ التسوية</dt>
                  <dd>{formatDate(receipt.payment.settledAt)}</dd>
                </div>
              )}
            </dl>
          </section>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row print:hidden">
        <Button className="flex-1 gap-2" asChild>
          <Link href={receipt.customizeUrl}>
            <Palette className="size-4" aria-hidden />
            تخصيص البطاقة
          </Link>
        </Button>
        <Button className="flex-1" variant="outline" asChild>
          <Link href={receipt.templateUrl}>عرض القالب</Link>
        </Button>
      </div>
    </main>
  );
}
