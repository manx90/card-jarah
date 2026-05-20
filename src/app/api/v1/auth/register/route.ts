import { withApiHandler } from "@/lib/api-route";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { requireDatabaseConfigured } from "@/lib/api-db-guard";
import { getUserRepository } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("بريد غير صالح"),
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل"),
});

export const POST = withApiHandler("v1.auth.register", async (request: Request) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "جسم الطلب ليس JSON", 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("، ");
    return jsonError("VALIDATION_ERROR", msg, 422);
  }

  const { email, password } = parsed.data;
  const normalized = email.trim().toLowerCase();

  const dbCheck = requireDatabaseConfigured();
  if (!dbCheck.ok) return dbCheck.response;

  try {
    const repo = await getUserRepository();
    const exists = await repo.exists({ where: { email: normalized } });
    if (exists) {
      return jsonError("EMAIL_TAKEN", "البريد مسجّل مسبقاً", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = repo.create({
      email: normalized,
      passwordHash,
      role: "user",
    });
    await repo.save(user);

    await logger.event("user.registered", { userId: user.id, email: user.email });

    return jsonSuccess({
      id: user.id,
      email: user.email,
    });
  } catch (e) {
    await logger.error("auth.register_failed", { error: String(e) });
    return jsonError("SERVER_ERROR", "تعذّر إنشاء الحساب", 500);
  }
});
