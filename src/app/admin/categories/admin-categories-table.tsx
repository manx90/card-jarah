"use client";

import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/app/actions/admin-category";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export interface AdminCategoryRow {
  id: string;
  slug: string;
  nameAr: string;
  imageUrl: string;
}

export function AdminCategoriesTable({
  initialRows,
}: {
  initialRows: AdminCategoryRow[];
}) {
  const router = useRouter();
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<AdminCategoryRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const r = await createCategoryAction(fd);
    setSaving(false);
    if (!r.ok) {
      toast.error(r.error ?? "فشل الإنشاء");
      return;
    }
    toast.success("تم إنشاء الفئة");
    setOpenCreate(false);
    e.currentTarget.reset();
    router.refresh();
  }

  async function onUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    fd.set("id", editing.id);
    const r = await updateCategoryAction(fd);
    setSaving(false);
    if (!r.ok) {
      toast.error(r.error ?? "فشل التحديث");
      return;
    }
    toast.success("تم التحديث");
    setEditing(null);
    router.refresh();
  }

  async function onDelete(id: string) {
    if (
      !window.confirm(
        "حذف هذه الفئة وجميع قوالبها؟ لا يمكن التراجع.",
      )
    )
      return;
    setDeleting(id);
    const r = await deleteCategoryAction(id);
    setDeleting(null);
    if (!r.ok) {
      toast.error(r.error ?? "فشل الحذف");
      return;
    }
    toast.success("تم الحذف");
    router.refresh();
  }

  return (
    <>
      <div className="mb-2 flex justify-end">
        <Button onClick={() => setOpenCreate(true)} className="gap-1.5">
          <Plus className="size-4" />
          فئة جديدة
        </Button>
      </div>
      <ScrollArea className="w-full max-w-full rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">الصورة</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>المعرف (slug)</TableHead>
              <TableHead className="w-32 text-end">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground h-32 text-center">
                  لا فئات
                </TableCell>
              </TableRow>
            ) : (
              initialRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={row.imageUrl}
                      alt=""
                      className="size-16 rounded-md border object-cover"
                      loading="lazy"
                    />
                  </TableCell>
                  <TableCell className="max-w-[10rem] font-medium break-words">
                    {row.nameAr}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm" dir="ltr">
                    {row.slug}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setEditing(row)}
                        title="تعديل"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete(row.id)}
                        disabled={deleting === row.id}
                        title="حذف"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <form onSubmit={onCreate} className="space-y-4">
            <DialogHeader>
              <DialogTitle>فئة جديدة</DialogTitle>
              <DialogDescription>معرّف إنجليزي فريد (مثال: eid, birthday)</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="c-slug">المعرف (slug)</Label>
              <Input id="c-slug" name="slug" required pattern="[a-z0-9-]+" placeholder="eid" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-name">الاسم بالعربية</Label>
              <Input id="c-name" name="nameAr" required placeholder="عيد" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-thumb">صورة الغلاف (اختياري)</Label>
              <Input id="c-thumb" name="thumbnail" type="file" accept="image/*" />
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "…" : "حفظ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editing != null} onOpenChange={() => setEditing(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl" key={editing?.id}>
          {editing && (
            <form onSubmit={onUpdate} className="space-y-4">
              <DialogHeader>
                <DialogTitle>تعديل الفئة</DialogTitle>
                <DialogDescription>{editing.nameAr}</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="e-slug">المعرف (slug)</Label>
                <Input
                  id="e-slug"
                  name="slug"
                  required
                  pattern="[a-z0-9-]+"
                  defaultValue={editing.slug}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-name">الاسم بالعربية</Label>
                <Input
                  id="e-name"
                  name="nameAr"
                  required
                  defaultValue={editing.nameAr}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-thumb">صورة جديدة (اختياري)</Label>
                <Input id="e-thumb" name="thumbnail" type="file" accept="image/*" />
              </div>
              <DialogFooter className="gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
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
