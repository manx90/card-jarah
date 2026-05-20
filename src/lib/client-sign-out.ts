import { signOut } from "next-auth/react";

/** يبقى على نفس نطاق المتصفح — يتجنب إعادة التوجيه إلى localhost:2209 أو AUTH_URL خاطئ */
export async function signOutToHome() {
  await signOut({ redirect: false });
  window.location.href = "/";
}
