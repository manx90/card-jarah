import { withApiHandler } from "@/lib/api-route";
import { jsonError } from "@/lib/api-response";
import { requireDatabaseConfigured } from "@/lib/api-db-guard";
import { auth } from "@/auth";
import { getUserDesign } from "@/modules/designs/design-service";
import { absoluteUploadPath } from "@/lib/storage";
import { readFile } from "fs/promises";

export const GET = withApiHandler(
  "v1.designs.voice",
  async (_request: Request, context: { params?: Promise<{ id: string }> }) => {
    const session = await auth();
    if (!session?.user?.id) {
      return jsonError("UNAUTHORIZED", "يجب تسجيل الدخول", 401);
    }

    const { id } = await (context.params ?? Promise.resolve({ id: "" }));
    if (!id) return jsonError("VALIDATION_ERROR", "معرّف ناقص", 400);

    const dbCheck = requireDatabaseConfigured();
    if (!dbCheck.ok) return dbCheck.response;

    const design = await getUserDesign(session.user.id, id);
    if (!design?.voicePath) {
      return jsonError("NOT_FOUND", "الصوت غير موجود", 404);
    }

    try {
      const abs = absoluteUploadPath(design.voicePath);
      const buffer = await readFile(abs);
      return new Response(buffer, {
        headers: {
          "Content-Type": "audio/webm",
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch {
      return jsonError("NOT_FOUND", "ملف الصوت مفقود", 404);
    }
  },
);
