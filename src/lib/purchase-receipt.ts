import type { Purchase } from "@/entities/Purchase";
import type { Template } from "@/entities/Template";
import type { User } from "@/entities/User";
import { formatPriceKwd } from "@/lib/currency";
import { purchaseStatusLabel } from "@/lib/purchase-status";
import type { CbkTransactionDetails } from "@/modules/payments/cbk-hosted";

export interface PurchaseReceiptData {
  id: string;
  createdAt: string;
  status: Purchase["status"];
  statusLabel: string;
  amount: string;
  amountFormatted: string;
  template: {
    id: string;
    title: string;
    categoryName: string | null;
  };
  customer: {
    name: string | null;
    email: string;
  };
  payment: {
    provider: string | null;
    trackId: string | null;
    receiptNo: string | null;
    transactionId: string | null;
    referenceId: string | null;
    payType: string | null;
    authCode: string | null;
    settledAt: string | null;
  };
  receiptUrl: string;
  customizeUrl: string;
  templateUrl: string;
}

function readCbkMeta(meta: Record<string, unknown> | null): CbkTransactionDetails | null {
  const raw = meta?.cbkLast;
  if (!raw || typeof raw !== "object") return null;
  return raw as CbkTransactionDetails;
}

export function buildPurchaseReceipt(
  purchase: Purchase,
  template: Template,
  user: User,
  categoryName: string | null,
): PurchaseReceiptData {
  const cbk = readCbkMeta(purchase.paymentMeta);
  const settledAt =
    typeof purchase.paymentMeta?.cbkSettledAt === "string"
      ? purchase.paymentMeta.cbkSettledAt
      : null;

  return {
    id: purchase.id,
    createdAt: purchase.createdAt.toISOString(),
    status: purchase.status,
    statusLabel: purchaseStatusLabel(purchase.status),
    amount: template.price,
    amountFormatted: formatPriceKwd(template.price),
    template: {
      id: template.id,
      title: template.title,
      categoryName,
    },
    customer: {
      name: user.name,
      email: user.email,
    },
    payment: {
      provider: purchase.paymentProvider,
      trackId: purchase.paymentTrackId ?? cbk?.TrackId ?? cbk?.PayId ?? null,
      receiptNo: cbk?.ReceiptNo ?? null,
      transactionId: cbk?.TransactionId ?? cbk?.PaymentId ?? null,
      referenceId: cbk?.ReferenceId ?? null,
      payType: cbk?.PayType ?? null,
      authCode: cbk?.AuthCode ?? null,
      settledAt,
    },
    receiptUrl: `/account/purchases/${purchase.id}/receipt`,
    customizeUrl: `/templates/${template.id}/customize`,
    templateUrl: `/templates/${template.id}`,
  };
}
