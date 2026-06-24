import type { CbkCredentials } from "./cbk-config";
import { resolveCbkPaymentStatus } from "./cbk-errors";
import { cbkHttpCall } from "./cbk-http-call";
import { cbkBasicAuthHeader, createCbkHttpClient } from "./cbk-http";
import { logPaymentError } from "./payment-error-log";
import { cbkSingleFlightToken } from "./cbk-singleflight";
import {
  cbkTokenCacheKey,
  clearCachedCbkAccessToken,
  readCachedCbkAccessToken,
  writeCachedCbkAccessToken,
} from "./cbk-token-cache";

const CBK_ENDPOINTS = {
  AUTH: "/ePay/api/cbk/online/pg/merchant/Authenticate",
  HOSTED_PAGE: "/ePay/pg/epay",
  GET_TRANSACTIONS: "/ePay/api/cbk/online/pg/GetTransactions",
  VERIFY: "/ePay/api/cbk/online/pg/Verify",
} as const;

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

interface CbkAuthResponse {
  Status?: string;
  AccessToken?: string;
  Message?: string;
}

async function cbkAuthenticate(creds: CbkCredentials): Promise<string> {
  const http = createCbkHttpClient(creds);
  const authHeaders = cbkBasicAuthHeader(creds.clientId, creds.clientSecret);
  const body = {
    ClientId: creds.clientId,
    ClientSecret: creds.clientSecret,
    ENCRP_KEY: creds.encrpKey,
  };

  try {
    const { data: json, status } = await cbkHttpCall<CbkAuthResponse>({
      operation: "authenticate",
      creds,
      http,
      method: "POST",
      path: CBK_ENDPOINTS.AUTH,
      body,
      headers: authHeaders,
    });

    if (json.Status !== "1" || !json.AccessToken) {
      const msg = json.Message ?? `HTTP ${status}`;
      await logPaymentError({
        phase: "authenticate",
        gatewayStatus: json.Status,
        gatewayMessage: msg,
        httpStatus: status,
        raw: json as unknown as Record<string, unknown>,
      });
      throw new Error(`فشل توثيق CBK: ${msg}`);
    }
    return json.AccessToken;
  } catch (e) {
    const axiosMsg =
      e && typeof e === "object" && "message" in e
        ? String((e as { message: string }).message)
        : String(e);
    if (!(e instanceof Error && e.message.startsWith("فشل توثيق CBK"))) {
      await logPaymentError({
        phase: "authenticate",
        code: "SERVER",
        gatewayMessage: axiosMsg,
        error: e,
      });
    }
    throw new Error(`فشل الاتصال ببوابة CBK: ${axiosMsg}`);
  }
}

export async function getCbkAccessToken(creds: CbkCredentials): Promise<string> {
  const cacheKey = cbkTokenCacheKey(creds.clientId);
  const cached = readCachedCbkAccessToken(cacheKey);
  if (cached) return cached;

  return cbkSingleFlightToken(cacheKey, async () => {
    const again = readCachedCbkAccessToken(cacheKey);
    if (again) return again;
    const token = await cbkAuthenticate(creds);
    writeCachedCbkAccessToken(cacheKey, token);
    return token;
  });
}

export async function cbkGetTransactions(
  creds: CbkCredentials,
  encrp: string,
  accessToken: string,
): Promise<CbkTransactionDetails> {
  const http = createCbkHttpClient(creds);
  const authHeaders = cbkBasicAuthHeader(creds.clientId, creds.clientSecret);
  const path = `${CBK_ENDPOINTS.GET_TRANSACTIONS}/${encodeURIComponent(encrp)}/${encodeURIComponent(accessToken)}`;

  try {
    const { data: json, status } = await cbkHttpCall<CbkTransactionDetails>({
      operation: "get_transactions",
      creds,
      http,
      method: "GET",
      path,
      headers: authHeaders,
      meta: { encrpLength: encrp.length },
    });

    if (status === 401) {
      clearCachedCbkAccessToken(cbkTokenCacheKey(creds.clientId));
    }
    if (json.Status && json.Status !== "1") {
      const st = resolveCbkPaymentStatus(json.Status);
      await logPaymentError({
        phase: "get_transactions",
        gatewayStatus: json.Status,
        gatewayMessage: json.Message ?? st?.messageAr,
        paymentTrackId: json.PayId ?? json.TrackId,
        amount: json.Amount,
        payType: json.PayType,
        raw: json as unknown as Record<string, unknown>,
      });
    }
    return json;
  } catch (e) {
    if (isAxiosUnauthorized(e)) {
      clearCachedCbkAccessToken(cbkTokenCacheKey(creds.clientId));
    }
    await logPaymentError({
      phase: "get_transactions",
      error: e,
      raw: { encrp: "[redacted]" },
    });
    throw wrapCbkHttpError("GetTransactions", e);
  }
}

export async function cbkVerifyByTrackId(
  creds: CbkCredentials,
  payId: string,
  accessToken: string,
): Promise<CbkTransactionDetails> {
  const http = createCbkHttpClient(creds);
  const authHeaders = cbkBasicAuthHeader(creds.clientId, creds.clientSecret);
  const body = {
    encrypmerch: creds.encrpKey,
    authkey: accessToken,
    payid: payId,
  };

  try {
    const { data: json, status } = await cbkHttpCall<CbkTransactionDetails>({
      operation: "verify",
      creds,
      http,
      method: "POST",
      path: CBK_ENDPOINTS.VERIFY,
      body,
      headers: authHeaders,
      meta: { payId },
    });

    if (status === 401) {
      clearCachedCbkAccessToken(cbkTokenCacheKey(creds.clientId));
    }
    if (json.Status && json.Status !== "1") {
      const st = resolveCbkPaymentStatus(json.Status);
      await logPaymentError({
        phase: "verify",
        gatewayStatus: json.Status,
        gatewayMessage: json.Message ?? st?.messageAr,
        paymentTrackId: payId,
        amount: json.Amount,
        payType: json.PayType,
        raw: json as unknown as Record<string, unknown>,
      });
    }
    return json;
  } catch (e) {
    if (isAxiosUnauthorized(e)) {
      clearCachedCbkAccessToken(cbkTokenCacheKey(creds.clientId));
    }
    await logPaymentError({ phase: "verify", paymentTrackId: payId, error: e });
    throw wrapCbkHttpError("Verify", e);
  }
}

function isAxiosUnauthorized(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "response" in e &&
    (e as { response?: { status?: number } }).response?.status === 401
  );
}

function wrapCbkHttpError(op: string, e: unknown): Error {
  const msg =
    e && typeof e === "object" && "message" in e
      ? String((e as { message: string }).message)
      : String(e);
  return new Error(`${op}: ${msg}`);
}

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
    tij_MerchPayType: creds.payType,
    tij_MerchReturnUrl: input.returnUrl,
  };

  const udfPairs: [string, string | undefined][] = [
    ["tij_MerchantUdf1", input.udf1],
    ["tij_MerchantUdf2", input.udf2],
    ["tij_MerchantUdf3", input.udf3],
    ["tij_MerchantUdf4", input.udf4],
    ["tij_MerchantUdf5", input.udf5],
  ];
  for (const [name, value] of udfPairs) {
    const trimmed = value?.trim();
    if (trimmed) fields[name] = trimmed;
  }

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

/** PayId = merchant track (tij_MerchantPaymentTrack); TrackId = gateway internal id — CBK manual p.12 */
export function cbkResolveTrackKey(details: {
  TrackId?: string;
  PayId?: string;
}): string | null {
  const track = details.PayId?.trim() || details.TrackId?.trim();
  return track || null;
}

export function buildCbkCheckoutActionUrl(
  creds: CbkCredentials,
  accessToken: string,
): string {
  return `${creds.pgBaseUrl}${CBK_ENDPOINTS.HOSTED_PAGE}?_v=${encodeURIComponent(accessToken)}`;
}

export { formatAmountForCbk as formatCbkAmountKuwaitStyle } from "@/lib/currency";
