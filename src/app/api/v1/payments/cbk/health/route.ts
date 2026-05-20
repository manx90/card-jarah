import { withApiHandler } from "@/lib/api-route";
import { jsonSuccess } from "@/lib/api-response";
import { checkCbkHealth } from "@/modules/payments/cbk-health";

export const GET = withApiHandler("v1.payments.cbk.health", async () => {
  const health = await checkCbkHealth();
  return jsonSuccess(health);
});
