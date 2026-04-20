/** هل تم ضبط مسار SQLite (`DATABASE_URL`) في البيئة؟ (لا يتحقق من إمكانية الاتصال الفعلي) */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
