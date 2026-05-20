import { withApiHandler } from "@/lib/api-route";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { requireDatabaseConfigured } from "@/lib/api-db-guard";
import { auth } from "@/auth";
import {
  getCbkCredentials,
  getAppPublicBaseUrl,
  isCbkPaymentConfigured,
} from "@/modules/payments/cbk-config";
import {
  buildCbkCheckoutActionUrl,
  buildCbkCheckoutFormFields,
  formatCbkAmountKuwaitStyle,
  getCbkAccessToken,
} from "@/modules/payments/cbk-hosted";
import { logPaymentError } from "@/modules/payments/payment-error-log";
import {
  getPurchaseRepository,
  getTemplateRepository,
} from "@/lib/db";
import { randomBytes } from "node:crypto";
import { z } from "zod";

const bodySchema = z.object({
  templateId: z.string().uuid(),
});

const TRACK_LEN = 24;
const TRACK_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function generatePaymentTrack(): string {
  const buf = randomBytes(TRACK_LEN);
  let s = "";
  for (let i = 0; i < TRACK_LEN; i++) {
    s += TRACK_CHARS[buf[i]! % TRACK_CHARS.length];
  }
  return s;
}

export const POST = withApiHandler("v1.purchases.checkout", async (request: Request) => {
  if (!isCbkPaymentConfigured()) {
    await logPaymentError({ phase: "checkout", code: "CBK_NOT_CONFIGURED" });
    return jsonError(
      "CBK_NOT_CONFIGURED",
      "دفع CBK غير مُفعّل — أضف متغيّرات البيئة",
      503,
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHORIZED", "يجب تسجيل الدخول", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "جسم الطلب ليس JSON", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "بيانات غير صالحة", 422);
  }

  const dbCheck = requireDatabaseConfigured();
  if (!dbCheck.ok) return dbCheck.response;

  const { templateId } = parsed.data;

  try {
    const creds = getCbkCredentials();
    const template = await (await getTemplateRepository()).findOne({
      where: { id: templateId },
    });
    if (!template) {
      return jsonError("NOT_FOUND", "القالب غير موجود", 404);
    }

    const repo = await getPurchaseRepository();
    let purchase = await repo.findOne({
      where: { userId: session.user.id, templateId },
    });

    if (purchase?.status === "mock_completed" || purchase?.status === "paid") {
      return jsonError("ALREADY_PURCHASED", "تم شراء هذا القالب مسبقاً", 409);
    }

    if (!purchase) {
      purchase = repo.create({
        userId: session.user.id,
        templateId,
        status: "pending_payment",
        paymentProvider: "cbk_hosted",
        paymentTrackId: null,
        paymentMeta: null,
      });
    } else {
      purchase.status = "pending_payment";
      purchase.paymentProvider = "cbk_hosted";
    }

    const track = generatePaymentTrack();
    purchase.paymentTrackId = track;
    await repo.save(purchase);

    const accessToken = await getCbkAccessToken(creds);
    const amount = formatCbkAmountKuwaitStyle(template.price);
    const base = getAppPublicBaseUrl();
    const returnUrl = `${base}/api/v1/payments/cbk/return`;

    const fields = buildCbkCheckoutFormFields(creds, accessToken, {
      amount,
      paymentTrack: track,
      returnUrl,
      paymentRef: template.title.slice(0, 30),
      udf1: purchase.id,
    });

    const actionUrl = buildCbkCheckoutActionUrl(creds, accessToken);

    await logger.event("payment.checkout_started", {
      purchaseId: purchase.id,
      userId: session.user.id,
      templateId,
      trackId: track,
    });

    return jsonSuccess({
      purchaseId: purchase.id,
      actionUrl,
      method: "POST" as const,
      fields,
      trackId: track,
    });
  } catch (e) {
    await logPaymentError({
      phase: "checkout",
      code: "SERVER",
      error: e,
      userId: session.user.id,
      templateId,
    });
    const msg = e instanceof Error ? e.message : "تعذّر بدء الدفع";
    return jsonError("SERVER_ERROR", msg, 500);
  }
});
