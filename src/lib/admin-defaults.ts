/**
 * بيانات الأدمن الافتراضية عند عدم ضبط `BOOTSTRAP_ADMIN_*` في البيئة.
 * يُنشأ الحساب مرة واحدة عند أول اتصال بقاعدة البيانات إن لم يكن البريد موجوداً.
 *
 * على الإنتاج: عيّن دائماً `BOOTSTRAP_ADMIN_EMAIL` و `BOOTSTRAP_ADMIN_PASSWORD` بقوة.
 */
export const DEFAULT_ADMIN_EMAIL = "admin@jarah.local";
export const DEFAULT_ADMIN_PASSWORD = "Jarah_Admin_2026";
