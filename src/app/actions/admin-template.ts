"use server";

import { auth } from "@/auth";
import { getTemplateRepository } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import {
  absoluteUploadPath,
  ensureUploadsDir,
  removeUnderUploads,
  toDbRelative,
} from "@/lib/storage";
import type { TemplateFieldsConfig } from "@/types/template-fields";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

function extFromFilename(name: string): string {
  const ext = path.extname(name).toLowerCase();
  if (!ext || ext.length > 8) return ".png";
  if (![".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) {
    return ".png";
  }
  return ext;
}

export interface CreateTemplateResult {
  ok: boolean;
  error?: string;
  templateId?: string;
}

export async function createTemplateAction(
  formData: FormData,
): Promise<CreateTemplateResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { ok: false, error: "غير مصرّح" };
  }

  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      error: "أضف DATABASE_URL في .env.local أولاً (انظر .env.example).",
    };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "0").trim();
  const fieldsJsonRaw = String(formData.get("fieldsJson") ?? "").trim();

  const source = formData.get("source");

  if (!title || !categoryId) {
    return { ok: false, error: "العنوان والفئة مطلوبان" };
  }
  if (!(source instanceof File) || source.size === 0) {
    return { ok: false, error: "صورة القالب مطلوبة" };
  }

  let fieldsJson: TemplateFieldsConfig = {};
  if (fieldsJsonRaw) {
    try {
      fieldsJson = JSON.parse(fieldsJsonRaw) as TemplateFieldsConfig;
    } catch {
      return { ok: false, error: "JSON حقول التخصيص غير صالح" };
    }
  }

  const price = /^\d+(\.\d{1,2})?$/.test(priceRaw) ? priceRaw : "0";

  const id = randomUUID();
  const subdir = `templates/${id}`;
  await ensureUploadsDir(subdir);

  const ext = extFromFilename(source.name);
  const sourceAbs = absoluteUploadPath(`${subdir}/source${ext}`);
  const buf = Buffer.from(await source.arrayBuffer());
  await writeFile(sourceAbs, buf);

  const sourcePath = toDbRelative(sourceAbs);

  try {
    const repo = await getTemplateRepository();
    const entity = repo.create({
      id,
      categoryId,
      title,
      description,
      price,
      sourcePath,
      fieldsJson,
    });
    await repo.save(entity);
    return { ok: true, templateId: id };
  } catch (e) {
    console.error("[createTemplateAction]", e);
    return { ok: false, error: "تعذّر حفظ القالب" };
  }
}

export interface MutationResult {
  ok: boolean;
  error?: string;
}

export async function updateTemplateAction(
  formData: FormData,
): Promise<MutationResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { ok: false, error: "غير مصرّح" };
  }
  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      error: "أضف DATABASE_URL في .env.local أولاً (انظر .env.example).",
    };
  }

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "0").trim();
  const fieldsJsonRaw = String(formData.get("fieldsJson") ?? "").trim();
  const source = formData.get("source");

  if (!id || !title || !categoryId) {
    return { ok: false, error: "الحقول المطلوبة ناقصة" };
  }

  let fieldsJson: TemplateFieldsConfig = {};
  if (fieldsJsonRaw) {
    try {
      fieldsJson = JSON.parse(fieldsJsonRaw) as TemplateFieldsConfig;
    } catch {
      return { ok: false, error: "JSON حقول التخصيص غير صالح" };
    }
  }
  const price = /^\d+(\.\d{1,2})?$/.test(priceRaw) ? priceRaw : "0";

  try {
    const repo = await getTemplateRepository();
    const row = await repo.findOne({ where: { id } });
    if (!row) {
      return { ok: false, error: "القالب غير موجود" };
    }

    const subdir = `templates/${id}`;

    if (source instanceof File && source.size > 0) {
      await ensureUploadsDir(subdir);
      const ext = extFromFilename(source.name);
      const sourceAbs = absoluteUploadPath(`${subdir}/source${ext}`);
      const buf = Buffer.from(await source.arrayBuffer());
      await writeFile(sourceAbs, buf);
      row.sourcePath = toDbRelative(sourceAbs);
    }

    row.title = title;
    row.description = description;
    row.categoryId = categoryId;
    row.price = price;
    row.fieldsJson = fieldsJson;
    await repo.save(row);
    return { ok: true };
  } catch (e) {
    console.error("[updateTemplateAction]", e);
    return { ok: false, error: "تعذّر تحديث القالب" };
  }
}

export async function deleteTemplateAction(templateId: string): Promise<MutationResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { ok: false, error: "غير مصرّح" };
  }
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "قاعدة البيانات غير مهيأة" };
  }

  const id = String(templateId ?? "").trim();
  if (!id) {
    return { ok: false, error: "معرّف غير صالح" };
  }

  try {
    const repo = await getTemplateRepository();
    const row = await repo.findOne({ where: { id } });
    if (!row) {
      return { ok: false, error: "القالب غير موجود" };
    }
    await repo.remove(row);
    await removeUnderUploads(`templates/${id}`);
    return { ok: true };
  } catch (e) {
    console.error("[deleteTemplateAction]", e);
    return { ok: false, error: "تعذّر حذف القالب" };
  }
}
