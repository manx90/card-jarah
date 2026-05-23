"use client";

import {
  changeMyPasswordAction,
  updateMyProfileAction,
} from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Lock, Mail, Phone, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface AccountSettingsFormProps {
  email: string;
  initialName: string;
  initialPhone: string;
}

export function AccountSettingsForm({
  email,
  initialName,
  initialPhone,
}: AccountSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  async function onProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    const r = await updateMyProfileAction({ name, phone });
    setProfileSaving(false);
    if (!r.ok) {
      toast.error(r.error ?? "فشل الحفظ");
      return;
    }
    toast.success("تم تحديث الملف الشخصي");
    router.refresh();
  }

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }
    setPasswordSaving(true);
    const r = await changeMyPasswordAction({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    setPasswordSaving(false);
    if (!r.ok) {
      toast.error(r.error ?? "فشل تغيير كلمة المرور");
      return;
    }
    toast.success("تم تغيير كلمة المرور");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">الملف الشخصي</CardTitle>
          <CardDescription className="">حدّث اسمك ومعلومات التواصل</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-email">البريد</Label>
              <div className="relative">
                <Mail className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
                <Input
                  id="account-email"
                  type="email"
                  className="bg-muted/50 ps-9"
                  value={email}
                  disabled
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-name">الاسم الكامل</Label>
              <div className="relative">
                <User className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
                <Input
                  id="account-name"
                  required
                  minLength={2}
                  className="ps-9"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-phone">رقم الهاتف</Label>
              <div className="relative">
                <Phone className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
                <Input
                  id="account-phone"
                  type="tel"
                  className="ps-9"
                  placeholder="+965 ..."
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" disabled={profileSaving} className="gap-2">
              {profileSaving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              حفظ التغييرات
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">كلمة المرور</CardTitle>
          <CardDescription className="">غيّر كلمة المرور بأمان</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onPasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">كلمة المرور الحالية</Label>
              <div className="relative">
                <Lock className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="ps-9"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
            </div>
            <Separator className="bg-border/60" />
            <div className="space-y-2">
              <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Lock className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="ps-9"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">تأكيد كلمة المرور</Label>
              <div className="relative">
                <Lock className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
                <Input
                  id="confirm-new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="ps-9"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" variant="outline" disabled={passwordSaving} className="gap-2">
              {passwordSaving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              تغيير كلمة المرور
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
