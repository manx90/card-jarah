"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHero } from "@/components/layout/page-hero";
import { FolderOpen, Palette, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface PurchaseItem {
  id: string;
  templateId: string;
  templateTitle: string;
  categoryName: string | null;
  createdAt: string;
  customizeUrl: string;
}

interface DesignItem {
  id: string;
  templateId: string;
  templateTitle: string;
  title: string;
  updatedAt: string;
}

export function AccountDesignsClient() {
  const [purchases, setPurchases] = useState<PurchaseItem[] | null>(null);
  const [designs, setDesigns] = useState<DesignItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, dRes] = await Promise.all([
          fetch("/api/v1/account/purchases"),
          fetch("/api/v1/designs"),
        ]);
        const pJson = (await pRes.json()) as {
          success: boolean;
          data?: { items: PurchaseItem[] };
        };
        const dJson = (await dRes.json()) as {
          success: boolean;
          data?: { items: DesignItem[] };
        };
        if (pJson.success && pJson.data) setPurchases(pJson.data.items);
        if (dJson.success && dJson.data) setDesigns(dJson.data.items);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="الحساب"
        title="تصاميمي وطلباتي"
        description="عدّل قوالبك المشتراة أو استأنف تصاميمك المحفوظة"
      />

      <Tabs defaultValue="designs" className="mt-6">
        <TabsList className="">
          <TabsTrigger value="designs" className="gap-1.5">
            <FolderOpen className="size-4" />
            التصاميم
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5">
            <ShoppingBag className="size-4" />
            المشتريات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="designs" className="mt-4 space-y-3">
          {!designs?.length ? (
            <Card>
              <CardContent className="text-muted-foreground py-10 text-center text-sm">
                لا تصاميم محفوظة بعد.{" "}
                <Link href="/templates" className="text-primary underline">
                  تصفّح القوالب
                </Link>
              </CardContent>
            </Card>
          ) : (
            designs.map((d) => (
              <Card key={d.id} className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{d.title}</CardTitle>
                  <CardDescription className="">{d.templateTitle}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs">
                    آخر تعديل:{" "}
                    {new Date(d.updatedAt).toLocaleDateString("ar-KW", {
                      dateStyle: "medium",
                    })}
                  </span>
                  <Button size="sm" className="gap-1.5" asChild>
                    <Link href={`/templates/${d.templateId}/customize?design=${d.id}`}>
                      <Palette className="size-4" />
                      متابعة التعديل
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="orders" className="mt-4 space-y-3">
          {!purchases?.length ? (
            <Card>
              <CardContent className="text-muted-foreground py-10 text-center text-sm">
                لا مشتريات بعد.
              </CardContent>
            </Card>
          ) : (
            purchases.map((p) => (
              <Card key={p.id} className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{p.templateTitle}</CardTitle>
                  {p.categoryName && (
                    <CardDescription className="">{p.categoryName}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs">
                    {new Date(p.createdAt).toLocaleDateString("ar-KW", {
                      dateStyle: "medium",
                    })}
                  </span>
                  <Button size="sm" variant="outline" className="gap-1.5" asChild>
                    <Link href={p.customizeUrl}>
                      <Palette className="size-4" />
                      تخصيص
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
