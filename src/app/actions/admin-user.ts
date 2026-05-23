"use server";

import { auth } from "@/auth";
import type { UserRole } from "@/entities/User";
import { getUserRepository } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import {
  normalizePhone,
  passwordPairSchema,
  registerBodySchema,
  userNameSchema,
  userPhoneSchema,
} from "@/lib/user-validation";
import bcrypt from "bcryptjs";

export interface MutationResult {
  ok: boolean;
  error?: string;
}

async function requireAdmin(): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { ok: false, error: "غير مصرّح" };
  }
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "قاعدة البيانات غير مهيأة" };
  }
  return { ok: true, userId: session.user.id };
}

export async function createUserAction(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}): Promise<MutationResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  const parsed = registerBodySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("، ") };
  }
  if (input.role !== "user" && input.role !== "admin") {
    return { ok: false, error: "دور غير صالح" };
  }

  const { name, email, password, phone } = parsed.data;
  const role = input.role;
  const normalized = email.trim().toLowerCase();

  try {
    const repo = await getUserRepository();
    if (await repo.exists({ where: { email: normalized } })) {
      return { ok: false, error: "البريد مسجّل مسبقاً" };
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await repo.save(
      repo.create({
        email: normalized,
        name: name.trim(),
        phone: normalizePhone(phone),
        passwordHash,
        role,
      }),
    );
    return { ok: true };
  } catch (e) {
    console.error("[createUserAction]", e);
    return { ok: false, error: "تعذّر إنشاء الحساب" };
  }
}

export async function updateUserProfileAction(
  userId: string,
  input: { name: string; phone?: string },
): Promise<MutationResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  const id = String(userId ?? "").trim();
  if (!id) return { ok: false, error: "معرّف غير صالح" };

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
    const user = await repo.findOne({ where: { id } });
    if (!user) return { ok: false, error: "المستخدم غير موجود" };

    user.name = nameParsed.data.trim();
    user.phone = normalizePhone(phoneParsed.data);
    await repo.save(user);
    return { ok: true };
  } catch (e) {
    console.error("[updateUserProfileAction]", e);
    return { ok: false, error: "تعذّر تحديث الملف الشخصي" };
  }
}

export async function updateUserRoleAction(
  userId: string,
  role: UserRole,
): Promise<MutationResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  const id = String(userId ?? "").trim();
  if (!id) return { ok: false, error: "معرّف غير صالح" };
  if (role !== "user" && role !== "admin") {
    return { ok: false, error: "دور غير صالح" };
  }

  try {
    const repo = await getUserRepository();
    const user = await repo.findOne({ where: { id } });
    if (!user) return { ok: false, error: "المستخدم غير موجود" };

    if (user.id === gate.userId && role !== "admin") {
      return { ok: false, error: "لا يمكن إزالة صلاحية المدير عن حسابك" };
    }

    user.role = role;
    await repo.save(user);
    return { ok: true };
  } catch (e) {
    console.error("[updateUserRoleAction]", e);
    return { ok: false, error: "تعذّر تحديث الدور" };
  }
}

export async function resetUserPasswordAction(
  userId: string,
  newPassword: string,
  confirmPassword: string,
): Promise<MutationResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  const id = String(userId ?? "").trim();
  if (!id) return { ok: false, error: "معرّف غير صالح" };

  const parsed = passwordPairSchema.safeParse({
    password: newPassword,
    confirmPassword,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "كلمة مرور غير صالحة" };
  }

  try {
    const repo = await getUserRepository();
    const user = await repo.findOne({ where: { id } });
    if (!user) return { ok: false, error: "المستخدم غير موجود" };

    user.passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await repo.save(user);
    return { ok: true };
  } catch (e) {
    console.error("[resetUserPasswordAction]", e);
    return { ok: false, error: "تعذّر إعادة تعيين كلمة المرور" };
  }
}

export async function deleteUserAction(userId: string): Promise<MutationResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  const id = String(userId ?? "").trim();
  if (!id) return { ok: false, error: "معرّف غير صالح" };
  if (id === gate.userId) {
    return { ok: false, error: "لا يمكن حذف حسابك الحالي" };
  }

  try {
    const repo = await getUserRepository();
    const user = await repo.findOne({ where: { id } });
    if (!user) return { ok: false, error: "المستخدم غير موجود" };

    await repo.remove(user);
    return { ok: true };
  } catch (e) {
    console.error("[deleteUserAction]", e);
    return { ok: false, error: "تعذّر حذف المستخدم" };
  }
}
