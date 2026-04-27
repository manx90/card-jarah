"use client";

import { cn } from "@/lib/utils";

/** إطار متدرّج دوّار — أسلوب Magic UI */
export function BorderBeam({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] p-px opacity-90",
        className,
      )}
    >
      <div
        className="absolute -inset-2 size-[200%] origin-center animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_0deg,hsl(var(--primary)/0.15),hsl(var(--primary)/0.7),hsl(var(--primary)/0.15),transparent_55%)]"
        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
      />
    </div>
  );
}
