import { In } from "typeorm";

/** يُسمح بالتحميل والتخصيص الكامل بعد إتمام الدفع الحقيقي أو الشراء الوهمي للتطوير */
export const PURCHASE_ACCESS_STATUSES = ["mock_completed", "paid"] as const;

export function purchaseAccessStatusIn() {
  return In([...PURCHASE_ACCESS_STATUSES]);
}
