import { getCbkCredentials, isCbkPaymentConfigured } from "./cbk-config";
import { getCbkAccessToken } from "./cbk-hosted";

export interface CbkHealthResult {
  provider: "cbk";
  configured: boolean;
  status: "healthy" | "unhealthy" | "not_configured";
  message: string;
  responseTimeMs?: number;
  timestamp: string;
  error?: string;
}

export async function checkCbkHealth(): Promise<CbkHealthResult> {
  const ts = new Date().toISOString();
  if (!isCbkPaymentConfigured()) {
    return {
      provider: "cbk",
      configured: false,
      status: "not_configured",
      message: "CBK غير مُعدّ — راجع CBK_CLIENT_ID وغيرها",
      timestamp: ts,
    };
  }

  const start = Date.now();
  try {
    const creds = getCbkCredentials();
    await getCbkAccessToken(creds);
    return {
      provider: "cbk",
      configured: true,
      status: "healthy",
      message: "بوابة CBK متاحة — Authenticate نجح",
      responseTimeMs: Date.now() - start,
      timestamp: ts,
    };
  } catch (e) {
    return {
      provider: "cbk",
      configured: true,
      status: "unhealthy",
      message: "تعذّر الاتصال ببوابة CBK",
      responseTimeMs: Date.now() - start,
      timestamp: ts,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
