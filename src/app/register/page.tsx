import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <AuthPageShell
      title="إنشاء حساب"
      description="أنشئ حساباً جديداً للشراء وتخصيص بطاقات التهنئة"
    >
      <Card className="border-border/60 shadow-sm">
        <CardContent className="pt-6">
          <RegisterForm />
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
