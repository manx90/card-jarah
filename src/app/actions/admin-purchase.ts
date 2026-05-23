"use server";

import { auth } from "@/auth";
import type { PurchaseStatus } from "@/entities/Purchase";
import { getPurchaseRepository } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";

export interface MutationResult {
  ok: boolean;
  error?: string;
}

const ALLOWED_STATUSES: PurchaseStatus[] = [
  "mock_completed",
  "pending_payment",
  "paid",
  "payment_failed",
  "payment_cancelled",
];

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { ok: false, error: "غير مصرّح" };
  }
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "قاعدة البيانات غير مهيأة" };
  }
  return { ok: true };
}

export async function updatePurchaseStatusAction(
  purchaseId: string,
  status: PurchaseStatus,
): Promise<MutationResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  const id = String(purchaseId ?? "").trim();
  if (!id) return { ok: false, error: "معرّف غير صالح" };
  if (!ALLOWED_STATUSES.includes(status)) {
    return { ok: false, error: "حالة غير صالحة" };
  }

  try {
    const repo = await getPurchaseRepository();
    const purchase = await repo.findOne({ where: { id } });
    if (!purchase) return { ok: false, error: "الطلب غير موجود" };

    purchase.status = status;
    await repo.save(purchase);
    return { ok: true };
  } catch (e) {
    console.error("[updatePurchaseStatusAction]", e);
    return { ok: false, error: "تعذّر تحديث حالة الطلب" };
  }
}

export async function deletePurchaseAction(purchaseId: string): Promise<MutationResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  const id = String(purchaseId ?? "").trim();
  if (!id) return { ok: false, error: "معرّف غير صالح" };

  try {
    const repo = await getPurchaseRepository();
    const purchase = await repo.findOne({ where: { id } });
    if (!purchase) return { ok: false, error: "الطلب غير موجود" };

    await repo.remove(purchase);
    return { ok: true };
  } catch (e) {
    console.error("[deletePurchaseAction]", e);
    return { ok: false, error: "تعذّر حذف الطلب" };
  }
}
