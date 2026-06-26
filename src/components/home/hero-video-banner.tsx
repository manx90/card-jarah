"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

const HERO_VIDEO_SRC = encodeURI(
  "/بطايق_فرحة_لأن_كل_مناسبة_تستحق_تصميماً_يليق_بها_.mp4",
);

interface HeroVideoBannerProps {
  children: React.ReactNode;
  className?: string;
}

export function HeroVideoBanner({ children, className }: HeroVideoBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      video.pause();
      return;
    }

    void video.play().catch(() => {});
  }, []);

  return (
    <section
      className={cn(
        "relative flex w-full min-h-[min(88vh,760px)] flex-col items-center justify-center overflow-hidden",
        className,
      )}
      aria-label="بانر الصفحة الرئيسية"
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      >
        <source src={HERO_VIDEO_SRC} type="video/mp4" />
      </video>

      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/65 via-black/50 to-black/75"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 py-16 text-center sm:gap-8 sm:py-24">
        {children}
      </div>
    </section>
  );
}
