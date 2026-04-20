"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function TemplateDetailActions({
  templateId,
  purchased,
  isLoggedIn,
}: {
  templateId: string;
  purchased: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function mockPurchase() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/purchases/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        error?: { message?: string };
      };
      if (!res.ok || !json.success) {
        setError(json.error?.message ?? "فشل الشراء");
        return;
      }
      router.refresh();
    } catch {
      setError("خطأ في الشبكة");
    } finally {
      setLoading(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <Button className="w-full sm:flex-1" asChild>
        <Link href={`/login?callbackUrl=/templates/${templateId}`}>سجّل للشراء</Link>
      </Button>
    );
  }

  if (purchased) {
    return (
      <Button className="w-full sm:flex-1" asChild>
        <a href={`/api/v1/templates/${templateId}/download`}>تحميل بدون علامة</a>
      </Button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-1">
      <Button
        type="button"
        className="w-full"
        disabled={loading}
        onClick={() => void mockPurchase()}
      >
        {loading ? "جاري الشراء…" : "شراء (وهمي)"}
      </Button>
      {error && (
        <p className="text-destructive text-center text-xs">{error}</p>
      )}
    </div>
  );
}
