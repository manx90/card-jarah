import type { TemplateField, TemplateFieldGroup } from "@/types/template-fields";

export function groupFieldsForForm(
  fields: TemplateField[],
  groups: TemplateFieldGroup[],
): { title: string | null; fields: TemplateField[] }[] {
  const out: { title: string | null; fields: TemplateField[] }[] = [];
  const seen = new Set<string>();

  for (const g of groups) {
    const bucket: TemplateField[] = [];
    for (const f of fields) {
      if (f.groupId === g.id) bucket.push(f);
    }
    if (bucket.length) {
      out.push({ title: g.title, fields: bucket });
      for (const f of bucket) seen.add(f.id);
    }
  }
  const rest = fields.filter((f) => !seen.has(f.id));
  if (rest.length) out.push({ title: null, fields: rest });
  return out;
}
