import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  title: string;
  description?: string;
  eyebrow?: string;
  className?: string;
  centered?: boolean;
}

export function PageHero({
  title,
  description,
  eyebrow,
  className,
  centered = false,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative mb-8 overflow-hidden rounded-2xl border border-border/60 bg-card/50 px-5 py-8 sm:mb-10 sm:px-8 sm:py-10",
        "shadow-sm backdrop-blur-sm",
        centered && "text-center",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -start-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -end-12 size-40 rounded-full bg-primary/5 blur-2xl"
        aria-hidden
      />
      <div className={cn("relative space-y-3", centered && "mx-auto max-w-2xl")}>
        {eyebrow && (
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
            {eyebrow}
          </Badge>
        )}
        <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-pretty text-sm leading-relaxed sm:text-base">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
