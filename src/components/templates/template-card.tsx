"use client";

import { BorderBeam } from "@/components/magicui/border-beam";
import { TemplatePreviewImage } from "@/components/templates/template-preview-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPriceKwd } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";
import Link from "next/link";

interface TemplateCardProps {
  id: string;
  title: string;
  description: string | null;
  price: string;
  categoryName: string;
  previewUrl: string;
  className?: string;
}

export function TemplateCard({
  id,
  title,
  description,
  price,
  categoryName,
  previewUrl,
  className,
}: TemplateCardProps) {
  return (
    <Card
      className={cn(
        "group/card relative min-w-0 overflow-hidden pt-0 transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5",
        className,
      )}
    >
      <BorderBeam className="opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
      <Link href={`/templates/${id}`} className="relative block overflow-hidden">
        <div className="bg-muted relative aspect-[4/3] w-full min-w-0 overflow-hidden">
          <TemplatePreviewImage
            templateId={id}
            previewUrl={previewUrl}
            title={title}
            className="size-full object-cover transition-transform duration-500 group-hover/card:scale-[1.04]"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <span className="text-foreground/15 rotate-[-24deg] text-2xl font-bold tracking-widest sm:text-3xl">
              معاينة
            </span>
          </div>
          <Badge
            variant="secondary"
            className="absolute start-3 top-3 border-border/60 bg-background/85 backdrop-blur-sm"
          >
            {categoryName}
          </Badge>
        </div>
      </Link>

      <CardHeader className="gap-1.5 pb-2">
        <CardTitle className="line-clamp-1 text-base leading-tight">{title}</CardTitle>
        {description && (
          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
            {description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pb-2 pt-0">
        <p className="text-lg font-bold text-primary">{formatPriceKwd(price)}</p>
      </CardContent>

      <CardFooter className="pt-0">
        <Button size="sm" className="w-full gap-2" asChild>
          <Link href={`/templates/${id}`}>
            <Eye className="size-4 opacity-90" aria-hidden />
            عرض التفاصيل
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
