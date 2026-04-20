/** يُحمَّل عند بدء الخادم — يجب أن يسبق أي كيان TypeORM. */
import "reflect-metadata";

export async function register() {
  // تأثير جانبي: تحميل reflect-metadata أعلاه
}
