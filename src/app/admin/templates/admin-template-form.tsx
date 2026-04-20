"use client";

import { createTemplateAction } from "@/app/actions/admin-template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TemplateFieldsEditor } from "./template-fields-editor";

export function AdminTemplateForm({
  categories,
  defaultFieldsJson,
}: {
  categories: { id: string; nameAr: string }[];
  defaultFieldsJson: string;
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState<string>(
    categories[0]?.id ?? "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sourceFile, setSourceFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    formData.set("categoryId", categoryId);
    const fieldsRaw = String(formData.get("fieldsJson") ?? "").trim();
    let fieldsParsed: { fields?: unknown[] } = {};
    try {
      fieldsParsed = fieldsRaw ? JSON.parse(fieldsRaw) : {};
    } catch {
      setLoading(false);
      setMessage("تعذّر قراءة حقول التخصيص");
      return;
    }
    const count = fieldsParsed.fields?.length ?? 0;
    if (count < 1) {
      setLoading(false);
      setMessage("أضف حقلاً واحداً على الأقل وضع موضعه على الصورة.");
      return;
    }
    const res = await createTemplateAction(formData);
    setLoading(false);
    if (!res.ok) {
      setMessage(res.error ?? "خطأ");
      return;
    }
    setMessage("تم حفظ القالب بنجاح");
    router.push(`/templates/${res.templateId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="title">العنوان</Label>
        <Input id="title" name="title" required placeholder="بطاقة عيد ميلاد" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">الوصف (اختياري)</Label>
        <Textarea id="description" name="description" rows={3} />
      </div>
      <div className="space-y-2">
        <Label>الفئة</Label>
        <Select
          value={categoryId}
          onValueChange={setCategoryId}
          required
          disabled={categories.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر فئة" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nameAr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="price">السعر (ر.س)</Label>
        <Input id="price" name="price" type="text" defaultValue="0" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="source">صورة القالب (ملف واحد — تُعرض للمعاينة بعلامة مائية؛ بعد الشراء يُحمّل الأصلي)</Label>
        <Input
          id="source"
          name="source"
          type="file"
          accept="image/*"
          required
          onChange={(ev) => setSourceFile(ev.target.files?.[0] ?? null)}
        />
      </div>
      <div className="space-y-2">
        <Label>حقول التخصيص</Label>
        <TemplateFieldsEditor
          key={defaultFieldsJson}
          defaultFieldsJson={defaultFieldsJson}
          previewFile={sourceFile}
        />
      </div>
      {message && (
        <p
          className={
            message.startsWith("تم")
              ? "text-sm text-green-600"
              : "text-destructive text-sm"
          }
        >
          {message}
        </p>
      )}
      <Button type="submit" disabled={loading || categories.length === 0}>
        {loading ? "جاري الرفع…" : "حفظ القالب"}
      </Button>
    </form>
  );
}
