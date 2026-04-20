import type { UserRole } from "@/entities/User";
import type { NextAuthConfig } from "next-auth";

/** إعداد مشترك بدون مزودات Node (bcrypt/DB) — يُستخدم في middleware (Edge). */
export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    jwt({ token, user }) {
      if (user && "id" in user && user.id) {
        token.id = user.id as string;
        token.role = (user as { role?: UserRole }).role ?? "user";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as UserRole) ?? "user";
      }
      return session;
    },
  },
} satisfies Omit<NextAuthConfig, "providers">;
