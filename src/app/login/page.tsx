import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <AuthPageShell
      title="تسجيل الدخول"
      description="ادخل إلى حسابك لمتابعة مشترياتك وتخصيص بطاقاتك"
    >
      <Card className="border-border/60 shadow-sm">
        <CardContent className="pt-6">
          <LoginForm />
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
