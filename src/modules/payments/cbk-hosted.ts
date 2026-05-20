import { Buffer } from "node:buffer";
import type { CbkCredentials } from "./cbk-config";
import {
  clearCachedCbkAccessToken,
  readCachedCbkAccessToken,
  writeCachedCbkAccessToken,
} from "./cbk-token-cache";

function basicAuthHeader(clientId: string, clientSecret: string): string {
  const raw = `${clientId}:${clientSecret}`;
  const b64 = Buffer.from(raw, "utf8").toString("base64");
  return `Basic ${b64}`;
}

export interface CbkTransactionDetails {
  Status: string;
  Message?: string;
  Amount?: string;
  AuthCode?: string;
  PaymentId?: string;
  PayType?: string;
  ReceiptNo?: string;
  ReferenceId?: string;
  TrackId?: string;
  TransactionId?: string;
  PayId?: string;
  MerchUdf1?: string;
  MerchUdf2?: string;
  MerchUdf3?: string;
  MerchUdf4?: string;
  MerchUdf5?: string;
}

export async function cbkAuthenticate(creds: CbkCredentials): Promise<string> {
  const url = `${creds.pgBaseUrl}/ePay/api/cbk/online/pg/merchant/Authenticate`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuthHeader(creds.clientId, creds.clientSecret),
    },
    body: JSON.stringify({
      ClientId: creds.clientId,
      ClientSecret: creds.clientSecret,
      ENCRP_KEY: creds.encrpKey,
    }),
  });

  const json = (await res.json()) as { Status?: string; AccessToken?: string; Message?: string };
  if (!res.ok || json.Status !== "1" || !json.AccessToken) {
    const msg = json.Message ?? `HTTP ${res.status}`;
    throw new Error(`فشل توثيق CBK: ${msg}`);
  }
  return json.AccessToken;
}

export async function getCbkAccessToken(creds: CbkCredentials): Promise<string> {
  const cached = readCachedCbkAccessToken();
  if (cached) return cached;
  const token = await cbkAuthenticate(creds);
  writeCachedCbkAccessToken(token);
  return token;
}

export async function cbkGetTransactions(
  creds: CbkCredentials,
  encrp: string,
  accessToken: string,
): Promise<CbkTransactionDetails> {
  const u = `${creds.pgBaseUrl}/ePay/api/cbk/online/pg/GetTransactions/${encodeURIComponent(encrp)}/${encodeURIComponent(accessToken)}`;
  const res = await fetch(u, {
    method: "GET",
    headers: {
      Authorization: basicAuthHeader(creds.clientId, creds.clientSecret),
    },
  });
  const json = (await res.json()) as CbkTransactionDetails & { Message?: string };
  if (res.status === 401) {
    clearCachedCbkAccessToken();
  }
  if (!res.ok) {
    throw new Error(`GetTransactions: HTTP ${res.status}`);
  }
  return json;
}

export async function cbkVerifyByTrackId(
  creds: CbkCredentials,
  payId: string,
  accessToken: string,
): Promise<CbkTransactionDetails> {
  const url = `${creds.pgBaseUrl}/ePay/api/cbk/online/pg/Verify`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuthHeader(creds.clientId, creds.clientSecret),
    },
    body: JSON.stringify({
      encrypmerch: creds.encrpKey,
      authkey: accessToken,
      payid: payId,
    }),
  });
  const json = (await res.json()) as CbkTransactionDetails;
  if (res.status === 401) {
    clearCachedCbkAccessToken();
  }
  if (!res.ok) {
    throw new Error(`Verify: HTTP ${res.status}`);
  }
  return json;
}

/** حقول النموذج POST إلى صفحة الدفع المستضافة */
export function buildCbkCheckoutFormFields(
  creds: CbkCredentials,
  accessToken: string,
  input: {
    amount: string;
    paymentTrack: string;
    returnUrl: string;
    paymentRef?: string;
    udf1?: string;
    udf2?: string;
    udf3?: string;
    udf4?: string;
    udf5?: string;
  },
): Record<string, string> {
  const ref =
    input.paymentRef && input.paymentRef.length > 0
      ? input.paymentRef.slice(0, 30)
      : "Purchase";

  const fields: Record<string, string> = {
    tij_MerchantEncryptCode: creds.encrpKey,
    tij_MerchAuthKeyApi: accessToken,
    tij_MerchantPaymentLang: creds.paymentLang,
    tij_MerchantPaymentAmount: input.amount,
    tij_MerchantPaymentTrack: input.paymentTrack,
    tij_MerchantPaymentRef: ref,
    tij_MerchantPaymentCurrency: creds.currency,
    tij_MerchantUdf1: input.udf1 ?? "",
    tij_MerchantUdf2: input.udf2 ?? "",
    tij_MerchantUdf3: input.udf3 ?? "",
    tij_MerchantUdf4: input.udf4 ?? "",
    tij_MerchantUdf5: input.udf5 ?? "",
    tij_MerchPayType: creds.payType,
    tij_MerchReturnUrl: input.returnUrl,
  };
  return fields;
}

export function mapCbkGatewayStatus(
  status: string | undefined,
): "paid" | "payment_failed" | "payment_cancelled" | null {
  switch (status) {
    case "1":
      return "paid";
    case "2":
      return "payment_failed";
    case "3":
      return "payment_cancelled";
    case "0":
    case "-1":
      return "payment_failed";
    default:
      return null;
  }
}

/** TrackId المرسل في الطلب أو PayId من الاستجابة */
export function cbkResolveTrackKey(details: {
  TrackId?: string;
  PayId?: string;
}): string | null {
  const track = details.TrackId?.trim() || details.PayId?.trim();
  return track || null;
}

export function buildCbkCheckoutActionUrl(
  creds: CbkCredentials,
  accessToken: string,
): string {
  return `${creds.pgBaseUrl}/ePay/pg/epay?_v=${encodeURIComponent(accessToken)}`;
}

export function formatCbkAmountKuwaitStyle(priceDecimalString: string): string {
  const n = Number(priceDecimalString);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("مبلغ غير صالح");
  }
  return n.toFixed(3);
}
