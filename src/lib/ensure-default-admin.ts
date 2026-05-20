import "reflect-metadata";
import bcrypt from "bcryptjs";
import { getUserRepository } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";

/** ينشئ مديراً افتراضياً من ADMIN_EMAIL و ADMIN_PASSWORD إن لم يكن موجوداً */
export async function ensureDefaultAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();

  if (!email || !password) return;
  if (!isDatabaseConfigured()) return;

  const repo = await getUserRepository();
  const existing = await repo.findOne({ where: { email } });

  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      await repo.save(existing);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await repo.save(
    repo.create({
      email,
      passwordHash,
      role: "admin",
    }),
  );

  console.log("[bootstrap] default admin ready:", email);
}
