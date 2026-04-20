import Link from "next/link";

/** يظهر عندما لا يوجد `DATABASE_URL` — بدون محاولة الاتصال بقاعدة البيانات */
export function MissingDatabaseNotice() {
  return (
    <div
      className="mx-auto max-w-lg rounded-xl border border-amber-500/40 bg-amber-50 p-6 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"
      dir="rtl"
    >
      <h2 className="mb-2 text-lg font-semibold">قاعدة البيانات غير مُضبوطة بعد</h2>
      <p className="mb-4 text-sm leading-relaxed">
        انسخ الملف{" "}
        <code className="rounded bg-black/10 px-1.5 py-0.5 text-xs dark:bg-white/10">
          .env.example
        </code>{" "}
        إلى{" "}
        <code className="rounded bg-black/10 px-1.5 py-0.5 text-xs dark:bg-white/10">
          .env.local
        </code>{" "}
        واملأ{" "}
        <code className="rounded bg-black/10 px-1.5 py-0.5 text-xs dark:bg-white/10">
          DATABASE_URL
        </code>{" "}
        و
        <code className="rounded bg-black/10 px-1.5 py-0.5 text-xs dark:bg-white/10">
          AUTH_SECRET
        </code>
        . للتطوير الأولي فعّل{" "}
        <code className="rounded bg-black/10 px-1.5 py-0.5 text-xs dark:bg-white/10">
          TYPEORM_SYNC=true
        </code>{" "}
        ثم شغّل السيرفر (SQLite لا يحتاج خادماً منفصلاً).
      </p>
      <Link
        href="/"
        className="text-sm font-medium text-amber-900 underline dark:text-amber-200"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}
