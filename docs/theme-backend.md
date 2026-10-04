# Theme backend: entities and example data

The **data model** behind the theme API: tables, TypeORM entities, DTOs and
example rows (NestJS + TypeORM + PostgreSQL).

> **The endpoint table in the "API" section below is superseded by
> [theme-api-request.md](theme-api-request.md)**, which is the contract to
> implement. Where the two disagree, that file wins. Everything else here —
> tables, entities, service core, sanitisation rules, example rows — still
> stands and is why that file is short.
>
> One correction: `POST /admin/media` already exists and returns
> `data: [{ id, url, … }]`, not `{ url }`. Nothing new is needed for images.

> This is a design and code sketch. It has not been compiled or run.

## Design decisions

- **A theme is a JSON document.** It has `settings` (colors, fonts, layout) and `sections[]` (each with `blocks[]`). The document is stored as `jsonb`. Don't normalize sections into tables: the schema is declarative and changes often, and the whole document is always read and written at once.
- **`draft` and `published` are separate `jsonb` columns.** The builder saves to the draft. Publishing copies the draft into `published`, and only the live theme's `published` document is served to customers.
- **One live theme per tenant** is enforced with a partial unique index (`is_live`). That avoids a circular foreign key between `tenants` and `themes`. The API still exposes `liveThemeId`.
- **The store profile is kept apart from themes.** It holds name, logo, menu, contact and shipping, and it survives a theme switch.
- **Share `src/lib/theme-engine/` with the backend.** `schema.ts`, `document.ts` and `types.ts` only use zod and plain TypeScript, so publish them as a package. `sanitizeDocument()` must run on the server before every save, because the browser is untrusted.

## Tables

```
tenants ──1:1── store_profiles
   │
   └─1:N── themes ──N:1── theme_presets
              │
              └─1:N── theme_versions   (publish history / rollback)
tenants ──1:N── media_assets
```

## Entities

### Shared types

```ts
// shared/theme-types.ts  (import from the shared theme-engine package)
export type SettingValue = string | number | boolean;
export interface ThemeDocument {
  settings: Record<string, SettingValue>;
  sections: {
    id: string; type: string;
    settings: Record<string, SettingValue>;
    blocks: { id: string; type: string; settings: Record<string, SettingValue> }[];
  }[];
}
```

### Tenant

```ts
// tenant.entity.ts  (only the columns this module needs; merge into your existing Tenant)
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 80 }) name: string;
  @Index({ unique: true }) @Column({ length: 63 }) slug: string;
  /** Public storefront key, sent as x-api-key. */
  @Index({ unique: true }) @Column({ name: 'api_key', length: 64 }) apiKey: string;
  @Column({ length: 32, default: 'Basic' }) plan: string;
  @Column({ name: 'theme_limit', type: 'int', default: 3 }) themeLimit: number;
  /** Demo catalog vertical until the store has products. */
  @Column({ length: 32, default: 'general' }) vertical: string;

  @OneToOne(() => StoreProfile, (p) => p.tenant) profile: StoreProfile;
  @OneToMany(() => Theme, (t) => t.tenant) themes: Theme[];
}
```

### StoreProfile

```ts
// store-profile.entity.ts
@Entity('store_profiles')
export class StoreProfile {
  @PrimaryColumn('uuid', { name: 'tenant_id' }) tenantId: string;
  @OneToOne(() => Tenant, (t) => t.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' }) tenant: Tenant;

  @Column({ length: 60 }) name: string;
  @Column({ length: 140, default: '' }) tagline: string;
  @Column({ type: 'text', default: '' }) logo: string;      // media URL
  @Column({ type: 'text', default: '' }) favicon: string;
  @Column({ type: 'char', length: 3, default: 'USD' }) currency: string;

  @Column({ type: 'jsonb', default: () => `'{"email":"","phone":"","address":""}'` })
  contact: { email: string; phone: string; address: string };

  @Column({ type: 'jsonb', default: () => `'{}'` })
  social: Partial<Record<'instagram' | 'facebook' | 'x' | 'tiktok' | 'youtube' | 'pinterest', string>>;

  @Column({ type: 'jsonb', default: () => `'{"enabled":false,"text":"","link":""}'` })
  announcement: { enabled: boolean; text: string; link: string };

  @Column({ type: 'jsonb', default: () => `'[]'` })
  navigation: { label: string; href: string }[];          // max 8

  @Column({ type: 'jsonb', default: () => `'{"freeShippingThreshold":0,"standardRate":0,"expressRate":0,"taxRate":0}'` })
  checkout: { freeShippingThreshold: number; standardRate: number; expressRate: number; taxRate: number };

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
```

### ThemePreset

```ts
// theme-preset.entity.ts  (theme-store catalog; seed it from THEME_PRESETS, or keep presets in code)
@Entity('theme_presets')
export class ThemePreset {
  @PrimaryColumn({ length: 64 }) id: string;               // 'maison', 'volt', 'petal', 'hearth'
  @Column({ length: 80 }) name: string;
  @Column({ length: 200 }) tagline: string;
  @Column({ type: 'text' }) description: string;
  @Column({ length: 32 }) vertical: string;
  @Column({ type: 'text', array: true, default: () => `'{}'` }) industries: string[];
  @Column({ type: 'text', array: true, default: () => `'{}'` }) style: string[];
  @Column({ type: 'text', array: true, default: () => `'{}'` }) features: string[];
  /** [background, surface, text, brand] swatches. */
  @Column({ type: 'text', array: true, default: () => `'{}'` }) palette: string[];
  @Column({ name: 'demo_store_name', length: 80 }) demoStoreName: string;
  @Column({ name: 'demo_tagline', length: 200 }) demoTagline: string;
  /** The finished starting ThemeDocument that gets cloned on install. */
  @Column({ type: 'jsonb' }) document: ThemeDocument;
  @Column({ name: 'schema_version', type: 'int', default: 1 }) schemaVersion: number;
  @Column({ name: 'sort_order', type: 'int', default: 0 }) sortOrder: number;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
```

### Theme

```ts
// theme.entity.ts
@Entity('themes')
@Index(['tenantId', 'updatedAt'])
// At most one live theme per tenant (Postgres partial unique index).
@Index('uq_themes_one_live_per_tenant', ['tenantId'], { unique: true, where: '"is_live" = true' })
export class Theme {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string;
  @ManyToOne(() => Tenant, (t) => t.themes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' }) tenant: Tenant;

  @Column({ length: 80 }) name: string;

  @Column({ name: 'preset_id', type: 'varchar', length: 64, nullable: true }) presetId: string | null;
  @ManyToOne(() => ThemePreset, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'preset_id' }) preset: ThemePreset | null;

  /** Builder working copy. */
  @Column({ type: 'jsonb' }) draft: ThemeDocument;

  /** Snapshot customers see. Excluded from list queries; load explicitly. */
  @Column({ type: 'jsonb', nullable: true, select: false }) published: ThemeDocument | null;

  @Column({ name: 'is_live', default: false }) isLive: boolean;
  @Column({ name: 'has_unpublished_changes', default: false }) hasUnpublishedChanges: boolean;

  /** Optimistic lock: bumped on every draft save so two editor tabs can't silently overwrite each other. */
  @VersionColumn() revision: number;

  @Column({ name: 'schema_version', type: 'int', default: 1 }) schemaVersion: number;
  @Column({ name: 'published_at', type: 'timestamptz', nullable: true }) publishedAt: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
```

### ThemeVersion

```ts
// theme-version.entity.ts  (one row per publish: history and rollback; keep the last ~20)
@Entity('theme_versions')
@Index(['themeId', 'version'], { unique: true })
export class ThemeVersion {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'theme_id', type: 'uuid' }) themeId: string;
  @ManyToOne(() => Theme, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'theme_id' }) theme: Theme;
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string;
  @Column({ type: 'int' }) version: number;
  @Column({ type: 'jsonb' }) document: ThemeDocument;
  @Column({ name: 'published_by', type: 'uuid', nullable: true }) publishedBy: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
```

### MediaAsset

```ts
// media-asset.entity.ts  (logos, favicons, banners uploaded via POST /admin/media)
@Entity('media_assets')
export class MediaAsset {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string;
  @Column({ type: 'text' }) url: string;
  @Column({ name: 'storage_key', type: 'text' }) storageKey: string;
  @Column({ name: 'mime_type', length: 64 }) mimeType: string;   // png/jpeg/webp/gif/avif only, never SVG
  @Column({ name: 'size_bytes', type: 'int' }) sizeBytes: number;
  @Column({ type: 'int', nullable: true }) width: number | null;
  @Column({ type: 'int', nullable: true }) height: number | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
```

Run with `synchronize: false` and generate migrations. TypeORM emits the partial unique index from the `@Index({ where })` above.

## API

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/themes` | Summaries (no `published`) with `isLive` and `hasUnpublishedChanges`. Live theme first, then by `updatedAt` desc. |
| GET | `/admin/themes/:id` | Full theme: draft and published. |
| POST | `/admin/themes` `{presetId, publish}` | Install. Returns 403 at `themeLimit`. "Use this theme" sends `publish: true`. |
| POST | `/admin/themes/:id/duplicate` | Copies the draft, `published = null`, name "Copy of …". Enforces `themeLimit`. |
| PUT | `/admin/themes/:id/draft` `{document, name?, expectedRevision?}` | Builder save. Sanitize first, and return 409 on a revision mismatch. |
| POST | `/admin/themes/:id/publish` `{document?, name?}` | Snapshot draft to published, set live, write a `theme_versions` row. |
| PATCH | `/admin/themes/:id/brand` | Customizer. Applies to draft and published. |
| GET, POST | `/admin/themes/:id/versions`, `/…/versions/:v/restore` | Optional rollback. Restore writes into the draft. |
| DELETE | `/admin/themes/:id` | 409 if live. |
| GET, PUT | `/admin/store/profile` | Validate like `StoreProfileSchema`. |
| GET | `/admin/theme-presets`, `/admin/theme-presets/:id` | Theme store. |
| POST | `/admin/media` | Multipart upload, returns `{ url }`. |
| GET | `/storefront/theme` (`x-api-key`) | Public. Returns `{ store, theme }` for the live published theme. |

All `/admin/*` routes resolve the tenant from the session, never from the URL. Every query includes `WHERE tenant_id = :tenantId`.

## DTOs

```ts
export class CreateThemeDto {
  @IsString() @MaxLength(64) presetId: string;
  @IsBoolean() publish: boolean;
}

export class SaveDraftDto {
  @IsObject() document: unknown;                 // validated by sanitizeDocument(), not class-validator
  @IsOptional() @IsString() @MaxLength(80) name?: string;
  @IsOptional() @IsInt() expectedRevision?: number;
}

export class PublishThemeDto {
  @IsOptional() @IsObject() document?: unknown;
  @IsOptional() @IsString() @MaxLength(80) name?: string;
}

export class BrandPatchDto {
  @IsOptional() @Matches(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i) colorPrimary?: string;
  @IsOptional() @Matches(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i) colorPrimaryText?: string;
  @IsOptional() @IsIn(FONT_KEYS) fontHeading?: string;   // Object.keys(FONTS)
  @IsOptional() @IsIn(FONT_KEYS) fontBody?: string;
}
// Store profile: reuse StoreProfileSchema (zod) through a ZodValidationPipe.
```

## Service core

```ts
@Injectable()
export class ThemesService {
  constructor(private readonly ds: DataSource) {}

  async install(tenantId: string, presetId: string, publish: boolean) {
    return this.ds.transaction(async (em) => {
      // Lock the tenant row so concurrent installs can't blow past themeLimit.
      const tenant = await em.findOneOrFail(Tenant, { where: { id: tenantId }, lock: { mode: 'pessimistic_write' } });
      const owned = await em.count(Theme, { where: { tenantId } });
      if (owned >= tenant.themeLimit) throw new ForbiddenException(`Theme limit reached (${tenant.themeLimit}).`);

      const preset = await em.findOne(ThemePreset, { where: { id: presetId, isActive: true } });
      if (!preset) throw new NotFoundException('Theme preset not found');

      if (publish) await em.update(Theme, { tenantId, isLive: true }, { isLive: false });
      const doc = structuredClone(preset.document);
      const theme = await em.save(Theme, em.create(Theme, {
        tenantId, presetId, name: preset.name, draft: doc,
        published: publish ? structuredClone(doc) : null,
        isLive: publish, publishedAt: publish ? new Date() : null,
        schemaVersion: preset.schemaVersion,
      }));
      if (publish) await this.snapshot(em, theme, doc);
      return theme;
    });
  }

  async saveDraft(tenantId: string, id: string, dto: SaveDraftDto) {
    const document = sanitizeDocument(dto.document);                 // shared package
    const theme = await this.owned(tenantId, id);
    if (dto.expectedRevision !== undefined && dto.expectedRevision !== theme.revision)
      throw new ConflictException('This theme was changed in another tab. Reload to continue.');
    theme.draft = document;
    theme.hasUnpublishedChanges = true;
    if (dto.name?.trim()) theme.name = dto.name.trim().slice(0, 80);
    return this.ds.getRepository(Theme).save(theme);                 // @VersionColumn bumps revision
  }

  async publish(tenantId: string, id: string, dto?: PublishThemeDto) {
    return this.ds.transaction(async (em) => {
      const theme = await em.findOne(Theme, { where: { id, tenantId } });
      if (!theme) throw new NotFoundException('Theme not found');
      if (dto?.document) theme.draft = sanitizeDocument(dto.document);
      if (dto?.name?.trim()) theme.name = dto.name.trim().slice(0, 80);

      await em.update(Theme, { tenantId, isLive: true }, { isLive: false }); // unset first: partial unique index
      theme.published = structuredClone(theme.draft);
      theme.isLive = true;
      theme.hasUnpublishedChanges = false;
      theme.publishedAt = new Date();
      await em.save(theme);
      await this.snapshot(em, theme, theme.published);
      return theme;
    });
  }

  async remove(tenantId: string, id: string) {
    const theme = await this.owned(tenantId, id);
    if (theme.isLive) throw new ConflictException("You can't delete your live theme. Publish another theme first.");
    await this.ds.getRepository(Theme).delete({ id, tenantId });
  }

  async patchBrand(tenantId: string, id: string, patch: BrandPatchDto) {
    const theme = await this.ds.getRepository(Theme).findOneOrFail({ where: { id, tenantId }, select: { id: true, draft: true, published: true } as any });
    const fields = THEME_SETTINGS_SCHEMA.filter((f) => f.id in patch && BRAND_SETTING_KEYS.includes(f.id as any));
    const clean = sanitizeSettings(fields, patch as Record<string, unknown>);
    theme.draft.settings = { ...theme.draft.settings, ...clean };
    if (theme.published) theme.published.settings = { ...theme.published.settings, ...clean };
    return this.ds.getRepository(Theme).save(theme);
  }

  /** Public storefront: live published document + profile. Cache by api key. */
  async liveByApiKey(apiKey: string) {
    return this.ds.getRepository(Theme).createQueryBuilder('t')
      .addSelect('t.published')
      .innerJoin(Tenant, 'tn', 'tn.id = t.tenant_id')
      .innerJoinAndMapOne('t.profile', StoreProfile, 'p', 'p.tenant_id = t.tenant_id')
      .where('tn.api_key = :apiKey AND t.is_live = true AND t.published IS NOT NULL', { apiKey })
      .getOne();
  }
}
```

Cache the storefront endpoint in Redis or with `Cache-Control` and an ETag, keyed by api key. Invalidate it on publish, on a brand patch and on a profile update.

## Example data

### Row in `themes`

This is the Maison theme from the mock DB.

```json
{
  "id": "5f0c1d0e-6a53-4b21-9f0e-2c7d7b1e9a10",
  "tenantId": "0d6f9d0a-3c1b-4a55-8c1c-6f6d3b0d2a01",
  "name": "Maison",
  "presetId": "maison",
  "isLive": true,
  "hasUnpublishedChanges": false,
  "revision": 7,
  "schemaVersion": 1,
  "publishedAt": "2026-09-28T04:54:47.566Z",
  "draft": {
    "settings": {
      "colorBackground": "#faf8f5", "colorSurface": "#efe9e1", "colorText": "#1c1917",
      "colorPrimary": "#1e3a5f", "colorPrimaryText": "#ffffff", "colorSale": "#9f1239",
      "fontHeading": "fraunces", "fontBody": "manrope", "headingScale": 115, "headingCase": "none",
      "pageWidth": 1320, "radius": 0, "buttonShape": "sharp",
      "headerLayout": "center", "headerSticky": true,
      "cardImageRatio": "portrait", "cardHoverImage": true, "cardShowBrand": true,
      "cardShowRating": true, "cardQuickAdd": true, "animations": true
    },
    "sections": [
      {
        "id": "sec_899b5da9a0db", "type": "hero",
        "settings": { "layout": "overlay", "image": "", "eyebrow": "The Autumn Edit",
          "heading": "Quiet luxury, everyday", "text": "Soft tailoring, rich textures…",
          "alignment": "left", "height": "full", "overlay": 30, "colorScheme": "default" },
        "blocks": [
          { "id": "blk_11b0b34cc580", "type": "button",
            "settings": { "label": "Shop new arrivals", "url": "/products?collection=new-arrivals", "style": "primary" } },
          { "id": "blk_f74e3bd3c601", "type": "button",
            "settings": { "label": "Explore the edit", "url": "/products", "style": "secondary" } }
        ]
      },
      { "id": "sec_06d4c4fc3598", "type": "products",
        "settings": { "heading": "New arrivals", "collection": "new-arrivals", "count": 8, "columns": 4,
          "layout": "grid", "showViewAll": true, "colorScheme": "default", "spacing": "medium" },
        "blocks": [] }
    ]
  },
  "published": "<same shape as draft>"
}
```

The valid section types are `hero`, `marquee`, `categories`, `products`, `promo-banner`, `collection-tiles`, `image-with-text`, `features`, `brands`, `testimonials`, `newsletter` and `rich-text`. Their per-type settings and blocks are defined in `src/lib/theme-engine/schema.ts`.

### Row in `store_profiles`

```json
{
  "tenantId": "0d6f9d0a-3c1b-4a55-8c1c-6f6d3b0d2a01",
  "name": "Acme Apparel", "tagline": "Everyday clothing, thoughtfully made.",
  "logo": "https://cdn.example.com/t/acme/logo.png", "favicon": "", "currency": "USD",
  "contact": { "email": "hello@acmeapparel.com", "phone": "+1 (555) 014-2290", "address": "118 Mercer Street, New York, NY 10012" },
  "social": { "instagram": "https://instagram.com/acmeapparel", "tiktok": "https://tiktok.com/@acmeapparel" },
  "announcement": { "enabled": true, "text": "Free shipping over $75 · 30-day returns", "link": "/products" },
  "navigation": [ { "label": "New in", "href": "/products?collection=new-arrivals" }, { "label": "Sale", "href": "/products?collection=sale" } ],
  "checkout": { "freeShippingThreshold": 75, "standardRate": 6, "expressRate": 15, "taxRate": 0.08 }
}
```

### Requests and responses

```http
POST /admin/themes              { "presetId": "maison", "publish": true }
PUT  /admin/themes/:id/draft    { "document": { "settings": {…}, "sections": […] }, "expectedRevision": 7 }
POST /admin/themes/:id/publish  {}
PATCH /admin/themes/:id/brand   { "colorPrimary": "#0f766e", "fontHeading": "playfair" }

GET  /storefront/theme          x-api-key: pk_test_acme_7f3a9c21
→ { "store": { "slug": "acme", "name": "Acme Apparel", … },
    "theme": { "settings": {…}, "sections": […] } }
```

## Security rules the backend must enforce

- Run `sanitizeDocument()` on every draft save, every publish that carries a document, and every preset seed. It drops unknown section types, blocks and keys, clamps ranges, and allows only `http(s)`, relative, `#`, `mailto:` and `tel:` links.
- Accept raster images only, never SVG. Prefer uploaded media URLs over `data:` URLs, so the 1.5 MB inline limit isn't needed in production.
- Scope every query by the session's `tenant_id`, and check `themeLimit` inside the locked transaction.
- Keep `schema_version` on themes so a future section-schema change can migrate old documents lazily.
