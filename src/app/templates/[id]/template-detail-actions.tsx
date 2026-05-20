"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
      setBusy(null);
    }
  }

  async function cbkCheckout() {
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
      {cbkEnabled ? (
        <Button
          type="button"
          className="w-full"
          disabled={busy !== null}
          onClick={() => void cbkCheckout()}
        >
          {busy === "cbk" ? "توجيه لبوابة الدفع…" : "الدفع عبر البوابة (KNET / T-Pay)"}
        </Button>
      ) : null}
      <Button
        type="button"
        variant={cbkEnabled ? "outline" : "default"}
        className="w-full"
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
