"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Database, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { removeSeededCatalogAction, seedCatalogAction } from "@/lib/api/seed/action";
import type { SeedCatalogStatus } from "@/lib/api/seed/types";

function Row({ label, available, total, seeded }: { label: string; available: number; total: number; seeded: number }) {
  const own = total - seeded;
  return (
    <div className="flex items-center justify-between border-b py-2.5 text-sm last:border-0">
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">
        {seeded} demo {seeded !== 1 ? "rows" : "row"}
        {own > 0 && ` · ${own} your own`}
        {" · "}
        {available} available in a fresh run
      </span>
    </div>
  );
}

export function SeedCatalogPanel({ status }: { status: SeedCatalogStatus }) {
  const router = useRouter();
  const [withImages, setWithImages] = useState(true);
  const [reset, setReset] = useState(false);
  const [isSeeding, startSeeding] = useTransition();
  const [isRemoving, startRemoving] = useTransition();
  const hasSeeded = status.seeded.brands + status.seeded.categories + status.seeded.products > 0;

  function onSeed() {
    startSeeding(async () => {
      const result = await seedCatalogAction({ withImages, reset });
      if (!result?.data) {
        toast.error(result?.serverError ?? "Couldn't seed the demo catalog.");
        return;
      }
      const { brands, categories, products, images } = result.data.result;
      toast.success(`Seeded ${products.created} products, ${brands.created} brands, ${categories.created} categories`, {
        description: images.failed > 0 ? `${images.uploaded} images uploaded, ${images.failed} failed` : `${images.uploaded} images uploaded`,
      });
      router.refresh();
    });
  }

  function onRemove() {
    startRemoving(async () => {
      const result = await removeSeededCatalogAction({});
      if (!result?.data) {
        toast.error(result?.serverError ?? "Couldn't remove the demo catalog.");
        return;
      }
      const { products, brands, categories, media } = result.data.removed;
      toast.success(`Removed ${products} products, ${brands} brands, ${categories} categories, ${media} media assets`);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="size-4" /> Demo catalog
        </CardTitle>
        <CardDescription>
          Fill this store with demo brands, categories and products — useful for testing a storefront or theme against real data instead of an
          empty catalog.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-md border">
          <div className="px-4">
            <Row label="Brands" available={status.available.brands} total={status.total.brands} seeded={status.seeded.brands} />
            <Row label="Categories" available={status.available.categories} total={status.total.categories} seeded={status.seeded.categories} />
            <Row label="Products" available={status.available.products} total={status.total.products} seeded={status.seeded.products} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox id="withImages" checked={withImages} onCheckedChange={(v) => setWithImages(v === true)} />
            <Label htmlFor="withImages" className="text-sm font-normal">Include demo images (adds about a minute)</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="reset" checked={reset} onCheckedChange={(v) => setReset(v === true)} />
            <Label htmlFor="reset" className="text-sm font-normal">Remove previously seeded rows first</Label>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            Catalog only — this never creates customers, orders or payments. Re-running is safe: existing rows are matched by slug/SKU and
            skipped. Everything written is marked (<code className="font-mono text-xs">demo-</code> slugs, <code className="font-mono text-xs">DEMO-</code> SKUs), so removing it never touches your own data.
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-3">
          <Button onClick={onSeed} disabled={isSeeding || isRemoving}>
            {isSeeding && <Loader2 className="animate-spin" />}
            {reset ? "Reset and seed" : "Seed demo catalog"}
          </Button>
          {hasSeeded && (
            <Button variant="outline" onClick={onRemove} disabled={isSeeding || isRemoving}>
              {isRemoving ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Remove demo data
            </Button>
          )}
        </div>

        {!hasSeeded && status.total.products - status.seeded.products > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="size-3.5" /> This store already has real products. Seeding adds alongside them without touching what&rsquo;s there.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
