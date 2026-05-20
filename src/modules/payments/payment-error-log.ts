import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  formatPaymentUserMessage,
  resolveCbkGatewayErrorCode,
  resolveCbkPaymentStatus,
  type CbkErrorDefinition,
} from "./cbk-errors";
import { serializeError } from "@/lib/logger";

export type PaymentErrorPhase =
  | "checkout"
  | "authenticate"
  | "get_transactions"
  | "verify"
  | "return_redirect"
  | "return_settle"
  | "amount_mismatch"
  | "unknown_purchase"
  | "misconfigured"
  | "server";

export interface PaymentErrorRecord {
  phase: PaymentErrorPhase;
  /** TIJ0001 أو MISSING_ENCRP أو SERVER */
  code?: string;
  /** حالة CBK: -1, 0, 1, 2, 3 */
  gatewayStatus?: string;
  gatewayMessage?: string;
  purchaseId?: string;
  templateId?: string;
  userId?: string;
  paymentTrackId?: string;
  amount?: string;
  expectedAmount?: string;
  httpStatus?: number;
  payType?: string;
  encrpPresent?: boolean;
  raw?: Record<string, unknown>;
  error?: unknown;
}

const LOG_DIR = process.env.LOG_DIR?.trim() || join(process.cwd(), "logs");

function canWriteFiles(): boolean {
  return (
    process.env.NEXT_RUNTIME !== "edge" && process.env.LOG_TO_FILE !== "false"
  );
}

function paymentErrorFileName(): string {
  const day = new Date().toISOString().slice(0, 10);
  return join(LOG_DIR, `${day}-payment-error.log`);
}

function buildResolved(record: PaymentErrorRecord) {
  const gatewayErr: CbkErrorDefinition | null = resolveCbkGatewayErrorCode(
    record.code,
  );
  const statusInfo = resolveCbkPaymentStatus(record.gatewayStatus);
  const userMessage = formatPaymentUserMessage({
    code: record.code,
    status: record.gatewayStatus,
    gatewayMessage: record.gatewayMessage,
  });

  return {
    userMessage,
    gatewayError: gatewayErr
      ? {
          code: gatewayErr.code,
          messageAr: gatewayErr.messageAr,
          messageEn: gatewayErr.messageEn,
        }
      : undefined,
    gatewayStatusInfo: statusInfo ?? undefined,
  };
}

/** يكتب كل أخطاء الدفع في logs/YYYY-MM-DD-payment-error.log */
export async function logPaymentError(
  record: PaymentErrorRecord,
): Promise<void> {
  const resolved = buildResolved(record);
  const line = {
    ts: new Date().toISOString(),
    level: "error" as const,
    category: "payment-error" as const,
    phase: record.phase,
    code: record.code,
    gatewayStatus: record.gatewayStatus,
    gatewayMessage: record.gatewayMessage,
    purchaseId: record.purchaseId,
    templateId: record.templateId,
    userId: record.userId,
    paymentTrackId: record.paymentTrackId,
    amount: record.amount,
    expectedAmount: record.expectedAmount,
    httpStatus: record.httpStatus,
    payType: record.payType,
    encrpPresent: record.encrpPresent,
    userMessage: resolved.userMessage,
    resolved,
    raw: record.raw,
    error: record.error != null ? serializeError(record.error) : undefined,
  };

  const payload = `${JSON.stringify(line)}\n`;
  console.error(
    "[payment-error]",
    record.phase,
    resolved.userMessage,
    record.code ? `code=${record.code}` : "",
    record.gatewayStatus ? `status=${record.gatewayStatus}` : "",
  );

  if (!canWriteFiles()) return;

  try {
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(paymentErrorFileName(), payload, "utf8");
  } catch (err) {
    console.error("[payment-error] failed to write log file:", err);
  }
}
