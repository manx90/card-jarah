import type { LocalDesignDraft } from "@/types/editor-state";

const PREFIX = "jarah:draft:";

export function localDraftKey(templateId: string): string {
  return `${PREFIX}${templateId}`;
}

export function readLocalDraft(templateId: string): LocalDesignDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(localDraftKey(templateId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalDesignDraft;
    if (parsed.templateId !== templateId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeLocalDraft(draft: LocalDesignDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(localDraftKey(draft.templateId), JSON.stringify(draft));
  } catch {
    /* تجاوز حد التخزين */
  }
}

export function clearLocalDraft(templateId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(localDraftKey(templateId));
}

export function listLocalDraftTemplateIds(): string[] {
  if (typeof window === "undefined") return [];
  const ids: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) {
      ids.push(key.slice(PREFIX.length));
    }
  }
  return ids;
}
