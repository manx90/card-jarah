import { jsonError } from "@/lib/api-response";
import { isDatabaseConfigured } from "@/lib/db-config";
import type { NextResponse } from "next/server";

/** استجابة موحّدة عند عدم ضبط DATABASE_URL (بدون محاولة اتصال) */
export function databaseNotConfiguredResponse(): NextResponse {
  return jsonError(
    "DATABASE_NOT_CONFIGURED",
    "أضف DATABASE_URL و AUTH_SECRET في ملف .env.local (انظر .env.example).",
    503,
  );
}

export function requireDatabaseConfigured():
  | { ok: true }
  | { ok: false; response: NextResponse } {
  if (!isDatabaseConfigured()) {
    return { ok: false, response: databaseNotConfiguredResponse() };
  }
  return { ok: true };
}
