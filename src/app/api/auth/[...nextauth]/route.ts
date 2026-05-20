import { handlers } from "@/auth";

/** لا نلفّ handlers — NextAuth يستخدم NextRequest و params.catch-all (string[]) */
export const { GET, POST } = handlers;
