import { PageHero } from "@/components/layout/page-hero";
import { MissingDatabaseNotice } from "@/components/setup/missing-database";
import { auth } from "@/auth";
import { getUserRepository } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountSettingsForm } from "./account-settings-form";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account");
  }

  if (!isDatabaseConfigured()) {
    return (
      <main className="mx-auto max-w-2xl flex-1 px-4 py-8">
        <PageHero title="حسابي" description="إدارة ملفك الشخصي وكلمة المرور" />
        <MissingDatabaseNotice />
      </main>
    );
  }

  const user = await (await getUserRepository()).findOne({
    where: { id: session.user.id },
  });
  if (!user) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:py-8">
      <PageHero
        eyebrow="الحساب"
        title="حسابي"
        description="حدّث بياناتك الشخصية وكلمة المرور"
      />
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/account/designs">تصاميمي وطلباتي</Link>
        </Button>
      </div>
      <AccountSettingsForm
        email={user.email}
        initialName={user.name ?? ""}
        initialPhone={user.phone ?? ""}
      />
    </main>
  );
}
