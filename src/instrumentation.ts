/** يُحمَّل عند بدء الخادم — يجب أن يسبق أي كيان TypeORM. */
import "reflect-metadata";

export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const { logger } = await import("@/lib/logger");
  await logger.event("server.start", {
    nodeEnv: process.env.NODE_ENV,
  });

  const { ensureDefaultAdmin } = await import("@/lib/ensure-default-admin");
  try {
    await ensureDefaultAdmin();
  } catch (e) {
    await logger.error("default admin bootstrap failed", {
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
