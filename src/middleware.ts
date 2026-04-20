import { authConfig } from "@/auth.config";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";

const { auth } = NextAuth({ ...authConfig, providers: [] });

export default auth((req) => {
  const path = req.nextUrl.pathname;
  if (path.startsWith("/admin")) {
    if (!req.auth) {
      const login = new URL("/login", req.nextUrl.origin);
      login.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(login);
    }
    if (req.auth.user?.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
