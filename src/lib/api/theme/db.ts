import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { demoStoreProfile } from "@/lib/storefront/mock/catalog-data";
import { getPreset } from "@/lib/theme-engine/presets";
import { newId } from "@/lib/theme-engine/document";
import type { Tenant, Theme } from "./types";

// ---------------------------------------------------------------------------
// MOCK PERSISTENCE: a JSON file standing in for the backend database. It is
// shared by every route/server action in the dev server and survives restarts
// and hot reloads. Delete `.data/theme-engine.json` to reset to seed data.
// Replace with real API calls in service.ts; nothing else touches this file.
// ---------------------------------------------------------------------------

type Db = { version: number; tenants: Tenant[]; themes: Theme[] };

const DB_VERSION = 3;
const DB_FILE = path.join(process.cwd(), ".data", "theme-engine.json");

function seedTheme(tenant: Tenant, presetId: string, name: string, publish: boolean): Theme {
  const now = new Date().toISOString();
  const draft = getPreset(presetId)!.build();
  return {
    id: newId("thm"),
    tenantId: tenant.id,
    name,
    presetId,
    draft,
    published: publish ? structuredClone(draft) : null,
    createdAt: now,
    updatedAt: now,
    publishedAt: publish ? now : null,
  };
}

type TenantSeed = Pick<Tenant, "id" | "name" | "slug" | "vertical" | "plan" | "themeLimit" | "apiKey"> & { tagline: string };

function tenant({ tagline, ...seed }: TenantSeed): Tenant {
  return { ...seed, liveThemeId: null, profile: demoStoreProfile(seed.vertical, seed.name, tagline) };
}

function seed(): Db {
  const acme = tenant({ id: "tnt_acme", name: "Acme Apparel", slug: "acme", vertical: "fashion", plan: "Basic", themeLimit: 3, apiKey: "pk_test_acme_7f3a9c21", tagline: "Everyday clothing, thoughtfully made." });
  const nova = tenant({ id: "tnt_nova", name: "Nova Electronics", slug: "nova", vertical: "electronics", plan: "Pro", themeLimit: 6, apiKey: "pk_test_nova_2b8e4d10", tagline: "Smart tech at honest prices." });
  const bloom = tenant({ id: "tnt_bloom", name: "Bloom Beauty", slug: "bloom", vertical: "beauty", plan: "Starter", themeLimit: 2, apiKey: "pk_test_bloom_5c1f6e77", tagline: "Clean beauty for every skin." });

  const acmeLive = seedTheme(acme, "maison", "Maison", true);
  const novaLive = seedTheme(nova, "volt", "Volt", true);
  const novaDraft = seedTheme(nova, "hearth", "Hearth (redesign)", false);
  acme.liveThemeId = acmeLive.id;
  nova.liveThemeId = novaLive.id;

  // Bloom has no theme yet: demonstrates the "pick your first theme" flow.
  return { version: DB_VERSION, tenants: [acme, nova, bloom], themes: [acmeLive, novaLive, novaDraft] };
}

async function writeDb(db: Db) {
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

export async function readDb(): Promise<Db> {
  try {
    const db = JSON.parse(await fs.readFile(DB_FILE, "utf8")) as Db;
    if (db.version === DB_VERSION) return db;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const fresh = seed();
  await writeDb(fresh);
  return fresh;
}

// Serialise read-modify-write cycles so concurrent actions can't clobber each other.
let queue: Promise<unknown> = Promise.resolve();

export function mutateDb<T>(mutator: (db: Db) => T): Promise<T> {
  const run = queue.then(async () => {
    const db = await readDb();
    const result = mutator(db);
    await writeDb(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}
