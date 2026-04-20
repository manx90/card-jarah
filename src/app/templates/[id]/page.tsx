import { MissingDatabaseNotice } from "@/components/setup/missing-database";
import { auth } from "@/auth";
import {
  getPurchaseRepository,
  getTemplateRepository,
} from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TemplateDetailActions } from "./template-detail-actions";

export const dynamic = "force-dynamic";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const session = await auth();
  let purchased = false;
  if (session?.user?.id) {
    purchased = await (await getPurchaseRepository()).exists({
      where: {
        userId: session.user.id,
        templateId: id,
        status: "mock_completed",
      },
    });
  }

  const previewUrl = `/api/v1/templates/${template.id}/preview`;

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <div className="grid min-w-0 gap-8 md:grid-cols-2 md:items-start">
        <div className="bg-muted relative min-w-0 overflow-hidden rounded-xl border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt=""
            className="block h-auto w-full max-w-full object-contain"
          />
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <span className="text-foreground/20 rotate-[-20deg] text-3xl font-bold tracking-widest sm:text-4xl">
              معاينة
            </span>
          </div>
        </div>
        <Card className="min-w-0">
          <CardHeader>
            <p className="text-muted-foreground text-sm">
              {template.category?.nameAr}
            </p>
            <CardTitle className="break-words text-2xl">{template.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {template.description && (
              <p className="text-muted-foreground text-sm leading-relaxed">
                {template.description}
              </p>
            )}
            <p className="text-lg font-semibold">{template.price} ر.س</p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:gap-3 md:flex-row md:flex-wrap">
            <Button variant="outline" className="w-full shrink-0 md:min-w-[8rem] md:flex-1" asChild>
              <Link href="/templates">رجوع</Link>
            </Button>
            <div className="w-full min-w-0 md:min-w-[10rem] md:flex-1">
              <TemplateDetailActions
                templateId={template.id}
                purchased={purchased}
                isLoggedIn={!!session}
              />
            </div>
            {session && (
              <Button className="w-full shrink-0 md:min-w-[8rem] md:flex-1" asChild>
                <Link href={`/templates/${template.id}/customize`}>تخصيص</Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
