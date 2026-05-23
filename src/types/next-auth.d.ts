import type { UserRole } from "@/entities/User";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: UserRole;
    name?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      name?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    name?: string | null;
  }
}
