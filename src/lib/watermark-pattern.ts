/** نمط علامة مائية متكرّر — يُستخدم على الخادم (sharp) والواجهة (CSS) */
export const WATERMARK_LABEL = "معاينة";

export function buildTiledWatermarkSvg(width: number, height: number): string {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const fontSize = Math.max(36, Math.round(Math.min(w, h) / 5.5));
  const stepX = Math.round(fontSize * 3.8);
  const stepY = Math.round(fontSize * 2.2);

  const labels: string[] = [];
  let row = 0;
  for (let y = -stepY; y < h + stepY; y += stepY) {
    const offsetX = row % 2 === 0 ? 0 : stepX / 2;
    for (let x = -stepX; x < w + stepX; x += stepX) {
      const cx = x + offsetX + stepX / 2;
      const cy = y + stepY / 2;
      labels.push(
        `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle"
          fill="rgba(255,255,255,0.42)" stroke="rgba(0,0,0,0.22)" stroke-width="2"
          font-size="${fontSize}" font-family="system-ui,sans-serif" font-weight="800"
          transform="rotate(-32 ${cx} ${cy})">${WATERMARK_LABEL}</text>`,
      );
    }
    row += 1;
  }

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="rgba(0,0,0,0.14)"/>
  ${labels.join("\n  ")}
</svg>`;
}

export function watermarkSvgDataUrl(width: number, height: number): string {
  const svg = buildTiledWatermarkSvg(width, height);
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
