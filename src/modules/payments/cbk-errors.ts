/** مرجع أخطاء CBK — Integration Manual v2.93 */

export interface CbkErrorDefinition {
  code: string;
  messageEn: string;
  messageAr: string;
}

/** ErrorCode في رابط العودة — صفحة 15 */
export const CBK_GATEWAY_ERROR_CODES: Record<string, CbkErrorDefinition> = {
  TIJ0001: {
    code: "TIJ0001",
    messageEn: "Invalid Merchant Language",
    messageAr: "لغة الدفع غير صالحة",
  },
  TIJ0002: {
    code: "TIJ0002",
    messageEn: "Invalid Merchant Amount",
    messageAr: "مبلغ الدفع غير صالح",
  },
  TIJ0003: {
    code: "TIJ0003",
    messageEn: "Invalid Merchant Amount KWD",
    messageAr: "مبلغ الدينار الكويتي غير صالح",
  },
  TIJ0004: {
    code: "TIJ0004",
    messageEn: "Invalid Merchant Track ID",
    messageAr: "معرّف تتبع المعاملة غير صالح",
  },
  TIJ0005: {
    code: "TIJ0005",
    messageEn: "Invalid Merchant UDF1",
    messageAr: "حقل UDF1 غير صالح",
  },
  TIJ0015: {
    code: "TIJ0015",
    messageEn: "Invalid Merchant UDF2",
    messageAr: "حقل UDF2 غير صالح",
  },
  TIJ0006: {
    code: "TIJ0006",
    messageEn: "Invalid Merchant Currency",
    messageAr: "عملة الدفع غير صالحة",
  },
  TIJ0007: {
    code: "TIJ0007",
    messageEn: "Invalid Merchant Payment reference",
    messageAr: "مرجع الدفع غير صالح",
  },
  TIJ0008: {
    code: "TIJ0008",
    messageEn: "Invalid Merchant Pay Type",
    messageAr: "نوع الدفع غير صالح",
  },
  TIJ0009: {
    code: "TIJ0009",
    messageEn: "Invalid Merchant API Authenticate Key",
    messageAr: "مفتاح API غير صالح — أعد توليد AccessToken",
  },
  TIJ0016: {
    code: "TIJ0016",
    messageEn: "Error in QR",
    messageAr: "خطأ في دفع T-Pay QR",
  },
  TIJ0020: {
    code: "TIJ0020",
    messageEn: "Error in KNET",
    messageAr: "خطأ في دفع KNET",
  },
  TIJ0022: {
    code: "TIJ0022",
    messageEn: "Invalid Merchant UDF3",
    messageAr: "حقل UDF3 غير صالح",
  },
  TIJ0023: {
    code: "TIJ0023",
    messageEn: "Invalid Merchant UDF4",
    messageAr: "حقل UDF4 غير صالح",
  },
  TIJ0024: {
    code: "TIJ0024",
    messageEn: "Invalid Merchant UDF5",
    messageAr: "حقل UDF5 غير صالح",
  },
  TIJ0027: {
    code: "TIJ0027",
    messageEn: "Invalid Merchant Return URL",
    messageAr: "رابط العودة غير صالح — تحقق من APP_URL",
  },
};

/** Status في GetTransactions / Verify — صفحة 14 */
export const CBK_PAYMENT_STATUS_CODES: Record<
  string,
  { messageEn: string; messageAr: string }
> = {
  "-1": {
    messageEn: "Invalid encrp/payid",
    messageAr: "معامل مشفّر أو معرّف دفع غير صالح",
  },
  "0": {
    messageEn: "Invalid Access — regenerate API key",
    messageAr: "وصول غير صالح — أعد توليد مفتاح API",
  },
  "1": {
    messageEn: "Success",
    messageAr: "تم الدفع بنجاح",
  },
  "2": {
    messageEn: "Failed",
    messageAr: "فشل الدفع",
  },
  "3": {
    messageEn: "Expired/Cancelled",
    messageAr: "انتهت صلاحية الدفع أو أُلغي",
  },
};

/** أخطاء داخلية للتطبيق */
export const APP_PAYMENT_ERROR_CODES: Record<
  string,
  { messageAr: string; messageEn: string }
> = {
  MISSING_ENCRP: {
    messageAr: "لم تُرجع البوابة بيانات المعاملة",
    messageEn: "Missing encrp from gateway",
  },
  UNKNOWN_PURCHASE: {
    messageAr: "تعذّر ربط الدفع بطلب الشراء",
    messageEn: "Purchase not found for gateway result",
  },
  AMOUNT_MISMATCH: {
    messageAr: "المبلغ المدفوع لا يطابق سعر القالب",
    messageEn: "Paid amount mismatch",
  },
  SERVER: {
    messageAr: "خطأ في الخادم أثناء معالجة الدفع",
    messageEn: "Server error processing payment",
  },
  CBK_NOT_CONFIGURED: {
    messageAr: "بوابة CBK غير مُعدّة",
    messageEn: "CBK not configured",
  },
};

export function resolveCbkGatewayErrorCode(
  errorCode: string | null | undefined,
): CbkErrorDefinition | null {
  if (!errorCode?.trim()) return null;
  const key = errorCode.trim().toUpperCase();
  return CBK_GATEWAY_ERROR_CODES[key] ?? null;
}

export function resolveCbkPaymentStatus(
  status: string | null | undefined,
): { status: string; messageAr: string; messageEn: string } | null {
  if (status == null || status === "") return null;
  const key = String(status).trim();
  const row = CBK_PAYMENT_STATUS_CODES[key];
  if (!row) {
    return {
      status: key,
      messageAr: `حالة غير معروفة (${key})`,
      messageEn: `Unknown status (${key})`,
    };
  }
  return { status: key, ...row };
}

export function formatPaymentUserMessage(input: {
  code?: string | null;
  status?: string | null;
  gatewayMessage?: string | null;
}): string {
  const parts: string[] = ["تعذّر إتمام الدفع"];

  const gatewayErr = resolveCbkGatewayErrorCode(input.code);
  if (gatewayErr) {
    parts.push(`— ${gatewayErr.messageAr} (${gatewayErr.code})`);
    return parts.join(" ");
  }

  if (input.code) {
    const appErr = APP_PAYMENT_ERROR_CODES[input.code.trim().toUpperCase()];
    if (appErr) {
      parts.push(`— ${appErr.messageAr}`);
      return parts.join(" ");
    }
    parts.push(`— رمز: ${input.code}`);
  }

  const st = resolveCbkPaymentStatus(input.status);
  if (st) {
    parts.push(`— ${st.messageAr}`);
    if (input.status) parts.push(`(حالة ${input.status})`);
  }

  if (input.gatewayMessage?.trim()) {
    parts.push(`— ${input.gatewayMessage.trim()}`);
  }

  return parts.join(" ");
}
