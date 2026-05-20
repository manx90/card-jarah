import { handlers } from "@/auth";
import { withApiHandler } from "@/lib/api-route";

export const GET = withApiHandler("auth.session", handlers.GET);
export const POST = withApiHandler("auth.session", handlers.POST);
