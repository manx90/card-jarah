"use client";

import {
  deletePurchaseAction,
  updatePurchaseStatusAction,
} from "@/app/actions/admin-purchase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { PurchaseStatus } from "@/entities/Purchase";
import {
  PURCHASE_STATUS_LABELS,
  PURCHASE_STATUS_VARIANT,
} from "@/lib/purchase-status";
import { ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export interface AdminOrderRow {
  id: string;
  userName: string | null;
  userEmail: string;
  templateTitle: string;
  templateId: string;
  status: PurchaseStatus;
  paymentProvider: string | null;
  paymentTrackId: string | null;
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

const ALL_STATUSES = Object.keys(PURCHASE_STATUS_LABELS) as PurchaseStatus[];

export function AdminOrdersTable({ initialRows }: { initialRows: AdminOrderRow[] }) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function onStatusChange(purchaseId: string, status: PurchaseStatus) {
    setUpdating(purchaseId);
    const r = await updatePurchaseStatusAction(purchaseId, status);
    setUpdating(null);
    if (!r.ok) {
      toast.error(r.error ?? "فشل التحديث");
      return;
    }
    toast.success("تم تحديث حالة الطلب");
    router.refresh();
  }

  async function onDelete(id: string) {
    if (!window.confirm("حذف هذا الطلب؟ لا يمكن التراجع.")) return;
    setDeleting(id);
    const r = await deletePurchaseAction(id);
    setDeleting(null);
    if (!r.ok) {
      toast.error(r.error ?? "فشل الحذف");
      return;
    }
    toast.success("تم حذف الطلب");
    router.refresh();
  }

  return (
    <ScrollArea className="w-full max-w-full rounded-xl border">
      <Table>
        <TableHeader>
            <TableRow>
              <TableHead>العميل</TableHead>
              <TableHead>القالب</TableHead>
            <TableHead className="w-40">الحالة</TableHead>
            <TableHead className="w-36">الدفع</TableHead>
            <TableHead className="w-44">التاريخ</TableHead>
            <TableHead className="w-24 text-end">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground h-32 text-center">
                لا طلبات بعد
              </TableCell>
            </TableRow>
          ) : (
            initialRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="min-w-0">
                    <p className="font-medium">{row.userName?.trim() || "—"}</p>
                    <p className="text-muted-foreground max-w-[10rem] truncate text-xs" dir="ltr">
                      {row.userEmail}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/templates/${row.templateId}`}
                    className="hover:text-primary inline-flex max-w-[12rem] items-center gap-1 font-medium break-words transition-colors"
                  >
                    <span className="line-clamp-2">{row.templateTitle}</span>
                    <ExternalLink className="size-3 shrink-0 opacity-60" aria-hidden />
                  </Link>
                </TableCell>
                <TableCell>
                  <Select
                    value={row.status}
                    disabled={updating === row.id}
                    onValueChange={(v) => void onStatusChange(row.id, v as PurchaseStatus)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder={PURCHASE_STATUS_LABELS[row.status]} />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {PURCHASE_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge
                    variant={PURCHASE_STATUS_VARIANT[row.status]}
                    className="mt-1.5 w-fit text-xs sm:hidden"
                  >
                    {PURCHASE_STATUS_LABELS[row.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  <div className="space-y-0.5">
                    <p>{row.paymentProvider ?? "—"}</p>
                    {row.paymentTrackId && (
                      <p className="font-mono truncate" dir="ltr" title={row.paymentTrackId}>
                        {row.paymentTrackId}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(row.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      title="حذف"
                      disabled={deleting === row.id}
                      onClick={() => void onDelete(row.id)}
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
  );
}
