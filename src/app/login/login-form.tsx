"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function LoginFormInner() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/templates";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    let res: Awaited<ReturnType<typeof signIn>>;
    try {
      res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
    } catch (err) {
      setLoading(false);
      console.error("[login] signIn threw:", err);
      setError("حدث خطأ أثناء الدخول. راجع الطرفية والكونسول.");
      return;
    }

    setLoading(false);

    /** NextAuth قد يُعيد `ok: true` مع `error: "CredentialsSignin"` عند فشل المصادقة — لا تعتمد على `ok` فقط */
    const authError = res?.error;
    const loggedIn = !authError;

    console.log("[login] signIn response (client):", {
      note: "Success = no `error` field. Ignore `ok` when `error` is set (NextAuth quirk).",
      loggedIn,
      ok: res?.ok,
      error: authError ?? null,
      status: res?.status,
      url: res?.url ?? null,
      code: (res as { code?: string })?.code ?? null,
      full: res,
    });

    if (!loggedIn) {
      setError(
        authError === "CredentialsSignin"
          ? "البريد أو كلمة المرور غير صحيحة، أو لا يوجد حساب بهذا البريد."
          : `فشل الدخول: ${authError}`,
      );
      return;
    }

    window.location.href = callbackUrl;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="email">البريد</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">كلمة المرور</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "جاري الدخول…" : "دخول"}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        ليس لديك حساب؟{" "}
        <Link href="/register" className="text-primary underline">
          سجّل
        </Link>
      </p>
    </form>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<p className="text-center text-sm">تحميل…</p>}>
      <LoginFormInner />
    </Suspense>
  );
}
