/** تحميل خط Google مرة واحدة لكل عائلة (للمتصفح فقط) */
const loadedFamilies = new Set<string>();

export function ensureGoogleFontLoaded(googleFamily: string): void {
  if (typeof document === "undefined") return;
  if (!googleFamily.trim()) return;
  if (loadedFamilies.has(googleFamily)) return;

  const id = `gf-${googleFamily.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 80)}`;
  if (document.getElementById(id)) {
    loadedFamilies.add(googleFamily);
    return;
  }

  const q = encodeURIComponent(googleFamily);
  const href = `https://fonts.googleapis.com/css2?family=${q}:wght@300;400;500;600;700;800&display=swap`;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
  loadedFamilies.add(googleFamily);
}
