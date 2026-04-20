"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** قائمة اختيار المظهر: فاتح / داكن / حسب النظام */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="size-7 shrink-0 rounded-[min(var(--radius-md),12px)] border border-border/80 bg-muted/40"
        aria-hidden
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="relative border-border/80 bg-background/80 shadow-none"
          aria-label="اختيار المظهر"
        >
          <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light" inset={false} className="gap-2">
            <Sun className="size-4" />
            فاتح
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" inset={false} className="gap-2">
            <Moon className="size-4" />
            داكن
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" inset={false} className="gap-2">
            <Monitor className="size-4" />
            حسب النظام
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
