# Theme API — what the storefront needs from the backend

Written for: the backend team building the ecom-engine API.

The dashboard already has a working theme builder: presets, a section/block
editor, a live preview, draft-and-publish, and a store profile editor. All of
it currently reads and writes a **JSON file on the frontend's disk**
(`.data/theme-engine.json`). That file is not in the container image and does
not survive a redeploy, so none of it is real yet.

Everything below is one feature: **store a JSON document per tenant, serve the
published one to the public storefront.** No rendering happens on the backend.

## Why it is only a document

A theme is a declarative tree — settings, sections, each section with blocks:

```json
{
  "settings": { "colorPrimary": "#0d7d6e", "fontHeading": "Inter", "radius": 8 },
  "sections": [
    { "id": "s1", "type": "hero",
      "settings": { "heading": "Dashain sale", "image": "https://…" },
      "blocks": [ { "id": "b1", "type": "button", "settings": { "label": "Shop" } } ] }
  ]
}
```

The shape changes every time a section type is added, so **do not normalise it
into tables.** One `jsonb` column, read and written whole. The frontend owns
the schema and validates against it; the backend stores it and must not
interpret it.

## Tables

```
tenants ──1:1── store_profiles          name, logo, contact, menu, socials
   └────1:N── themes                    draft jsonb, published jsonb, is_live
                 └─1:N── theme_versions publish history, for rollback
```

- `themes.draft` — what the builder saves on every edit.
- `themes.published` — what the storefront serves. Publishing copies draft into
  published and appends a `theme_versions` row.
- One live theme per tenant: a partial unique index on `(tenant_id) where
  is_live`, rather than a `live_theme_id` column on tenants, which would make
  the foreign keys circular.

## Endpoints

Same conventions as the rest of the API: owner JWT for admin, `x-api-key` for
the storefront, `{ success, message, data }` envelope, `forbidNonWhitelisted`.

### Admin — owner JWT

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| GET | `/admin/themes` | — | The tenant's themes. `isLive` on each. |
| POST | `/admin/themes` | `{ name, presetId }` | New theme from a preset id. The frontend sends the whole starting `draft` document. |
| GET | `/admin/themes/:id` | — | Includes `draft` and `published`. |
| PUT | `/admin/themes/:id` | `{ name?, draft? }` | The builder's save. `draft` is the whole document. |
| POST | `/admin/themes/:id/publish` | — | Copy draft → published, append a version, set `is_live`. |
| POST | `/admin/themes/:id/unpublish` | — | Clear `is_live`. The storefront then has no live theme. |
| DELETE | `/admin/themes/:id` | — | 409 if it is the live theme. |
| GET | `/admin/themes/:id/versions` | — | Publish history: `{ id, publishedAt, note }`. |
| POST | `/admin/themes/:id/restore/:versionId` | — | Copy that version into `draft`. |
| GET | `/admin/store-profile` | — | The merchant's identity, below. |
| PUT | `/admin/store-profile` | the profile object | Survives a theme switch. |

### Storefront — `x-api-key`

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/storefront/theme` | `{ theme: { id, name, presetId }, document, profile }` — the **published** document for the key's tenant, plus the store profile. 404 when nothing is published. |

That one route is what makes the public shop work. It is the highest priority
here; the admin routes can follow.

## The store profile

Kept apart from themes so a theme switch does not lose it:

```json
{
  "name": "Bibash Toy Shop",
  "tagline": "Toys that last",
  "logo": "https://…", "favicon": "https://…",
  "currency": "NPR",
  "contact": { "email": "…", "phone": "…", "address": "…" },
  "social": { "instagram": "…", "facebook": "…", "x": "…", "tiktok": "…", "youtube": "…", "pinterest": "…" },
  "announcement": { "enabled": true, "text": "Free delivery over Rs 5000", "link": "/products" },
  "navigation": [ { "label": "Shop", "href": "/products" } ],
  "checkout": { "freeShippingThreshold": 5000, "standardRate": 120, "expressRate": 250, "taxRate": 0 }
}
```

## Three things that matter

**1. Sanitise on write — the browser is untrusted.** The builder posts a
document the shopper's browser will render. Without server-side sanitising,
anyone with a dashboard login can store an XSS payload that fires on the
public shop. The frontend's `sanitizeDocument()` and `sanitizeSettings()`
(`src/lib/theme-engine/document.ts`) are plain TypeScript with only a zod
dependency — publish them as a shared package and run the same functions
server-side, or port the rules:

- image and link values must match an allowlist of `https:` and relative `/…`
  URLs — no `javascript:`, no `data:` except images;
- unknown section and block types are dropped, not stored;
- settings are filtered against the schema for that section type;
- strings are length-capped (a 1 MB "heading" is a denial-of-service).

**2. Cap the document.** Reject anything over ~256 KB, 50 sections, or 50
blocks per section. The editor cannot produce more; a crafted request can.

**3. Publishing must be atomic.** Copying draft → published and flipping
`is_live` happen in one transaction, or a reader can catch a half-published
store.

## What the frontend will do when this lands

`src/lib/api/theme/service.ts` is the only file that touches the JSON store;
every call site already goes through it. Swapping it for `apiClient` calls
against these routes is a contained change — no component or page moves.

Until then the public shop renders a default preset with the real catalog
behind it, so it is not blocked; it simply ignores whatever the merchant does
in the builder.

## Reference

`docs/theme-backend.md` in the frontend repo has the entity sketches, the
`jsonb` column definitions and example documents, written against this same
design.
