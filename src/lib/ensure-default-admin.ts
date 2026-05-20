import "reflect-metadata";
import bcrypt from "bcryptjs";
import { getUserRepository } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import { logger } from "@/lib/logger";

/** ينشئ أو يصلح المدير من ADMIN_EMAIL و ADMIN_PASSWORD (دور admin + كلمة المرور) */
export async function ensureDefaultAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();

  if (!email || !password) {
    await logger.warn("default admin skipped: ADMIN_EMAIL or ADMIN_PASSWORD missing");
    return;
  }
  if (!isDatabaseConfigured()) {
    await logger.warn("default admin skipped: DATABASE_URL not configured");
    return;
  }

  const repo = await getUserRepository();
  const existing = await repo.findOne({ where: { email } });

  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12);
    await repo.save(
      repo.create({
        email,
        passwordHash,
        role: "admin",
      }),
    );
    await logger.event("admin.created", { email });
    return;
  }

  const repairs: string[] = [];

  if (existing.role !== "admin") {
    await logger.warn("admin role repair", { email, from: existing.role });
    existing.role = "admin";
    repairs.push("role→admin");
  }

  const passwordMatches = await bcrypt.compare(password, existing.passwordHash);
  if (!passwordMatches) {
    await logger.warn("admin password sync", { email });
    existing.passwordHash = await bcrypt.hash(password, 12);
    repairs.push("password synced");
  }

  if (repairs.length > 0) {
    await repo.save(existing);
    await logger.event("admin.repaired", { email, repairs: repairs.join(", ") });
    return;
  }

  await logger.event("admin.ok", { email });
}
