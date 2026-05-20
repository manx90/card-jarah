import { getCategoryRepository, getTemplateRepository } from "@/lib/db";
import { removeUnderUploads } from "@/lib/storage";

/** حذف فئة مع قوالبها وملفات الرفع */
export async function deleteCategoryCascade(categoryId: string): Promise<boolean> {
  const id = String(categoryId ?? "").trim();
  if (!id) return false;

  const cRepo = await getCategoryRepository();
  const row = await cRepo.findOne({ where: { id } });
  if (!row) return false;

  const tRepo = await getTemplateRepository();
  const templates = await tRepo.find({ where: { categoryId: id } });
  for (const template of templates) {
    await tRepo.remove(template);
    await removeUnderUploads(`templates/${template.id}`);
  }

  await cRepo.remove(row);
  await removeUnderUploads(`categories/${id}`);
  return true;
}
