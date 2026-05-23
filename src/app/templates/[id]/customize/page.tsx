import { MissingDatabaseNotice } from "@/components/setup/missing-database";
import { auth } from "@/auth";
import { purchaseAccessStatusIn } from "@/lib/purchase-access";
import {
  getPurchaseRepository,
  getTemplateRepository,
} from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CardCustomizer } from "./card-customizer";

export const dynamic = "force-dynamic";

export default async function CustomizePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ design?: string }>;
}) {
  const session = await auth();
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

  let purchased = false;
  if (session?.user?.id) {
    purchased = await (await getPurchaseRepository()).exists({
      where: {
        userId: session.user.id,
        templateId: id,
        status: purchaseAccessStatusIn(),
      },
    });
  }

  const previewUrl = `/api/v1/templates/${template.id}/preview`;

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 gap-2 px-2" asChild>
            <Link href={`/templates/${template.id}`}>
              <ArrowRight className="size-4" />
              العودة للقالب
            </Link>
          </Button>
          <h1 className="break-words text-xl font-bold sm:text-2xl">
            محرّر: {template.title}
          </h1>
      <p className="text-muted-foreground mt-1 text-sm">
        عدّل النص والخط والصوت — انقر على أي حقل نصي لتنسيق الخط بالكامل
      </p>
        </div>
        {session && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/account/designs">تصاميمي</Link>
          </Button>
        )}
      </div>

      <CardCustomizer
        templateId={template.id}
        templateTitle={template.title}
        previewUrl={previewUrl}
        fieldsJson={template.fieldsJson}
        purchased={purchased}
        userId={session?.user?.id ?? null}
        initialDesignId={sp.design ?? null}
      />
    </div>
  );
}
