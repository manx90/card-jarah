"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getFontEntryByKey } from "@/lib/arabic-fonts";
import { GOOGLE_ARABIC_FONT_CATALOG } from "@/lib/google-fonts-arabic-catalog";
import { ensureGoogleFontLoaded } from "@/lib/load-google-font";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";

export function ArabicFontCombobox({
  value,
  onChange,
  disabled,
  className,
  id,
}: {
  value: string;
  onChange: (key: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = getFontEntryByKey(value);

  useEffect(() => {
    ensureGoogleFontLoaded(current.googleFamily);
  }, [current.googleFamily]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between gap-2 font-normal",
            className,
          )}
        >
          <span className="min-w-0 flex-1 truncate text-start">{current.label}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] max-w-[min(100vw-2rem,28rem)] p-0 sm:w-auto sm:min-w-[320px]"
        align="start"
      >
        <Command className="rounded-lg border-0 shadow-none">
          <CommandInput placeholder="ابحث عن خط…" className="h-9" />
          <CommandList className="max-h-72">
            <CommandEmpty className="py-6">لا توجد نتائج</CommandEmpty>
            <CommandGroup className="max-h-72 overflow-auto p-0">
              {GOOGLE_ARABIC_FONT_CATALOG.map((font) => (
                <CommandItem
                  key={font.key}
                  className="font-sans"
                  value={`${font.label} ${font.googleFamily} ${font.key}`}
                  onSelect={() => {
                    ensureGoogleFontLoaded(font.googleFamily);
                    onChange(font.key);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      value === font.key ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span
                    className="truncate"
                    style={{
                      fontFamily: `'${font.googleFamily}', var(--font-tajawal), sans-serif`,
                    }}
                  >
                    {font.label}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
