import { withApiHandler } from "@/lib/api-route";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requireDatabaseConfigured } from "@/lib/api-db-guard";
import { auth } from "@/auth";
import { listUserDesigns, upsertUserDesign } from "@/modules/designs/design-service";
import type { EditorState } from "@/types/editor-state";
import { z } from "zod";

const saveSchema = z.object({
  templateId: z.string().uuid(),
  designId: z.string().uuid().optional(),
  title: z.string().max(120).optional(),
  editorState: z.object({
    values: z.record(z.string(), z.string()),
    offsets: z
      .record(
        z.string(),
        z.object({ dx: z.number(), dy: z.number() }),
      )
      .optional(),
    fieldStyles: z
      .record(
        z.string(),
        z.object({
          fontKey: z.string().optional(),
          fontSize: z.number().optional(),
          fontWeight: z.number().optional(),
          fontStyle: z.enum(["normal", "italic"]).optional(),
          textDecoration: z.enum(["none", "underline"]).optional(),
          color: z.string().optional(),
          anchor: z.enum(["center", "start", "end"]).optional(),
        }),
      )
      .optional(),
    voice: z
      .object({
        trimStart: z.number().min(0),
        trimEnd: z.number().min(0),
        duration: z.number().min(0),
        voicePath: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
  }),
  voiceBase64: z.string().max(3_000_000).optional(),
});

export const GET = withApiHandler("v1.designs.list", async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHORIZED", "يجب تسجيل الدخول", 401);
  }

  const dbCheck = requireDatabaseConfigured();
  if (!dbCheck.ok) return dbCheck.response;

  try {
    const items = await listUserDesigns(session.user.id);
    return jsonSuccess({ items });
  } catch {
    return jsonError("SERVER_ERROR", "تعذّر جلب التصاميم", 500);
  }
});

export const POST = withApiHandler("v1.designs.save", async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHORIZED", "يجب تسجيل الدخول", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "جسم الطلب ليس JSON", 400);
  }

  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "بيانات غير صالحة", 422);
  }

  const dbCheck = requireDatabaseConfigured();
  if (!dbCheck.ok) return dbCheck.response;

  let voiceFile: Buffer | null = null;
  if (parsed.data.voiceBase64) {
    const raw = parsed.data.voiceBase64.replace(/^data:audio\/[^;]+;base64,/, "");
    voiceFile = Buffer.from(raw, "base64");
    if (voiceFile.length > 2 * 1024 * 1024) {
      return jsonError("VALIDATION_ERROR", "ملف الصوت كبير جداً", 422);
    }
  }

  try {
    const design = await upsertUserDesign({
      userId: session.user.id,
      designId: parsed.data.designId,
      templateId: parsed.data.templateId,
      title: parsed.data.title ?? "تصميمي",
      editorState: parsed.data.editorState as EditorState,
      voiceFile,
    });
    return jsonSuccess({
      id: design.id,
      templateId: design.templateId,
      title: design.title,
      editorState: design.editorStateJson,
      voicePath: design.voicePath,
      updatedAt: design.updatedAt.toISOString(),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "TEMPLATE_NOT_FOUND") {
      return jsonError("NOT_FOUND", "القالب غير موجود", 404);
    }
    return jsonError("SERVER_ERROR", "تعذّر حفظ التصميم", 500);
  }
});
