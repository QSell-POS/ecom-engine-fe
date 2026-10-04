# Theme API — what the frontend needs built

Written for: the backend team building the ecom-engine API.

**This file is the contract.** The data model behind it — entities, columns,
indexes, example rows — is in [theme-backend.md](theme-backend.md), whose own
endpoint table is superseded by this one.

The dashboard already has a working theme builder: a theme store, presets, a
section/block editor with live preview, draft-and-publish, and a store profile
editor. All of it reads and writes a **JSON file on the frontend's disk**
(`.data/theme-engine.json`). That file is not in the container image and does
not survive a redeploy, so none of it is real yet.

It is one feature: **store a JSON document per tenant, serve the published one
to the public storefront.** No rendering happens on the backend.

## Why it is a document, not tables

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

The shape changes every time a section type is added, so **do not normalise it.**
One `jsonb` column, read and written whole. The frontend owns the schema and
validates against it; the backend stores it, sanitises it, and does not
interpret it.

## Endpoints

Same conventions as the rest of the API: owner JWT for admin, `x-api-key` for
the storefront, the `{ success, message, data }` envelope, and
`forbidNonWhitelisted` validation.

### Storefront — `x-api-key`

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/storefront/theme` | `{ store, theme }` — the **published** document for the key's tenant, plus the store profile. 404 when nothing is published. |

```json
{ "success": true, "data": {
  "store":  { "slug": "bibash-toys", "profile": { … } },
  "theme":  { "id": "…", "name": "Maison", "presetId": "maison", "document": { … } } } }
```

**This single route is what makes the public shop work.** It is the highest
priority here; the admin routes can follow.

### Admin — owner JWT

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| GET | `/admin/themes` | — | Summaries without `published`, carrying `isLive` and `hasUnpublishedChanges`. Live theme first, then `updatedAt` desc. |
| GET | `/admin/themes/:id` | — | Full theme: `draft` and `published`. |
| POST | `/admin/themes` | `{ presetId, publish? }` | Install from a preset. "Use this theme" sends `publish: true`. 403 at `themeLimit`. |
| POST | `/admin/themes/:id/duplicate` | — | Copies the draft, `published = null`, name "Copy of …". 403 at `themeLimit`. |
| PUT | `/admin/themes/:id/draft` | `{ document, name?, expectedRevision? }` | The builder's save. Sanitise first; 409 on a revision mismatch. |
| POST | `/admin/themes/:id/publish` | `{ document?, name? }` | Snapshot draft → published, set live, append a `theme_versions` row. |
| PATCH | `/admin/themes/:id/brand` | `{ colorPrimary?, colorPrimaryText?, fontHeading?, fontBody? }` | The simple customizer. Applies to draft **and** published, so a colour change is live at once. |
| GET | `/admin/themes/:id/versions` | — | Publish history. |
| POST | `/admin/themes/:id/versions/:versionId/restore` | — | Copies that version into the draft. |
| DELETE | `/admin/themes/:id` | — | 409 if it is live. |
| GET | `/admin/store/profile` | — | The merchant's identity, below. |
| PUT | `/admin/store/profile` | the profile object | Validate like `StoreProfileSchema`. |
| GET | `/admin/theme-presets` · `/admin/theme-presets/:id` | — | Optional: the theme store. Presets can equally stay in frontend code. |

Images already work — `POST /admin/media` exists and returns
`data: [{ id, url, … }]`. Themes reference an asset's **URL** inside the
document, so nothing new is needed there.

### Two behaviours worth getting right

**`expectedRevision`** — the builder autosaves. Two open tabs will clobber each
other without it: store a revision counter per theme, have the builder send
the one it loaded, and return 409 when they differ.

**`PATCH /brand` writes to both documents.** The simple customizer is for
merchants who never open the builder; its changes have to show on the live
store immediately, not sit in a draft waiting for a publish they'll never do.

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
document that a shopper's browser will render. Without server-side sanitising,
anyone with a dashboard login can store an XSS payload that fires on the public
shop. `sanitizeDocument()` and `sanitizeSettings()` in
`src/lib/theme-engine/document.ts` are plain TypeScript with only a zod
dependency — publish them as a shared package and run the same functions, or
port the rules:

- image and link values must match an allowlist: `https:`, relative `/…`, `#`,
  `mailto:`, `tel:` — no `javascript:`, and no SVG data URLs;
- unknown section and block types are dropped, not stored;
- settings are filtered against the schema for that section type;
- strings are length-capped — a 1 MB "heading" is a denial-of-service.

**2. Cap the document.** Reject anything over ~256 KB, 50 sections, or 50
blocks per section. The editor cannot produce more; a crafted request can.

**3. Publishing must be atomic.** Copying draft → published and flipping
`is_live` happen in one transaction, or a reader catches a half-published
store. One live theme per tenant is a partial unique index on `(tenant_id)
where is_live`, rather than a `live_theme_id` column, which would make the
foreign keys circular.

## What the frontend does when this lands

`src/lib/api/theme/service.ts` is the only file that touches the JSON store,
and every call site already goes through it. Swapping its bodies for
`apiClient` calls against these routes is a contained change — no component or
page moves, and the signatures stay as they are.

Until then the public shop renders a default preset with the real catalog
behind it, so it is not blocked; it simply ignores whatever the merchant does
in the builder.
