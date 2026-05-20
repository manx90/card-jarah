import "reflect-metadata";
import bcrypt from "bcryptjs";
import { getUserRepository } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";

/** ينشئ أو يصلح المدير من ADMIN_EMAIL و ADMIN_PASSWORD (دور admin + كلمة المرور) */
export async function ensureDefaultAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();

  if (!email || !password) {
    console.warn(
      "[bootstrap] default admin skipped: set ADMIN_EMAIL and ADMIN_PASSWORD in .env",
    );
    return;
  }
  if (!isDatabaseConfigured()) {
    console.warn("[bootstrap] default admin skipped: DATABASE_URL not configured");
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
    console.log("[bootstrap] default admin created:", email);
    return;
  }

  const repairs: string[] = [];

  if (existing.role !== "admin") {
    console.warn(
      `[bootstrap] user exists but role is "${existing.role}" — upgrading to admin:`,
      email,
    );
    existing.role = "admin";
    repairs.push("role→admin");
  }

  const passwordMatches = await bcrypt.compare(password, existing.passwordHash);
  if (!passwordMatches) {
    console.warn(
      "[bootstrap] ADMIN_PASSWORD does not match stored hash — updating password:",
      email,
    );
    existing.passwordHash = await bcrypt.hash(password, 12);
    repairs.push("password synced");
  }

  if (repairs.length > 0) {
    await repo.save(existing);
    console.log("[bootstrap] default admin repaired:", email, repairs.join(", "));
    return;
  }

  console.log("[bootstrap] default admin ok:", email);
}
