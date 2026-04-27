import { auth } from "@/auth";
import { jsonError } from "@/lib/api-response";
import { NextResponse } from "next/server";

export async function getAdminOr403(): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { ok: false, response: jsonError("FORBIDDEN", "غير مصرّح", 403) };
  }
  return { ok: true, userId: session.user.id };
}
