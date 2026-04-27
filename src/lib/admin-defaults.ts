/**
 * بيانات الأدمن الافتراضية عند عدم ضبط `BOOTSTRAP_ADMIN_*` في البيئة.
 * يُنشأ الحساب مرة واحدة عند أول اتصال بقاعدة البيانات إن لم يكن البريد موجوداً.
 *
 * على الإنتاج: عيّن دائماً `BOOTSTRAP_ADMIN_EMAIL` و `BOOTSTRAP_ADMIN_PASSWORD` بقوة.
 */
export const DEFAULT_ADMIN_EMAIL = "mo.mansiyah@gmail.com";
export const DEFAULT_ADMIN_PASSWORD = "mansiyah";
