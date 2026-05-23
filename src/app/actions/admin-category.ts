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
import { validateAndProcessCategoryThumbnail } from "@/lib/validate-category-image";
import { writeFile } from "fs/promises";
import { randomUUID } from "crypto";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function saveCategoryThumbnail(
  subdir: string,
  file: File,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const raw = Buffer.from(await file.arrayBuffer());
  const processed = await validateAndProcessCategoryThumbnail(raw);
  if (!processed.ok) return processed;

  await ensureUploadsDir(subdir);
  const abs = absoluteUploadPath(`${subdir}/thumb.webp`);
  await writeFile(abs, processed.data.buffer);
  return { ok: true, path: toDbRelative(abs) };
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
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "صورة الفئة مطلوبة" };
  }

  const id = randomUUID();
  const subdir = `categories/${id}`;
  const thumbResult = await saveCategoryThumbnail(subdir, file);
  if (!thumbResult.ok) {
    return { ok: false, error: thumbResult.error };
  }
  const thumbnailPath = thumbResult.path;

  try {
    const repo = await getCategoryRepository();
    const existing = await repo.findOne({ where: { slug } });
    if (existing) {
      await removeUnderUploads(subdir);
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
      const thumbResult = await saveCategoryThumbnail(`categories/${id}`, file);
      if (!thumbResult.ok) {
        return { ok: false, error: thumbResult.error };
      }
      row.thumbnailPath = thumbResult.path;
    } else if (!row.thumbnailPath) {
      return { ok: false, error: "صورة الفئة مطلوبة" };
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
