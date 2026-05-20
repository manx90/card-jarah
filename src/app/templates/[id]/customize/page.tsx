import { MissingDatabaseNotice } from "@/components/setup/missing-database";
import { auth } from "@/auth";
import { purchaseAccessStatusIn } from "@/lib/purchase-access";
import {
  getPurchaseRepository,
  getTemplateRepository,
} from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import { redirect, notFound } from "next/navigation";
import { CardCustomizer } from "./card-customizer";

export const dynamic = "force-dynamic";

export default async function CustomizePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    const { id } = await params;
    redirect(`/login?callbackUrl=/templates/${id}/customize`);
  }

  const { id } = await params;

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

  const purchased = await (await getPurchaseRepository()).exists({
    where: {
      userId: session.user.id,
      templateId: id,
      status: purchaseAccessStatusIn(),
    },
  });

  const previewUrl = `/api/v1/templates/${template.id}/preview`;

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="mb-2 break-words text-xl font-bold sm:text-2xl">
        تخصيص: {template.title}
      </h1>
      <p className="text-muted-foreground mb-8 text-sm">
        عدّل محتوى الحقول فقط (النص، القائمة، الرابط، الصورة). الخط والتنسيق من
        إعداد القالب. صدّر PNG بعد الشراء.
      </p>
      <CardCustomizer
        templateId={template.id}
        previewUrl={previewUrl}
        fieldsJson={template.fieldsJson}
        purchased={purchased}
      />
    </div>
  );
}
