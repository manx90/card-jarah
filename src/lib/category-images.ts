/** صور معاينة ثابتة لكل فئة (picsum حسب seed) — للعرض التجريبي والبدائل */
export function getCategoryPlaceholderImage(slug: string): string {
  return `https://picsum.photos/seed/cat-${encodeURIComponent(slug)}/720/540`;
}

export function getTemplatePlaceholderImage(seed: string): string {
  const s = seed.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 32) || "template";
  return `https://picsum.photos/seed/tpl-${s}/800/600`;
}
