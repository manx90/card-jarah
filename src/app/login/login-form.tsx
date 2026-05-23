"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

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
    } catch {
      setLoading(false);
      setError("حدث خطأ أثناء الدخول. حاول مرة أخرى.");
      return;
    }

    setLoading(false);
    const authError = res?.error;
    if (authError) {
      setError(
        authError === "CredentialsSignin"
          ? "البريد أو كلمة المرور غير صحيحة."
          : `فشل الدخول: ${authError}`,
      );
      return;
    }

    window.location.href = callbackUrl;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <div className="relative">
          <Mail className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="ps-9"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">كلمة المرور</Label>
        <div className="relative">
          <Lock className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            className="ps-9"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>
      {error && (
        <p className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm">{error}</p>
      )}
      <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            جاري الدخول…
          </>
        ) : (
          "دخول"
        )}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        ليس لديك حساب؟{" "}
        <Link href="/register" className="text-primary font-medium hover:underline">
          إنشاء حساب
        </Link>
      </p>
    </form>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-center text-sm">تحميل…</p>}>
      <LoginFormInner />
    </Suspense>
  );
}
