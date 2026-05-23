import type { PurchaseStatus } from "@/entities/Purchase";

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  mock_completed: "تجريبي",
  pending_payment: "بانتظار الدفع",
  paid: "مدفوع",
  payment_failed: "فشل الدفع",
  payment_cancelled: "ملغى",
};

export const PURCHASE_STATUS_VARIANT: Record<
  PurchaseStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  mock_completed: "secondary",
  pending_payment: "outline",
  paid: "default",
  payment_failed: "destructive",
  payment_cancelled: "destructive",
};

export function purchaseStatusLabel(status: PurchaseStatus): string {
  return PURCHASE_STATUS_LABELS[status] ?? status;
}
