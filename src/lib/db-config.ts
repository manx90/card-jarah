/** هل `DATABASE_URL` عنوان PostgreSQL صالح؟ (لا يتحقق من الاتصال الفعلي) */
export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return false;
  return /^postgres(ql)?:\/\//i.test(url);
}
