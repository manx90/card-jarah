import { withApiHandler } from "@/lib/api-route";
import type { Purchase } from "@/entities/Purchase";
import { getPurchaseRepository } from "@/lib/db";
import { getAppPublicBaseUrl, getCbkCredentials } from "@/modules/payments/cbk-config";
import {
  formatPaymentUserMessage,
  resolveCbkPaymentStatus,
} from "@/modules/payments/cbk-errors";
import {
  cbkGetTransactions,
  cbkVerifyByTrackId,
  getCbkAccessToken,
  type CbkTransactionDetails,
} from "@/modules/payments/cbk-hosted";
import {
  cbkMerchantTrackForVerify,
  findPurchaseForCbkResult,
  purchaseStatusFromCbk,
  validateCbkPaidAmount,
} from "@/modules/payments/cbk-return";
import { logPaymentError } from "@/modules/payments/payment-error-log";
import {
  cbkTokenCacheKey,
  clearCachedCbkAccessToken,
} from "@/modules/payments/cbk-token-cache";
import { NextResponse } from "next/server";

function redirectTo(pathWithQuery: string) {
  const base = getAppPublicBaseUrl();
  return NextResponse.redirect(new URL(pathWithQuery, base));
}

function errorRedirect(
  templateId: string | null,
  input: { code?: string; status?: string; gatewayMessage?: string },
) {
  const q = new URLSearchParams({ payment: "error" });
  if (input.code) q.set("code", input.code);
  if (input.status) q.set("status", input.status);
  const msg = formatPaymentUserMessage(input);
  if (msg) q.set("msg", msg.slice(0, 200));
  const path = templateId
    ? `/templates/${templateId}?${q.toString()}`
    : `/templates?${q.toString()}`;
  return redirectTo(path);
}

async function persistPurchaseFailure(
  purchase: { id: string; templateId: string; paymentMeta: Record<string, unknown> | null },
  patch: Record<string, unknown>,
) {
  const repo = await getPurchaseRepository();
  const row = await repo.findOne({ where: { id: purchase.id } });
  if (!row) return;
  row.status = "payment_failed";
  row.paymentMeta = { ...(row.paymentMeta ?? {}), ...patch };
  await repo.save(row);
}

export const GET = withApiHandler("v1.payments.cbk.return", async (request: Request) => {
  try {
    getAppPublicBaseUrl();
  } catch {
    await logPaymentError({ phase: "misconfigured", code: "APP_URL" });
    return new NextResponse("APP_URL غير مُعرَّف", { status: 500 });
  }

  const url = new URL(request.url);
  const encrp = url.searchParams.get("encrp");
  const errorCode = url.searchParams.get("ErrorCode");
  const payTrackIdParam = url.searchParams.get("PayTrackID");

  if (errorCode) {
    await logPaymentError({
      phase: "return_redirect",
      code: errorCode,
      paymentTrackId: payTrackIdParam ?? undefined,
      raw: {
        ErrorCode: errorCode,
        PayTrackID: payTrackIdParam,
      },
    });

    const tid = payTrackIdParam ?? "";
    if (tid) {
      try {
        const repo = await getPurchaseRepository();
        const p = await repo.findOne({ where: { paymentTrackId: tid } });
        if (p) {
          await persistPurchaseFailure(p, {
            cbkErrorCode: errorCode,
            cbkErrorAt: new Date().toISOString(),
          });
          return errorRedirect(p.templateId, { code: errorCode });
        }
      } catch (e) {
        await logPaymentError({
          phase: "return_redirect",
          code: errorCode,
          paymentTrackId: tid,
          error: e,
        });
      }
    }
    return errorRedirect(null, { code: errorCode });
  }

  if (!encrp?.trim()) {
    await logPaymentError({
      phase: "return_redirect",
      code: "MISSING_ENCRP",
      paymentTrackId: payTrackIdParam ?? undefined,
    });
    return errorRedirect(null, { code: "MISSING_ENCRP" });
  }

  try {
    const creds = getCbkCredentials();
    const fetchDetails = async () => {
      const token = await getCbkAccessToken(creds);
      return cbkGetTransactions(creds, encrp.trim(), token);
    };

    let details = await fetchDetails();
    if (
      details.Status === "0" ||
      (details.Message?.toLowerCase().includes("invalid") &&
        details.Status !== "1")
    ) {
      clearCachedCbkAccessToken(cbkTokenCacheKey(creds.clientId));
      details = await fetchDetails();
    }

    const repo = await getPurchaseRepository();
    const purchase = await findPurchaseForCbkResult(
      repo,
      details,
      payTrackIdParam,
    );

    let nextStatus = purchaseStatusFromCbk(details);

    if (purchase && nextStatus === "paid") {
      const amountOk = await validateCbkPaidAmount(purchase, details.Amount);
      if (!amountOk) {
        nextStatus = "payment_failed";
        await logPaymentError({
          phase: "amount_mismatch",
          code: "AMOUNT_MISMATCH",
          purchaseId: purchase.id,
          templateId: purchase.templateId,
          paymentTrackId: purchase.paymentTrackId ?? undefined,
          amount: details.Amount,
          gatewayStatus: details.Status,
          raw: details as unknown as Record<string, unknown>,
        });
        details = { ...details, Message: "AMOUNT_MISMATCH" };
      }
    }

    if (purchase) {
      return await finalizePurchase(
        purchase,
        details,
        nextStatus,
        payTrackIdParam,
      );
    }

    const payId = cbkMerchantTrackForVerify(details, payTrackIdParam) ?? "";
    if (payId) {
      clearCachedCbkAccessToken(cbkTokenCacheKey(creds.clientId));
      const token2 = await getCbkAccessToken(creds);
      const v = await cbkVerifyByTrackId(creds, payId, token2);
      const st = purchaseStatusFromCbk(v);
      const p2 = await findPurchaseForCbkResult(repo, v, payTrackIdParam);
      if (p2 && st) {
        let finalStatus = st;
        if (st === "paid") {
          const amountOk = await validateCbkPaidAmount(p2, v.Amount);
          if (!amountOk) {
            finalStatus = "payment_failed";
            await logPaymentError({
              phase: "amount_mismatch",
              code: "AMOUNT_MISMATCH",
              purchaseId: p2.id,
              templateId: p2.templateId,
              paymentTrackId: p2.paymentTrackId ?? undefined,
              amount: v.Amount,
              gatewayStatus: v.Status,
              raw: v as unknown as Record<string, unknown>,
            });
          }
        }
        return await finalizePurchase(p2, v, finalStatus, payTrackIdParam, {
          cbkVerify: v,
        });
      }
    }

    await logPaymentError({
      phase: "unknown_purchase",
      code: "UNKNOWN_PURCHASE",
      paymentTrackId: payTrackIdParam ?? undefined,
      gatewayStatus: details.Status,
      gatewayMessage: details.Message,
      encrpPresent: true,
      raw: details as unknown as Record<string, unknown>,
    });
    return errorRedirect(null, {
      code: "UNKNOWN_PURCHASE",
      status: details.Status,
      gatewayMessage: details.Message,
    });
  } catch (e) {
    await logPaymentError({
      phase: "server",
      code: "SERVER",
      error: e,
      encrpPresent: !!encrp?.trim(),
      paymentTrackId: payTrackIdParam ?? undefined,
    });
    return errorRedirect(null, { code: "SERVER" });
  }
});

async function finalizePurchase(
  purchase: Purchase,
  details: CbkTransactionDetails,
  nextStatus: Purchase["status"],
  payTrackIdParam: string | null,
  extraMeta?: Record<string, unknown>,
) {
  const repo = await getPurchaseRepository();
  purchase.status = nextStatus;
  purchase.paymentMeta = {
    ...(purchase.paymentMeta ?? {}),
    cbkLast: details as unknown as Record<string, unknown>,
    cbkSettledAt: new Date().toISOString(),
    ...extraMeta,
  };
  await repo.save(purchase);

  if (nextStatus === "paid") {
    return redirectTo(`/account/purchases/${purchase.id}/receipt?payment=success`);
  }

  const statusInfo = resolveCbkPaymentStatus(details.Status);
  await logPaymentError({
    phase: "return_settle",
    gatewayStatus: details.Status,
    gatewayMessage: details.Message ?? statusInfo?.messageAr,
    purchaseId: purchase.id,
    templateId: purchase.templateId,
    paymentTrackId: purchase.paymentTrackId ?? payTrackIdParam ?? undefined,
    amount: details.Amount,
    payType: details.PayType,
    raw: details as unknown as Record<string, unknown>,
  });

  return errorRedirect(purchase.templateId, {
    status: details.Status,
    gatewayMessage: details.Message,
  });
}
