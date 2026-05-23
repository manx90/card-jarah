import {
  getTemplateRepository,
  getUserDesignRepository,
} from "@/lib/db";
import {
  absoluteUploadPath,
  ensureUploadsDir,
  removeUnderUploads,
  toDbRelative,
} from "@/lib/storage";
import type { EditorState } from "@/types/editor-state";
import { UserDesign } from "@/entities/UserDesign";
import { writeFile } from "fs/promises";

export interface DesignListItem {
  id: string;
  templateId: string;
  templateTitle: string;
  title: string;
  updatedAt: string;
}

export async function listUserDesigns(userId: string): Promise<DesignListItem[]> {
  const rows = await (await getUserDesignRepository()).find({
    where: { userId },
    relations: ["template"],
    order: { updatedAt: "DESC" },
  });
  return rows.map((d) => ({
    id: d.id,
    templateId: d.templateId,
    templateTitle: d.template?.title ?? "",
    title: d.title,
    updatedAt: d.updatedAt.toISOString(),
  }));
}

export async function getUserDesign(
  userId: string,
  designId: string,
): Promise<UserDesign | null> {
  return (await getUserDesignRepository()).findOne({
    where: { id: designId, userId },
    relations: ["template"],
  });
}

export async function upsertUserDesign(input: {
  userId: string;
  designId?: string;
  templateId: string;
  title: string;
  editorState: EditorState;
  voiceFile?: Buffer | null;
}): Promise<UserDesign> {
  const template = await (await getTemplateRepository()).findOne({
    where: { id: input.templateId },
  });
  if (!template) {
    throw new Error("TEMPLATE_NOT_FOUND");
  }

  const repo = await getUserDesignRepository();
  let design: UserDesign | null = null;

  if (input.designId) {
    design = await repo.findOne({
      where: { id: input.designId, userId: input.userId },
    });
  }

  if (!design) {
    design = await repo.findOne({
      where: { userId: input.userId, templateId: input.templateId },
      order: { updatedAt: "DESC" },
    });
  }

  if (!design) {
    design = repo.create({
      userId: input.userId,
      templateId: input.templateId,
      title: input.title.trim() || "تصميمي",
      editorStateJson: input.editorState,
      voicePath: null,
    });
    design = await repo.save(design);
  } else {
    design.title = input.title.trim() || design.title;
    design.editorStateJson = input.editorState;
    design = await repo.save(design);
  }

  if (input.voiceFile && input.voiceFile.length > 0) {
    const subdir = `designs/${design.id}`;
    await removeUnderUploads(subdir);
    await ensureUploadsDir(subdir);
    const abs = absoluteUploadPath(`${subdir}/voice.webm`);
    await writeFile(abs, input.voiceFile);
    design.voicePath = toDbRelative(abs);
    design = await repo.save(design);
  }

  return design;
}

export async function deleteUserDesign(
  userId: string,
  designId: string,
): Promise<boolean> {
  const repo = await getUserDesignRepository();
  const row = await repo.findOne({ where: { id: designId, userId } });
  if (!row) return false;
  if (row.voicePath) {
    const parts = row.voicePath.split("/");
    parts.pop();
    if (parts.length >= 2) {
      await removeUnderUploads(parts.join("/"));
    }
  }
  await repo.remove(row);
  return true;
}
