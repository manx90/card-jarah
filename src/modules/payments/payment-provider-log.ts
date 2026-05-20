import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { serializeError } from "@/lib/logger";

export type PaymentProviderOperation =
  | "authenticate"
  | "get_transactions"
  | "verify"
  | "checkout_form";

const LOG_DIR = process.env.LOG_DIR?.trim() || join(process.cwd(), "logs");

const SECRET_KEYS = new Set([
  "ClientSecret",
  "ENCRP_KEY",
  "encrypmerch",
  "authkey",
  "AccessToken",
  "tij_MerchantEncryptCode",
  "tij_MerchAuthKeyApi",
  "Authorization",
]);

function canWriteFiles(): boolean {
  return (
    process.env.NEXT_RUNTIME !== "edge" && process.env.LOG_TO_FILE !== "false"
  );
}

function providerLogFileName(): string {
  const day = new Date().toISOString().slice(0, 10);
  return join(LOG_DIR, `${day}-payment-provider.log`);
}

function maskValue(key: string, value: unknown): unknown {
  if (value == null) return value;
  const k = key.toLowerCase();
  if (
    SECRET_KEYS.has(key) ||
    k.includes("secret") ||
    k.includes("encrp") ||
    k.includes("authkey") ||
    k.includes("token") ||
    k === "authorization"
  ) {
    return "[REDACTED]";
  }
  if (typeof value === "string" && value.length > 80) {
    return `${value.slice(0, 12)}…${value.slice(-4)} (${value.length} chars)`;
  }
  return value;
}

export function sanitizeForProviderLog(value: unknown): unknown {
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForProviderLog(item));
  }
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (val != null && typeof val === "object" && !Array.isArray(val)) {
      out[key] = sanitizeForProviderLog(val);
    } else {
      out[key] = maskValue(key, val);
    }
  }
  return out;
}

/** يخفّي encrp و AccessToken داخل مسار GetTransactions */
export function sanitizeProviderUrl(url: string): string {
  return url.replace(
    /\/GetTransactions\/([^/]+)\/([^/?]+)/,
    (_m, _enc, tok: string) =>
      `/GetTransactions/[encrp]/${tok.length > 8 ? `${tok.slice(0, 4)}…` : "[token]"}`,
  );
}

export interface PaymentProviderExchange {
  operation: PaymentProviderOperation;
  request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  response?: {
    httpStatus: number;
    durationMs: number;
    body?: unknown;
  };
  error?: unknown;
  meta?: Record<string, unknown>;
}

/** logs/YYYY-MM-DD-payment-provider.log — طلب/استجابة CBK (بدون أسرار) */
export async function logPaymentProviderExchange(
  exchange: PaymentProviderExchange,
): Promise<void> {
  const line = {
    ts: new Date().toISOString(),
    level: exchange.error ? ("error" as const) : ("info" as const),
    category: "payment-provider" as const,
    provider: "cbk" as const,
    operation: exchange.operation,
    request: {
      method: exchange.request.method,
      url: sanitizeProviderUrl(exchange.request.url),
      headers: sanitizeForProviderLog(exchange.request.headers ?? {}),
      body: sanitizeForProviderLog(exchange.request.body),
    },
    response: exchange.response
      ? {
          httpStatus: exchange.response.httpStatus,
          durationMs: exchange.response.durationMs,
          body: sanitizeForProviderLog(exchange.response.body),
        }
      : undefined,
    meta: exchange.meta,
    error:
      exchange.error != null ? serializeError(exchange.error) : undefined,
  };

  const status = exchange.response?.httpStatus ?? "—";
  console.log(
    "[payment-provider]",
    exchange.operation,
    exchange.request.method,
    status,
    `${exchange.response?.durationMs ?? "?"}ms`,
  );

  if (!canWriteFiles()) return;

  try {
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(providerLogFileName(), `${JSON.stringify(line)}\n`, "utf8");
  } catch (err) {
    console.error("[payment-provider] failed to write log file:", err);
  }
}
