import { authConfig } from "@/auth.config";
import { getUserRepository } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db-config";
import type { UserRole } from "@/entities/User";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import type { User as NextAuthUser } from "next-auth";
import Credentials from "next-auth/providers/credentials";

/** Auth.js قد يمرّر قيمة كسلسلة أو مصفوفة (FormData) */
function coerceCredentialString(v: unknown): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0 && typeof v[0] === "string") return v[0];
  return "";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "البريد", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      authorize: async (credentials): Promise<NextAuthUser | null> => {
        const email = coerceCredentialString(credentials?.email).trim().toLowerCase();
        const password = coerceCredentialString(credentials?.password);

        if (!email || !password) {
          console.warn("[auth] authorize: missing email or password");
          return null;
        }
        if (!isDatabaseConfigured()) {
          console.warn("[auth] authorize: DATABASE_URL not configured");
          return null;
        }

        try {
          const repo = await getUserRepository();
          const user = await repo.findOne({ where: { email } });
          if (!user) {
            console.warn("[auth] authorize: no user for email", email);
            return null;
          }

          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) {
            console.warn("[auth] authorize: invalid password for", email);
            return null;
          }

          console.log("[auth] authorize: success", { email, role: user.role });
          return {
            id: user.id,
            name: user.email,
            email: user.email,
            role: user.role as UserRole,
          };
        } catch (e) {
          console.error(
            "[auth] authorize error:",
            e instanceof Error ? e.message : e,
          );
          return null;
        }
      },
    }),
  ],
});
