"use client";

import { getTemplatePlaceholderImage } from "@/lib/category-images";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TemplatePreviewImageProps {
  templateId: string;
  previewUrl: string;
  title: string;
  className?: string;
}

export function TemplatePreviewImage({
  templateId,
  previewUrl,
  title,
  className,
}: TemplatePreviewImageProps) {
  const [src, setSrc] = useState(previewUrl);
  const fallback = getTemplatePlaceholderImage(templateId);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={title}
      className={cn("block h-auto w-full max-w-full object-contain", className)}
      onError={() => {
        if (src !== fallback) setSrc(fallback);
      }}
    />
  );
}
