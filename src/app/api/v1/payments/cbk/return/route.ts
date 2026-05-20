import { getAppPublicBaseUrl, getCbkCredentials } from "@/modules/payments/cbk-config";
import {
  cbkGetTransactions,
  cbkVerifyByTrackId,
  getCbkAccessToken,
} from "@/modules/payments/cbk-hosted";
import {
  findPurchaseForCbkResult,
  purchaseStatusFromCbk,
  validateCbkPaidAmount,
} from "@/modules/payments/cbk-return";
import { clearCachedCbkAccessToken } from "@/modules/payments/cbk-token-cache";
import { getPurchaseRepository } from "@/lib/db";
import { NextResponse } from "next/server";

function redirectTo(pathWithQuery: string) {
  const base = getAppPublicBaseUrl();
  return NextResponse.redirect(new URL(pathWithQuery, base));
}

export async function GET(request: Request) {
  try {
    getAppPublicBaseUrl();
  } catch {
    return new NextResponse("APP_URL غير مُعرَّف", { status: 500 });
  }

  const url = new URL(request.url);
  const encrp = url.searchParams.get("encrp");
  const errorCode = url.searchParams.get("ErrorCode");
  const payTrackIdParam = url.searchParams.get("PayTrackID");

  if (errorCode) {
    const tid = payTrackIdParam ?? "";
    if (tid) {
      try {
        const repo = await getPurchaseRepository();
        const p = await repo.findOne({ where: { paymentTrackId: tid } });
        if (p) {
          p.status = "payment_failed";
          p.paymentMeta = {
            ...(p.paymentMeta ?? {}),
            cbkErrorCode: errorCode,
          };
          await repo.save(p);
          return redirectTo(
            `/templates/${p.templateId}?payment=error&code=${encodeURIComponent(errorCode)}`,
          );
        }
      } catch (e) {
        console.error("[cbk return error path]", e);
      }
    }
    return redirectTo(`/templates?payment=error&code=${encodeURIComponent(errorCode)}`);
  }

  if (!encrp?.trim()) {
    return redirectTo("/templates?payment=error&code=MISSING_ENCRP");
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
      clearCachedCbkAccessToken();
      details = await fetchDetails();
    }

    const repo = await getPurchaseRepository();
    let purchase = await findPurchaseForCbkResult(
      repo,
      details,
      payTrackIdParam,
    );

    let nextStatus = purchaseStatusFromCbk(details);

    if (purchase && nextStatus === "paid") {
      const amountOk = await validateCbkPaidAmount(purchase, details.Amount);
      if (!amountOk) {
        nextStatus = "payment_failed";
        details = {
          ...details,
          Message: "AMOUNT_MISMATCH",
        };
      }
    }

    if (purchase) {
      purchase.status = nextStatus;
      purchase.paymentMeta = {
        ...(purchase.paymentMeta ?? {}),
        cbkLast: details as unknown as Record<string, unknown>,
      };
      await repo.save(purchase);
      if (nextStatus === "paid") {
        return redirectTo(`/templates/${purchase.templateId}?payment=success`);
      }
      return redirectTo(
        `/templates/${purchase.templateId}?payment=error&status=${encodeURIComponent(details.Status ?? "")}`,
      );
    }

    const payId = details.PayId?.trim() ?? details.TrackId?.trim() ?? "";
    if (payId) {
      clearCachedCbkAccessToken();
      const token2 = await getCbkAccessToken(creds);
      const v = await cbkVerifyByTrackId(creds, payId, token2);
      const st = purchaseStatusFromCbk(v);
      const p2 = await findPurchaseForCbkResult(repo, v, payTrackIdParam);
      if (p2 && st) {
        let finalStatus = st;
        if (st === "paid") {
          const amountOk = await validateCbkPaidAmount(p2, v.Amount);
          if (!amountOk) finalStatus = "payment_failed";
        }
        p2.status = finalStatus;
        p2.paymentMeta = {
          ...(p2.paymentMeta ?? {}),
          cbkVerify: v as unknown as Record<string, unknown>,
        };
        await repo.save(p2);
        if (finalStatus === "paid") {
          return redirectTo(`/templates/${p2.templateId}?payment=success`);
        }
        return redirectTo(
          `/templates/${p2.templateId}?payment=error&status=${encodeURIComponent(v.Status ?? "")}`,
        );
      }
    }

    return redirectTo("/templates?payment=error&code=UNKNOWN_PURCHASE");
  } catch (e) {
    console.error("[cbk return]", e);
    return redirectTo("/templates?payment=error&code=SERVER");
  }
}
