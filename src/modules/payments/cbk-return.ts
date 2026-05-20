import type { Repository } from "typeorm";
import type { Purchase } from "@/entities/Purchase";
import {
  cbkResolveTrackKey,
  formatCbkAmountKuwaitStyle,
  mapCbkGatewayStatus,
  type CbkTransactionDetails,
} from "./cbk-hosted";
import { getTemplateRepository } from "@/lib/db";

export async function findPurchaseForCbkResult(
  repo: Repository<Purchase>,
  details: CbkTransactionDetails,
  payTrackFromQuery?: string | null,
): Promise<Purchase | null> {
  const purchaseId = details.MerchUdf1?.trim();
  if (purchaseId) {
    const byId = await repo.findOne({ where: { id: purchaseId } });
    if (byId) return byId;
  }

  const trackKey =
    cbkResolveTrackKey(details) ?? payTrackFromQuery?.trim() ?? null;
  if (!trackKey) return null;

  return repo.findOne({ where: { paymentTrackId: trackKey } });
}

export async function validateCbkPaidAmount(
  purchase: Purchase,
  gatewayAmount: string | undefined,
): Promise<boolean> {
  if (!gatewayAmount?.trim()) return false;
  const template = await (
    await getTemplateRepository()
  ).findOne({ where: { id: purchase.templateId } });
  if (!template) return false;
  const expected = formatCbkAmountKuwaitStyle(template.price);
  return gatewayAmount.trim() === expected;
}

export function purchaseStatusFromCbk(
  details: CbkTransactionDetails,
): Purchase["status"] {
  return mapCbkGatewayStatus(details.Status) ?? "payment_failed";
}
