"use client";

import { cn } from "@/lib/utils";

export function AnimatedShinyText({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-block bg-size-[200%_100%] bg-clip-text text-transparent animate-shiny",
        "bg-linear-to-r from-foreground from-30% via-primary to-foreground to-80%",
        className,
      )}
    >
      {children}
    </span>
  );
}
