"use client";

import { deleteTemplateAction } from "@/app/actions/admin-template";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
import { formatPriceKwd } from "@/lib/currency";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function AdminTemplatesTable({
  rows,
}: {
  rows: {
    id: string;
    title: string;
    price: string;
    createdAt: string;
    categoryName: string;
  }[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function onDelete(id: string) {
    if (!window.confirm("حذف هذا القالب نهائياً؟")) return;
    setDeleting(id);
    const r = await deleteTemplateAction(id);
    setDeleting(null);
    if (!r.ok) {
      toast.error(r.error ?? "فشل الحذف");
      return;
    }
    toast.success("تم الحذف");
    router.refresh();
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>العنوان</TableHead>
            <TableHead>الفئة</TableHead>
            <TableHead className="text-start" dir="ltr">
              السعر
            </TableHead>
            <TableHead>تاريخ الإضافة</TableHead>
            <TableHead className="w-40 text-end">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground h-32 text-center">
                لا توجد قوالب. أنشئ قالباً جديداً
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="max-w-[12rem] font-medium break-words">
                  {r.title}
                </TableCell>
                <TableCell className="text-muted-foreground">{r.categoryName}</TableCell>
                <TableCell dir="ltr" className="tabular-nums">
                  {formatPriceKwd(r.price)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm" dir="ltr">
                  {new Date(r.createdAt).toLocaleString("ar-SA")}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    <Button size="icon-sm" variant="ghost" asChild>
                      <Link href={`/templates/${r.id}`} target="_blank" rel="noreferrer" title="عرض">
                        <ExternalLink className="size-4" />
                      </Link>
                    </Button>
                    <Button size="icon-sm" variant="ghost" asChild>
                      <Link href={`/admin/templates/${r.id}/edit`} title="تعديل">
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(r.id)}
                      disabled={deleting === r.id}
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
    </div>
  );
}
