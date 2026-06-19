"use client";

import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

export function ReceiptPrintActions() {
  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button type="button" className="gap-2" onClick={handlePrint}>
        <Printer className="size-4" aria-hidden />
        طباعة / حفظ PDF
      </Button>
      <Button type="button" variant="outline" className="gap-2" onClick={handlePrint}>
        <Download className="size-4" aria-hidden />
        حفظ الإيصال
      </Button>
    </div>
  );
}
