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
    position?: string;
    align?: string;
  }>;
  export const SelectItem: React.ComponentType<{
    className?: string;
    value: string;
    children?: React.ReactNode;
  }>;
}
