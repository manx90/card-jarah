import { MissingDatabaseNotice } from "@/components/setup/missing-database";
import { auth } from "@/auth";
import { isDatabaseConfigured } from "@/lib/db-config";
import { redirect } from "next/navigation";
import { AccountDesignsClient } from "./account-designs-client";

export const dynamic = "force-dynamic";

export default async function AccountDesignsPage() {
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

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-8">
      <AccountDesignsClient />
    </main>
  );
}
