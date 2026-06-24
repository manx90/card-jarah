"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, Download, LogIn } from "lucide-react";
import { useState } from "react";

function submitPostForm(actionUrl: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;
  form.acceptCharset = "UTF-8";
  form.style.display = "none";
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export function TemplateDetailActions({
  templateId,
  purchased,
  isLoggedIn,
  cbkEnabled,
}: {
  templateId: string;
  purchased: boolean;
  isLoggedIn: boolean;
  cbkEnabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"mock" | "cbk" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function mockPurchase() {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/templates/${templateId}`);
      return;
    }
    setBusy("mock");
    setError(null);
    try {
      const res = await fetch("/api/v1/purchases/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: { purchaseId?: string };
        error?: { message?: string };
      };
      if (!res.ok || !json.success) {
        setError(json.error?.message ?? "فشل الشراء");
        return;
      }
      if (json.data?.purchaseId) {
        router.push(`/account/purchases/${json.data.purchaseId}/receipt?payment=success`);
        return;
      }
      router.refresh();
    } catch {
      setError("خطأ في الشبكة");
    } finally {
      setBusy(null);
    }
  }

  async function cbkCheckout() {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/templates/${templateId}`);
      return;
    }
    setBusy("cbk");
    setError(null);
    try {
      const res = await fetch("/api/v1/purchases/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: { actionUrl: string; fields: Record<string, string> };
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.data) {
        setError(json.error?.message ?? "تعذّر بدء الدفع");
        return;
      }
      submitPostForm(json.data.actionUrl, json.data.fields);
    } catch {
      setError("خطأ في الشبكة");
    } finally {
      setBusy(null);
    }
  }

  if (!isLoggedIn) {
    return (
      <Button className="w-full gap-2" size="lg" asChild>
        <Link href={`/login?callbackUrl=/templates/${templateId}`}>
          <LogIn className="size-4" aria-hidden />
          سجّل للشراء
        </Link>
      </Button>
    );
  }

  if (purchased) {
    return (
      <Button className="w-full gap-2" size="lg" asChild>
        <a href={`/api/v1/templates/${templateId}/download`}>
          <Download className="size-4" aria-hidden />
          تحميل بدون علامة مائية
        </a>
      </Button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {cbkEnabled ? (
        <Button
          type="button"
          className="w-full gap-2"
          size="lg"
          disabled={busy !== null}
          onClick={() => void cbkCheckout()}
        >
          <CreditCard className="size-4" aria-hidden />
          {busy === "cbk" ? "توجيه لبوابة الدفع…" : "الدفع عبر البوابة (KNET / T-Pay)"}
        </Button>
      ) : null}
      <Button
        type="button"
        variant={cbkEnabled ? "outline" : "default"}
        className="w-full"
        size="lg"
        disabled={busy !== null}
        onClick={() => void mockPurchase()}
      >
        {busy === "mock" ? "جاري الشراء…" : "شراء وهمي (تجربة)"}
      </Button>
      {error && (
        <p className="text-destructive text-center text-xs">{error}</p>
      )}
    </div>
  );
}
