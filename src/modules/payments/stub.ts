/**
 * طبقة دفع مجردة — استبدل التنفيذ لاحقاً بـ Stripe أو Tap مع webhooks.
 * حالياً الشراء يتم عبر مسار mock منفصل.
 */
export interface CheckoutInput {
  userId: string;
  templateId: string;
  amount: string;
  currency?: string;
}

export interface CheckoutResult {
  ok: boolean;
  provider: "stub";
  externalId?: string;
  message?: string;
}

export async function createCheckoutStub(
  _input: CheckoutInput,
): Promise<CheckoutResult> {
  return {
    ok: true,
    provider: "stub",
    message: "لم يُضبط مزوّد دفع؛ استخدم مسار الشراء الوهمي.",
  };
}

export async function handlePaymentWebhookStub(
  _payload: unknown,
): Promise<{ ok: boolean }> {
  return { ok: false };
}
