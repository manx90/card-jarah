import { z } from "zod";

export const userNameSchema = z
  .string()
  .trim()
  .min(2, "الاسم حرفان على الأقل")
  .max(120, "الاسم طويل جداً");

export const userPhoneSchema = z
  .string()
  .trim()
  .max(24, "رقم الهاتف طويل جداً")
  .optional()
  .or(z.literal(""));

export const passwordSchema = z
  .string()
  .min(8, "كلمة المرور 8 أحرف على الأقل")
  .max(128, "كلمة المرور طويلة جداً");

export const registerBodySchema = z
  .object({
    name: userNameSchema,
    email: z.string().email("بريد غير صالح"),
    phone: userPhoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export const passwordPairSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export function normalizePhone(phone: string | undefined | null): string | null {
  const v = String(phone ?? "").trim();
  return v || null;
}
