/**
 * حذف جميع الفئات مع قوالبها (نفس منطق لوحة الإدارة).
 * التشغيل: npm run bootstrap:clear-categories -- --confirm
 */
import pg from "pg";
import { loadEnvFile } from "./load-env";
import { removeUnderUploads } from "../src/lib/storage";

loadEnvFile();

interface CategoryRow {
  id: string;
  slug: string;
  name_ar: string;
}

async function main() {
  const confirm = process.argv.includes("--confirm");
  if (!confirm) {
    console.error(
      "أضف --confirm لحذف جميع الفئات وقوالبها:\n  npm run bootstrap:clear-categories -- --confirm",
    );
    process.exit(1);
  }

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("DATABASE_URL غير مُعرَّف في .env");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    const { rows: categories } = await client.query<CategoryRow>(
      "SELECT id, slug, name_ar FROM categories ORDER BY name_ar ASC",
    );

    if (categories.length === 0) {
      console.log("لا توجد فئات للحذف.");
      return;
    }

    console.log(`جاري حذف ${categories.length} فئة/فئات…`);

    for (const c of categories) {
      const { rows: templates } = await client.query<{ id: string }>(
        "SELECT id FROM templates WHERE category_id = $1",
        [c.id],
      );

      for (const t of templates) {
        await client.query("DELETE FROM purchases WHERE template_id = $1", [t.id]);
        await client.query("DELETE FROM templates WHERE id = $1", [t.id]);
        await removeUnderUploads(`templates/${t.id}`);
      }

      await client.query("DELETE FROM categories WHERE id = $1", [c.id]);
      await removeUnderUploads(`categories/${c.id}`);
      console.log(`  ✓ ${c.name_ar} (${c.slug}) — ${templates.length} قالب`);
    }

    console.log(`تم حذف ${categories.length} فئة/فئات.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
