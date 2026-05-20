import { revalidatePath } from "next/cache";

/** تحديث الصفحات العامة بعد تغيير الفئات */
export function revalidateCategoryPages(): void {
  revalidatePath("/");
  revalidatePath("/templates");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/templates");
}
