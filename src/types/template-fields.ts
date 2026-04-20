/** مجموعة لعرض الحقول تحت عنوان في واجهة التخصيص */
export interface TemplateFieldGroup {
  id: string;
  title: string;
}

export interface TemplateFieldText {
  id: string;
  type: "text";
  groupId?: string;
  label: string;
  placeholder?: string;
  x: number;
  y: number;
  anchor?: "center" | "start" | "end";
  fontSize?: number;
  color?: string;
  fontKey?: string;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
}

export interface TemplateFieldSelect {
  id: string;
  type: "select";
  groupId?: string;
  label: string;
  placeholder?: string;
  options: string[];
  x: number;
  y: number;
  anchor?: "center" | "start" | "end";
  fontSize?: number;
  color?: string;
  fontKey?: string;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
}

export interface TemplateFieldLink {
  id: string;
  type: "link";
  groupId?: string;
  label: string;
  placeholder?: string;
  x: number;
  y: number;
  /** عرض QR كنسبة من عرض الصورة (مثلاً 0.14) */
  qrSize?: number;
}

export interface TemplateFieldImage {
  id: string;
  type: "image";
  groupId?: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type TemplateField =
  | TemplateFieldText
  | TemplateFieldSelect
  | TemplateFieldLink
  | TemplateFieldImage;

export interface TemplateFieldsConfig {
  fields?: TemplateField[];
  groups?: TemplateFieldGroup[];
}
