/**
 * إنشاء المدير الافتراضي من .env
 * التشغيل: npm run bootstrap:admin
 */
import { loadEnvFile } from "./load-env";

loadEnvFile();

async function main() {
  const { ensureDefaultAdmin } = await import("../src/lib/ensure-default-admin");
  await ensureDefaultAdmin();
  console.log("Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
