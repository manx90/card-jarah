import { Tajawal } from "next/font/google";

/** خط الواجهة الافتراضي — باقي الخطوط تُحمّل من Google عند الاختيار */
export const fontTajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["200", "300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
  display: "swap",
});

export const arabicFontVariableClassName = fontTajawal.variable;
