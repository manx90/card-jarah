import { getAppPublicBaseUrl } from "@/modules/payments/cbk-config";
import { formatPriceKwd } from "@/lib/currency";

export function getWhatsAppNumber(): string | null {
  const raw = process.env.WHATSAPP_NUMBER?.trim().replace(/\D/g, "");
  return raw && raw.length >= 8 ? raw : null;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function buildTemplateWhatsAppMessage(input: {
  title: string;
  price: string;
  templateId: string;
  categoryName?: string | null;
}): string {
  let baseUrl: string;
  try {
    baseUrl = getAppPublicBaseUrl();
  } catch {
    baseUrl = "";
  }
  const lines = [
    "مرحباً، أريد الاستفسار عن القالب التالي:",
    "",
    `📌 ${input.title}`,
    input.categoryName ? `📂 ${input.categoryName}` : null,
    `💰 ${formatPriceKwd(input.price)}`,
    baseUrl ? `🔗 ${baseUrl}/templates/${input.templateId}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}
