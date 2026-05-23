"use client";

import { WATERMARK_LABEL } from "@/lib/watermark-pattern";
import { cn } from "@/lib/utils";

export function WatermarkOverlay({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      <div
        className="absolute inset-0 bg-black/14"
        aria-hidden
      />
      <div
        className="absolute inset-[-50%] flex flex-wrap content-center justify-center gap-x-12 gap-y-8 opacity-100"
        style={{ transform: "rotate(-32deg) scale(1.4)" }}
      >
        {Array.from({ length: 48 }).map((_, i) => (
          <span
            key={i}
            className="text-foreground/35 whitespace-nowrap text-xl font-extrabold tracking-widest select-none sm:text-2xl md:text-3xl"
            style={{
              textShadow: "0 1px 2px rgba(0,0,0,0.25), 0 0 1px rgba(255,255,255,0.3)",
            }}
          >
            {WATERMARK_LABEL}
          </span>
        ))}
      </div>
    </div>
  );
}
