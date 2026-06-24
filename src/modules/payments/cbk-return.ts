import type { Repository } from "typeorm";
import type { Purchase } from "@/entities/Purchase";
import {
  formatCbkAmountKuwaitStyle,
  mapCbkGatewayStatus,
  type CbkTransactionDetails,
} from "./cbk-hosted";
import { getTemplateRepository } from "@/lib/db";

async function findPurchaseByTrackId(
  repo: Repository<Purchase>,
  trackId: string,
): Promise<Purchase | null> {
  return repo.findOne({ where: { paymentTrackId: trackId } });
}

export async function findPurchaseForCbkResult(
  repo: Repository<Purchase>,
  details: CbkTransactionDetails,
  payTrackFromQuery?: string | null,
): Promise<Purchase | null> {
  const udf1 = details.MerchUdf1?.trim();
  if (udf1) {
    const byTrack = await findPurchaseByTrackId(repo, udf1);
    if (byTrack) return byTrack;
    const byId = await repo.findOne({ where: { id: udf1 } });
    if (byId) return byId;
  }

  const fromQuery = payTrackFromQuery?.trim();
  if (fromQuery) {
    const byQuery = await findPurchaseByTrackId(repo, fromQuery);
    if (byQuery) return byQuery;
  }

  const merchantTrack = details.PayId?.trim();
  if (merchantTrack) {
    const byPayId = await findPurchaseByTrackId(repo, merchantTrack);
    if (byPayId) return byPayId;
  }

  const gatewayTrack = details.TrackId?.trim();
  if (gatewayTrack) {
    return findPurchaseByTrackId(repo, gatewayTrack);
  }

  return null;
}

export function cbkMerchantTrackForVerify(
  details: CbkTransactionDetails,
  payTrackFromQuery?: string | null,
): string | null {
  return (
    details.PayId?.trim() ??
    payTrackFromQuery?.trim() ??
    details.MerchUdf1?.trim() ??
    null
  );
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
