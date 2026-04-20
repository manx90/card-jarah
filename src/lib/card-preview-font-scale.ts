"use client";

import { type RefObject, useLayoutEffect, useState } from "react";

/** عرض مرجعي: قيم `fontSize` المخزّنة (بكسل) تُفسَّر كما لو ضُبطت على هذا العرض */
export const CARD_FONT_REFERENCE_WIDTH_PX = 800;

export function scaleFontSizeToContainer(
  fontSizePx: number,
  containerWidthPx: number,
): number {
  const w =
    containerWidthPx > 0 ? containerWidthPx : CARD_FONT_REFERENCE_WIDTH_PX;
  const scaled = (fontSizePx * w) / CARD_FONT_REFERENCE_WIDTH_PX;
  return Math.min(160, Math.max(6, scaled));
}

export function useCardPreviewContainerWidth(
  ref: RefObject<HTMLElement | null>,
  layoutDeps: readonly unknown[] = [],
): number {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setWidth(w);
    });
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, [ref, ...layoutDeps]);

  return width;
}
