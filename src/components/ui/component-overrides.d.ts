import type * as React from "react";

/** تعريضات لأنواع مكوّنات JSX حتى تتوافق مع استيرادها من ملفات .tsx */
declare module "@/components/ui/button" {
  export const buttonVariants: (args?: Record<string, unknown>) => string;
  export const Button: React.ComponentType<
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
      variant?: string;
      size?: string;
      asChild?: boolean;
      className?: string;
    }
  >;
}

declare module "@/components/ui/input" {
  export const Input: React.ComponentType<
    React.InputHTMLAttributes<HTMLInputElement> & { className?: string }
  >;
}

declare module "@/components/ui/label" {
  export const Label: React.ComponentType<
    React.LabelHTMLAttributes<HTMLLabelElement> & { className?: string }
  >;
}

declare module "@/components/ui/textarea" {
  export const Textarea: React.ComponentType<
    React.TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }
  >;
}

declare module "@/components/ui/card" {
  export const Card: React.ComponentType<
    React.HTMLAttributes<HTMLDivElement> & { className?: string; size?: string }
  >;
  export const CardHeader: React.ComponentType<
    React.HTMLAttributes<HTMLDivElement> & { className?: string }
  >;
  export const CardTitle: React.ComponentType<
    React.HTMLAttributes<HTMLDivElement> & { className?: string }
  >;
  export const CardContent: React.ComponentType<
    React.HTMLAttributes<HTMLDivElement> & { className?: string }
  >;
  export const CardFooter: React.ComponentType<
    React.HTMLAttributes<HTMLDivElement> & { className?: string }
  >;
}

declare module "@/components/ui/select" {
  import type * as React from "react";
  export const Select: React.ComponentType<{
    value?: string;
    onValueChange?: (v: string) => void;
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
    required?: boolean;
    disabled?: boolean;
    children?: React.ReactNode;
  }>;
  export const SelectTrigger: React.ComponentType<{
    className?: string;
    children?: React.ReactNode;
  }>;
  export const SelectValue: React.ComponentType<{
    placeholder?: string;
    className?: string;
  }>;
  export const SelectContent: React.ComponentType<{
    className?: string;
    children?: React.ReactNode;
    position?: "popper" | "item-aligned";
    align?: "start" | "center" | "end";
    side?: "top" | "bottom" | "left" | "right";
    sideOffset?: number;
    alignOffset?: number;
    avoidCollisions?: boolean;
    collisionPadding?: number;
  }>;
  export const SelectItem: React.ComponentType<{
    className?: string;
    value: string;
    children?: React.ReactNode;
    onPointerEnter?: React.PointerEventHandler<HTMLDivElement>;
    onFocus?: React.FocusEventHandler<HTMLDivElement>;
  }>;
}

declare module "@/components/ui/table" {
  import type * as React from "react";
  export const Table: React.ComponentType<Record<string, unknown>>;
  export const TableHeader: React.ComponentType<Record<string, unknown>>;
  export const TableBody: React.ComponentType<Record<string, unknown>>;
  export const TableFooter: React.ComponentType<Record<string, unknown>>;
  export const TableRow: React.ComponentType<Record<string, unknown>>;
  export const TableHead: React.ComponentType<Record<string, unknown>>;
  export const TableCell: React.ComponentType<Record<string, unknown>>;
  export const TableCaption: React.ComponentType<Record<string, unknown>>;
}

declare module "@/components/ui/dialog" {
  import type * as React from "react";
  export const Dialog: React.ComponentType<Record<string, unknown>>;
  export const DialogTrigger: React.ComponentType<Record<string, unknown>>;
  export const DialogContent: React.ComponentType<Record<string, unknown>>;
  export const DialogHeader: React.ComponentType<Record<string, unknown>>;
  export const DialogFooter: React.ComponentType<Record<string, unknown>>;
  export const DialogTitle: React.ComponentType<Record<string, unknown>>;
  export const DialogDescription: React.ComponentType<Record<string, unknown>>;
  export const DialogClose: React.ComponentType<Record<string, unknown>>;
}

declare module "@/components/ui/scroll-area" {
  import type * as React from "react";
  const C: React.ComponentType<React.HTMLAttributes<HTMLElement> & { className?: string }>;
  export const ScrollArea: typeof C;
  export const ScrollBar: React.ComponentType<{
    className?: string;
    orientation?: "vertical" | "horizontal";
  }>;
}

declare module "@/components/ui/sidebar" {
  import type * as React from "react";
  export const SidebarProvider: React.ComponentType<Record<string, unknown>>;
  const Base: React.ComponentType<Record<string, unknown>>;
  export const Sidebar: typeof Base;
  export const SidebarContent: typeof Base;
  export const SidebarFooter: typeof Base;
  export const SidebarHeader: typeof Base;
  export const SidebarGroup: typeof Base;
  export const SidebarGroupLabel: typeof Base;
  export const SidebarGroupContent: typeof Base;
  export const SidebarInset: typeof Base;
  export const SidebarMenu: typeof Base;
  export const SidebarMenuItem: typeof Base;
  export const SidebarMenuButton: React.ComponentType<Record<string, unknown>>;
  export const SidebarTrigger: typeof Base;
  export const SidebarRail: typeof Base;
}
