import { withApiHandler } from "@/lib/api-route";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requireDatabaseConfigured } from "@/lib/api-db-guard";
import { auth } from "@/auth";
import { deleteUserDesign, getUserDesign } from "@/modules/designs/design-service";

export const GET = withApiHandler(
  "v1.designs.get",
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
    if (!design) {
      return jsonError("NOT_FOUND", "التصميم غير موجود", 404);
    }

    return jsonSuccess({
      id: design.id,
      templateId: design.templateId,
      templateTitle: design.template?.title ?? "",
      title: design.title,
      editorState: design.editorStateJson,
      voicePath: design.voicePath,
      voiceUrl: design.voicePath
        ? `/api/v1/designs/${design.id}/voice`
        : null,
      updatedAt: design.updatedAt.toISOString(),
    });
  },
);

export const DELETE = withApiHandler(
  "v1.designs.delete",
  async (_request: Request, context: { params?: Promise<{ id: string }> }) => {
    const session = await auth();
    if (!session?.user?.id) {
      return jsonError("UNAUTHORIZED", "يجب تسجيل الدخول", 401);
    }

    const { id } = await (context.params ?? Promise.resolve({ id: "" }));
    if (!id) return jsonError("VALIDATION_ERROR", "معرّف ناقص", 400);

    const dbCheck = requireDatabaseConfigured();
    if (!dbCheck.ok) return dbCheck.response;

    const deleted = await deleteUserDesign(session.user.id, id);
    if (!deleted) {
      return jsonError("NOT_FOUND", "التصميم غير موجود", 404);
    }
    return jsonSuccess({ deleted: true });
  },
);
