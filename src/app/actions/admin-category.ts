"use server";

import { auth } from "@/auth";
import { deleteCategoryCascade } from "@/lib/delete-category-cascade";
import { getCategoryRepository } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import {
  absoluteUploadPath,
  ensureUploadsDir,
  removeUnderUploads,
  toDbRelative,
} from "@/lib/storage";
import { revalidateCategoryPages } from "@/lib/revalidate-public";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function extFromFilename(name: string): string {
  const ext = path.extname(name).toLowerCase();
  if (!ext || ext.length > 8) return ".png";
  if (![".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) {
    return ".png";
  }
  return ext;
}

export interface MutationResult {
  ok: boolean;
  error?: string;
  id?: string;
}

export async function createCategoryAction(
  formData: FormData,
): Promise<MutationResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { ok: false, error: "غير مصرّح" };
  }
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "قاعدة البيانات غير مهيأة" };
  }

  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const nameAr = String(formData.get("nameAr") ?? "").trim();
  const file = formData.get("thumbnail");

  if (!slug || !nameAr) {
    return { ok: false, error: "المعرف والاسم مطلوبان" };
  }
  if (!SLUG.test(slug)) {
    return { ok: false, error: "المعرف: أحرف إنجليزية صغيرة وأرقام وشرطات فقط" };
  }

  const id = randomUUID();
  const subdir = `categories/${id}`;
  let thumbnailPath: string | null = null;

  if (file instanceof File && file.size > 0) {
    await ensureUploadsDir(subdir);
    const ext = extFromFilename(file.name);
    const abs = absoluteUploadPath(`${subdir}/thumb${ext}`);
    await writeFile(abs, Buffer.from(await file.arrayBuffer()));
    thumbnailPath = toDbRelative(abs);
  }

  try {
    const repo = await getCategoryRepository();
    const existing = await repo.findOne({ where: { slug } });
    if (existing) {
      if (thumbnailPath) await removeUnderUploads(subdir);
      return { ok: false, error: "هذا المعرّف محجوز" };
    }
    const entity = repo.create({
      id,
      slug,
      nameAr,
      thumbnailPath,
    });
    await repo.save(entity);
    revalidateCategoryPages();
    return { ok: true, id };
  } catch (e) {
    console.error("[createCategoryAction]", e);
    if (thumbnailPath) await removeUnderUploads(subdir);
    return { ok: false, error: "تعذّر إنشاء الفئة" };
  }
}

export async function updateCategoryAction(
  formData: FormData,
): Promise<MutationResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { ok: false, error: "غير مصرّح" };
  }
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "قاعدة البيانات غير مهيأة" };
  }

  const id = String(formData.get("id") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const nameAr = String(formData.get("nameAr") ?? "").trim();
  const file = formData.get("thumbnail");

  if (!id || !slug || !nameAr) {
    return { ok: false, error: "الحقول المطلوبة ناقصة" };
  }
  if (!SLUG.test(slug)) {
    return { ok: false, error: "المعرف: أحرف إنجليزية صغيرة وأرقام وشرطات فقط" };
  }

  try {
    const repo = await getCategoryRepository();
    const row = await repo.findOne({ where: { id } });
    if (!row) {
      return { ok: false, error: "الفئة غير موجودة" };
    }
    if (slug !== row.slug) {
      const taken = await repo.findOne({ where: { slug } });
      if (taken) {
        return { ok: false, error: "هذا المعرّف محجوز" };
      }
    }
    if (file instanceof File && file.size > 0) {
      await removeUnderUploads(`categories/${id}`);
      await ensureUploadsDir(`categories/${id}`);
      const ext = extFromFilename(file.name);
      const abs = absoluteUploadPath(`categories/${id}/thumb${ext}`);
      await writeFile(abs, Buffer.from(await file.arrayBuffer()));
      row.thumbnailPath = toDbRelative(abs);
    }
    row.slug = slug;
    row.nameAr = nameAr;
    await repo.save(row);
    revalidateCategoryPages();
    return { ok: true, id: row.id };
  } catch (e) {
    console.error("[updateCategoryAction]", e);
    return { ok: false, error: "تعذّر تحديث الفئة" };
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<MutationResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { ok: false, error: "غير مصرّح" };
  }
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "قاعدة البيانات غير مهيأة" };
  }
  const id = String(categoryId ?? "").trim();
  if (!id) {
    return { ok: false, error: "معرّف غير صالح" };
  }

  try {
    const deleted = await deleteCategoryCascade(id);
    if (!deleted) {
      return { ok: false, error: "الفئة غير موجودة" };
    }
    revalidateCategoryPages();
    return { ok: true };
  } catch (e) {
    console.error("[deleteCategoryAction]", e);
    return { ok: false, error: "تعذّر حذف الفئة" };
  }
}
