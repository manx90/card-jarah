"use server";

import { auth } from "@/auth";
import { getUserRepository } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import {
  normalizePhone,
  passwordPairSchema,
  passwordSchema,
  userNameSchema,
  userPhoneSchema,
} from "@/lib/user-validation";
import bcrypt from "bcryptjs";

export interface MutationResult {
  ok: boolean;
  error?: string;
}

async function requireUser(): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "يجب تسجيل الدخول" };
  }
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "قاعدة البيانات غير مهيأة" };
  }
  return { ok: true, userId: session.user.id };
}

export async function updateMyProfileAction(input: {
  name: string;
  phone?: string;
}): Promise<MutationResult> {
  const gate = await requireUser();
  if (!gate.ok) return { ok: false, error: gate.error };

  const nameParsed = userNameSchema.safeParse(input.name);
  if (!nameParsed.success) {
    return { ok: false, error: nameParsed.error.issues[0]?.message ?? "اسم غير صالح" };
  }
  const phoneParsed = userPhoneSchema.safeParse(input.phone ?? "");
  if (!phoneParsed.success) {
    return { ok: false, error: phoneParsed.error.issues[0]?.message ?? "هاتف غير صالح" };
  }

  try {
    const repo = await getUserRepository();
    const user = await repo.findOne({ where: { id: gate.userId } });
    if (!user) return { ok: false, error: "الحساب غير موجود" };

    user.name = nameParsed.data.trim();
    user.phone = normalizePhone(phoneParsed.data);
    await repo.save(user);
    return { ok: true };
  } catch (e) {
    console.error("[updateMyProfileAction]", e);
    return { ok: false, error: "تعذّر حفظ البيانات" };
  }
}

export async function changeMyPasswordAction(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<MutationResult> {
  const gate = await requireUser();
  if (!gate.ok) return { ok: false, error: gate.error };

  const current = String(input.currentPassword ?? "");
  if (!current) return { ok: false, error: "أدخل كلمة المرور الحالية" };

  const parsed = passwordPairSchema.safeParse({
    password: input.newPassword,
    confirmPassword: input.confirmPassword,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "كلمة مرور غير صالحة" };
  }

  const newPass = passwordSchema.parse(parsed.data.password);
  if (current === newPass) {
    return { ok: false, error: "كلمة المرور الجديدة يجب أن تختلف عن الحالية" };
  }

  try {
    const repo = await getUserRepository();
    const user = await repo.findOne({ where: { id: gate.userId } });
    if (!user) return { ok: false, error: "الحساب غير موجود" };

    const ok = await bcrypt.compare(current, user.passwordHash);
    if (!ok) return { ok: false, error: "كلمة المرور الحالية غير صحيحة" };

    user.passwordHash = await bcrypt.hash(newPass, 12);
    await repo.save(user);
    return { ok: true };
  } catch (e) {
    console.error("[changeMyPasswordAction]", e);
    return { ok: false, error: "تعذّر تغيير كلمة المرور" };
  }
}
