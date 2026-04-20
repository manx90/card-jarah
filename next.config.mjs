/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["typeorm", "better-sqlite3", "reflect-metadata"],
  experimental: {
    serverActions: {
      /** الافتراضي 1MB — رفع صور القوالب (معاينة + نسخة كاملة) يتجاوزه */
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
