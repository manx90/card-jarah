"use client";

import {
  createUserAction,
  deleteUserAction,
  resetUserPasswordAction,
  updateUserProfileAction,
  updateUserRoleAction,
} from "@/app/actions/admin-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserRole } from "@/entities/User";
import { KeyRound, Pencil, Plus, Shield, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export interface AdminAccountRow {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("ar-KW", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdminAccountsTable({
  initialRows,
  currentUserId,
}: {
  initialRows: AdminAccountRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [openCreate, setOpenCreate] = useState(false);
  const [createRole, setCreateRole] = useState<UserRole>("user");
  const [editTarget, setEditTarget] = useState<AdminAccountRow | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminAccountRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);

  async function onRoleChange(userId: string, role: UserRole) {
    setRoleUpdating(userId);
    const r = await updateUserRoleAction(userId, role);
    setRoleUpdating(null);
    if (!r.ok) {
      toast.error(r.error ?? "فشل التحديث");
      return;
    }
    toast.success("تم تحديث الدور");
    router.refresh();
  }

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirmPassword") ?? "");
    if (password !== confirm) {
      setSaving(false);
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }
    const r = await createUserAction({
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? "") || undefined,
      password,
      confirmPassword: confirm,
      role: createRole,
    });
    setSaving(false);
    if (!r.ok) {
      toast.error(r.error ?? "فشل الإنشاء");
      return;
    }
    toast.success("تم إنشاء الحساب");
    setOpenCreate(false);
    setCreateRole("user");
    e.currentTarget.reset();
    router.refresh();
  }

  async function onEditProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const r = await updateUserProfileAction(editTarget.id, {
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? "") || undefined,
    });
    setSaving(false);
    if (!r.ok) {
      toast.error(r.error ?? "فشل التحديث");
      return;
    }
    toast.success("تم تحديث البيانات");
    setEditTarget(null);
    router.refresh();
  }

  async function onResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    if (newPassword !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }
    setSaving(true);
    const r = await resetUserPasswordAction(resetTarget.id, newPassword, confirmPassword);
    setSaving(false);
    if (!r.ok) {
      toast.error(r.error ?? "فشل إعادة التعيين");
      return;
    }
    toast.success("تم تحديث كلمة المرور");
    setResetTarget(null);
    setNewPassword("");
    setConfirmPassword("");
  }

  async function onDelete(id: string, label: string) {
    if (!window.confirm(`حذف الحساب ${label}؟ سيتم حذف مشترياته أيضاً.`)) return;
    setDeleting(id);
    const r = await deleteUserAction(id);
    setDeleting(null);
    if (!r.ok) {
      toast.error(r.error ?? "فشل الحذف");
      return;
    }
    toast.success("تم حذف الحساب");
    router.refresh();
  }

  return (
    <>
      <div className="mb-2 flex justify-end">
        <Button onClick={() => setOpenCreate(true)} className="gap-1.5">
          <Plus className="size-4" />
          حساب جديد
        </Button>
      </div>

      <ScrollArea className="w-full max-w-full rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>البريد</TableHead>
              <TableHead className="w-32">الهاتف</TableHead>
              <TableHead className="w-32">الدور</TableHead>
              <TableHead className="w-40">التسجيل</TableHead>
              <TableHead className="w-36 text-end">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground h-32 text-center">
                  لا حسابات
                </TableCell>
              </TableRow>
            ) : (
              initialRows.map((row) => {
                const isSelf = row.id === currentUserId;
                const displayName = row.name?.trim() || "—";
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserRound className="text-muted-foreground size-4 shrink-0" aria-hidden />
                        <span className="font-medium">{displayName}</span>
                        {isSelf && (
                          <Badge variant="outline" className="shrink-0 text-xs">
                            أنت
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[10rem] break-all text-sm" dir="ltr">
                      {row.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm" dir="ltr">
                      {row.phone ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.role}
                        disabled={roleUpdating === row.id || (isSelf && row.role === "admin")}
                        onValueChange={(v) => void onRoleChange(row.id, v as UserRole)}
                      >
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">مستخدم</SelectItem>
                          <SelectItem value="admin">مدير</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(row.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          title="تعديل"
                          onClick={() => setEditTarget(row)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          title="إعادة تعيين كلمة المرور"
                          onClick={() => {
                            setResetTarget(row);
                            setNewPassword("");
                            setConfirmPassword("");
                          }}
                        >
                          <KeyRound className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          title="حذف"
                          disabled={isSelf || deleting === row.id}
                          onClick={() => void onDelete(row.id, displayName)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="text-muted-foreground mt-3 flex items-center gap-2 text-xs">
        <Shield className="size-3.5" aria-hidden />
        كل حساب يحتوي على اسم، بريد، هاتف اختياري، وكلمة مرور.
      </div>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <form onSubmit={onCreate} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="">حساب جديد</DialogTitle>
              <DialogDescription className="">إنشاء مستخدم أو مدير</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="c-name">الاسم</Label>
              <Input id="c-name" name="name" required minLength={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-email">البريد</Label>
              <Input id="c-email" name="email" type="email" required dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-phone">الهاتف (اختياري)</Label>
              <Input id="c-phone" name="phone" type="tel" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>الدور</Label>
              <Select value={createRole} onValueChange={(v) => setCreateRole(v as UserRole)}>
                <SelectTrigger className="">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">مستخدم</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-password">كلمة المرور</Label>
              <Input id="c-password" name="password" type="password" required minLength={8} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-confirm">تأكيد كلمة المرور</Label>
              <Input id="c-confirm" name="confirmPassword" type="password" required minLength={8} />
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "…" : "إنشاء"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editTarget != null} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl" key={editTarget?.id}>
          {editTarget && (
            <form onSubmit={onEditProfile} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="">تعديل الحساب</DialogTitle>
                <DialogDescription className="" dir="ltr">
                  {editTarget.email}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="e-name">الاسم</Label>
                <Input
                  id="e-name"
                  name="name"
                  required
                  minLength={2}
                  defaultValue={editTarget.name ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-phone">الهاتف</Label>
                <Input
                  id="e-phone"
                  name="phone"
                  type="tel"
                  dir="ltr"
                  defaultValue={editTarget.phone ?? ""}
                />
              </div>
              <DialogFooter className="gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "…" : "حفظ"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={resetTarget != null} onOpenChange={() => setResetTarget(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          {resetTarget && (
            <form onSubmit={onResetPassword} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="">إعادة تعيين كلمة المرور</DialogTitle>
                <DialogDescription className="">
                  {resetTarget.name ?? resetTarget.email}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                <Input
                  id="new-password"
                  type="password"
                  minLength={8}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <DialogFooter className="gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setResetTarget(null)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "…" : "حفظ"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
