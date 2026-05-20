/** يُحمَّل عند بدء الخادم — يجب أن يسبق أي كيان TypeORM. */
import "reflect-metadata";

export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const { ensureDefaultAdmin } = await import("@/lib/ensure-default-admin");
  try {
    await ensureDefaultAdmin();
  } catch (e) {
    console.error(
      "[bootstrap] default admin failed:",
      e instanceof Error ? e.message : e,
    );
  }
}
