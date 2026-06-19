import { MissingDatabaseNotice } from "@/components/setup/missing-database";
import { TemplatePreviewImage } from "@/components/templates/template-preview-image";
import { WatermarkOverlay } from "@/components/templates/watermark-overlay";
import { auth } from "@/auth";
import { purchaseAccessStatusIn } from "@/lib/purchase-access";
import {
  getPurchaseRepository,
  getTemplateRepository,
} from "@/lib/db";
import { isCbkPaymentConfigured } from "@/modules/payments/cbk-config";
import { formatPriceKwd } from "@/lib/currency";
import { formatPaymentUserMessage } from "@/modules/payments/cbk-errors";
import { isDatabaseConfigured } from "@/lib/db-config";
import {
  buildTemplateWhatsAppMessage,
  buildWhatsAppUrl,
  getWhatsAppNumber,
} from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, FileText, MessageCircle, Palette } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TemplateDetailActions } from "./template-detail-actions";

export const dynamic = "force-dynamic";

export default async function TemplateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ payment?: string; code?: string; status?: string; msg?: string }>;
}) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};

  if (!isDatabaseConfigured()) {
    return (
      <div className="mx-auto flex max-w-4xl flex-1 flex-col items-center px-4 py-16">
        <MissingDatabaseNotice />
      </div>
    );
  }

  const template = await (await getTemplateRepository()).findOne({
    where: { id },
    relations: ["category"],
  });
  if (!template) notFound();

  const session = await auth();
  let purchased = false;
  let purchaseId: string | null = null;
  if (session?.user?.id) {
    const purchase = await (await getPurchaseRepository()).findOne({
      where: {
        userId: session.user.id,
        templateId: id,
        status: purchaseAccessStatusIn(),
      },
    });
    purchased = !!purchase;
    purchaseId = purchase?.id ?? null;
  }

  const whatsappNumber = getWhatsAppNumber();
  const whatsappUrl = whatsappNumber
    ? buildWhatsAppUrl(
        whatsappNumber,
        buildTemplateWhatsAppMessage({
          title: template.title,
          price: template.price,
          templateId: template.id,
          categoryName: template.category?.nameAr,
        }),
      )
    : null;

  const previewUrl = `/api/v1/templates/${template.id}/preview`;

  const paymentNotice =
    sp.payment === "success"
      ? {
          kind: "ok" as const,
          text: "تم الدفع بنجاح — يمكنك التحميل والتخصيص.",
          receiptUrl: purchaseId ? `/account/purchases/${purchaseId}/receipt` : null,
        }
      : sp.payment === "error"
        ? {
            kind: "err" as const,
            text:
              sp.msg ??
              formatPaymentUserMessage({
                code: sp.code,
                status: sp.status,
              }),
            receiptUrl: null,
          }
        : null;

  return (
    <main className="mx-auto w-full min-w-0 max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="gap-2 px-2" asChild>
          <Link href="/templates">
            <ArrowRight className="size-4" aria-hidden />
            العودة للقوالب
          </Link>
        </Button>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-sm">
          <div className="relative aspect-[4/3] w-full min-w-0 overflow-hidden sm:aspect-auto sm:min-h-[22rem]">
            <TemplatePreviewImage
              templateId={template.id}
              previewUrl={previewUrl}
              title={template.title}
              className="size-full object-contain"
            />
            {!purchased && <WatermarkOverlay />}
          </div>
        </div>

        <Card className="min-w-0 border-border/60 shadow-sm">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {template.category?.nameAr && (
                <Badge variant="secondary" className="">{template.category.nameAr}</Badge>
              )}
              {purchased && (
                <Badge className="bg-emerald-600/90 hover:bg-emerald-600/90">مُشترى</Badge>
              )}
            </div>
            <CardTitle className="break-words text-2xl leading-tight sm:text-3xl">
              {template.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {template.description && (
              <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
                {template.description}
              </p>
            )}

            <Separator className="bg-border/60" />

            <div className="flex items-baseline gap-2">
              <span className="text-muted-foreground text-sm">السعر</span>
              <p className="text-2xl font-bold text-primary">{formatPriceKwd(template.price)}</p>
            </div>

            {paymentNotice && (
              <div
                className={
                  paymentNotice.kind === "ok"
                    ? "rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
                    : "bg-destructive/10 text-destructive rounded-xl border border-destructive/30 px-4 py-3 text-sm"
                }
              >
                <p>{paymentNotice.text}</p>
                {paymentNotice.receiptUrl && (
                  <Link
                    href={paymentNotice.receiptUrl}
                    className="mt-2 inline-block font-medium underline"
                  >
                    عرض الإيصال وحفظه
                  </Link>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-2 sm:gap-3">
            <div className="w-full min-w-0">
              <TemplateDetailActions
                templateId={template.id}
                purchased={purchased}
                isLoggedIn={!!session}
                cbkEnabled={isCbkPaymentConfigured()}
              />
            </div>
            {session && purchased && (
              <Button className="w-full gap-2" size="lg" asChild>
                <Link href={`/templates/${template.id}/customize`}>
                  <Palette className="size-4" aria-hidden />
                  تخصيص البطاقة
                </Link>
              </Button>
            )}
            {session && purchased && purchaseId && (
              <Button className="w-full gap-2" variant="secondary" size="lg" asChild>
                <Link href={`/account/purchases/${purchaseId}/receipt`}>
                  <FileText className="size-4" aria-hidden />
                  عرض الإيصال
                </Link>
              </Button>
            )}
            {whatsappUrl && (
              <Button className="w-full gap-2" variant="outline" size="lg" asChild>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" aria-hidden />
                  استفسار عبر واتساب
                </a>
              </Button>
            )}
            {!purchased && (
              <Button className="w-full gap-2" variant="outline" size="lg" asChild>
                <Link href={`/templates/${template.id}/customize`}>
                  <Palette className="size-4" aria-hidden />
                  تجربة المحرّر
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
