# Theme API — built, and where it differs from the contract

Written for: the frontend team who wrote [theme-api-request.md](theme-api-request.md).

The theme backend is implemented. `src/lib/api/theme/service.ts` can stop reading
`.data/theme-engine.json` and call these routes instead, and the public shop can
render a merchant's real published theme.

Everything in the contract exists. Five things behave differently from what that
document asked for, and each is listed below with the reason — read **[What is
different](#what-is-different)** before wiring up, because one of them changes how
you detect "this store has no theme".

---

## Where it lives

| Thing                                              | File                                                                       |
| -------------------------------------------------- | -------------------------------------------------------------------------- |
| Entities (`Theme`, `ThemeVersion`, `StoreProfile`) | `apps/core-service/src/entities/tenant/theme/index.ts`                     |
| Routes                                             | `apps/core-service/src/modules/theme/theme.controller.ts`                  |
| Service (install, publish, brand patch, restore)   | `apps/core-service/src/modules/theme/theme.service.ts`                     |
| Sanitising — the security boundary                 | `apps/core-service/src/modules/theme/theme-engine/document.ts`             |
| Schema the sanitiser enforces                      | `apps/core-service/src/modules/theme/theme-engine/schema.ts`               |
| Store-profile validation                           | `apps/core-service/src/modules/theme/theme-engine/profile.ts`              |
| The four demo themes                               | `apps/core-service/src/modules/theme/theme-engine/presets.ts`              |
| Migration                                          | `apps/core-service/src/database/migrations/tenant/1791400000000-themes.ts` |

Requests for every route are in the Bruno collection under `apps/bruno/theme/`
and `apps/bruno/seed/`.

---

## Routes

All of them return the usual `{ success, message, data }` envelope.

### Storefront — `x-api-key`

| Method | Path                | Returns                                  |
| ------ | ------------------- | ---------------------------------------- |
| GET    | `/storefront/theme` | `{ store, theme }` for the key's tenant. |

```json
{
  "success": true,
  "message": "Storefront theme fetched successfully",
  "data": {
    "store": {
      "id": "0d6f9d0a-…",
      "slug": "bibash-toys",
      "name": "Bibash Toy Shop",
      "profile": { "name": "…", "logo": "…", "navigation": [], "checkout": { … } }
    },
    "theme": {
      "id": "5f0c1d0e-…",
      "name": "Maison",
      "presetId": "maison",
      "schemaVersion": 1,
      "publishedAt": "2026-10-04T09:12:00.000Z",
      "source": "published",
      "document": { "settings": { … }, "sections": [ … ] }
    }
  }
}
```

### Admin — owner JWT

| Method   | Path                                               | Body                                                            | Notes                                                                                                                                           |
| -------- | -------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| GET      | `/admin/themes`                                    | —                                                               | Summaries without `published`, carrying `isLive`, `hasUnpublishedChanges`, `revision`, `sectionCount`. Live theme first, then `updatedAt` desc. |
| POST     | `/admin/themes`                                    | `{ presetId, publish? }`                                        | Install from a preset. `publish: true` makes the store live in the same transaction. 403 at the theme limit.                                    |
| GET      | `/admin/themes/:id`                                | —                                                               | Full theme: `draft` and `published`.                                                                                                            |
| POST     | `/admin/themes/:id/duplicate`                      | —                                                               | Copies the draft, `published: null`, name `Copy of …`.                                                                                          |
| PUT      | `/admin/themes/:id/draft`                          | `{ document, name?, expectedRevision? }`                        | Sanitises, then 409 on a revision mismatch.                                                                                                     |
| POST     | `/admin/themes/:id/publish`                        | `{ document?, name? }`                                          | Draft → published, set live, append a version row. One transaction.                                                                             |
| PATCH    | `/admin/themes/:id/brand`                          | `{ colorPrimary?, colorPrimaryText?, fontHeading?, fontBody? }` | Writes to draft **and** published, so the change is live at once.                                                                               |
| GET      | `/admin/themes/:id/versions`                       | —                                                               | Publish history, newest first, most recent 20.                                                                                                  |
| POST     | `/admin/themes/:id/versions/:versionId/restore`    | —                                                               | Copies that version into the draft. Never straight onto the live store.                                                                         |
| DELETE   | `/admin/themes/:id`                                | —                                                               | 409 if it is live.                                                                                                                              |
| GET, PUT | `/admin/store/profile`                             | the profile object                                              | Validated by `sanitizeProfile()`.                                                                                                               |
| GET      | `/admin/theme-presets`, `/admin/theme-presets/:id` | —                                                               | The theme store.                                                                                                                                |

Every admin route resolves the tenant from the JWT, never from the URL, and the
existing guard-coverage test in `src/guards/tenant.guard.spec.ts` fails the build
if an `admin/*` controller is ever added without the owner JWT.

---

## What is different

**1. `GET /storefront/theme` does not 404 when nothing is published.**

The contract asked for a 404. It returns 200 with the default preset instead:

```json
"theme": { "id": null, "source": "default-preset", "presetId": "maison", "document": { … } }
```

A newly registered store would otherwise be a blank page between signing up and
picking a theme, and the storefront would need an error path to render anything at
all. Branch on `theme.source` (`"published"` or `"default-preset"`) rather than on
the status code, and use `theme.id === null` to mean "this merchant has not chosen
a theme yet" — that is what the "make it yours" checklist should key off.

**2. `store.slug` comes from `tenants.subdomain`.**

There is no `slug` column on `tenants`; `subdomain` is the one that is unique and
already exists, and registration now assigns one, so `store.slug` is the
merchant's real storefront label (`bibash-toys`) and the same string as their
`bibash-toys.qsellpos.com` host. A tenant registered before that existed and not
yet backfilled falls back to its uuid, which is ugly but never collides — see
[tenant-domains.md](tenant-domains.md) for the backfill and for the hosting
model.

**3. Theme presets are code, not a table.**

`THEME_PRESETS` in `theme-engine/presets.ts`. They ship with the release that can
render them, so a preset can never reference a section type the running frontend
does not know, and there is no seeding step between a deploy and a working theme
store. `GET /admin/theme-presets` serves them, so the route shape is as the
contract specified. Installing clones the document into the tenant's schema, so
editing a preset later never rewrites a store that is already live.

If you would rather own the presets on the frontend, keep them there and delete
these — nothing else depends on them except the `default-preset` fallback.

**4. The theme limit is `THEME_LIMIT` (default 5), not a `tenants.theme_limit` column.**

A per-plan limit belongs with a plan column, and there is no plan column yet.
When plans land, move it.

**5. `sanitizeDocument()` is a hand port of your rules, not the shared package.**

This is the one that needs your attention.

`theme-engine/schema.ts` is a port of your `src/lib/theme-engine/schema.ts`,
written from the section list and examples in the contract. Sanitising has to
default to rejecting, so **a setting your schema defines and this one does not is
dropped on save, silently.** A merchant would see a section render with a missing
heading and nothing would appear in any log.

Two relaxations reduce how often that bites:

- font keys are validated as slugs (`^[a-z0-9][a-z0-9-]{0,31}$`), not against an
  enum of font names, so adding a font needs no backend release;
- a `select` value that is not a known option falls back to the field's first
  option instead of disappearing.

Neither helps with a brand-new setting key or section type. Two ways out, in order
of preference:

1. Publish `src/lib/theme-engine/{schema,document,types}.ts` as the shared package
   the contract proposed. They only need zod. Then
   `theme-engine/{schema,document}.ts` here are deleted and the package is
   imported, and there is one schema again.
2. Until then: when you add a section type or a setting, add it to
   `theme-engine/schema.ts` in the same pull request.
   `theme-engine/presets.spec.ts` asserts that every preset survives sanitising
   with every key intact, so the four demo themes are at least a regression test
   on the port.

The rules themselves are all enforced, and `theme-engine/document.spec.ts` covers
them: `javascript:`/`vbscript:`/`data:text/html` links dropped, SVG data URLs
dropped while raster ones pass, protocol-relative `//host` URLs dropped, unknown
section and block types dropped, unknown keys dropped, strings capped, control
characters stripped, numbers clamped, 256 KB / 50 sections / per-section block
caps enforced.

---

## Also changed: the storefront catalog can filter and sort

Not a theme change, but it closes the gap your `catalog-api.ts` documents — that
"filtering and sorting beyond `search`/`brandId`/`categoryId` happen in-process on
a fetched page". Applied to one page of forty, a price filter gives the shopper
the wrong products and a count that does not match what they can see.

`GET /products` now takes, in SQL, across the whole catalog:

| Query                       | Meaning                                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `brandSlug`, `categorySlug` | Filter by slug, no id lookup first. `categorySlug` includes that category's direct children.                                 |
| `minPrice`, `maxPrice`      | Inclusive price range.                                                                                                       |
| `inStock=true`              | Only products with sellable stock (`on hand − reserved > 0`). A presence filter: anything other than `true` means no filter. |
| `badge`                     | One `ProductBadge`, e.g. `featured`, `best_seller`.                                                                          |
| `tag`                       | Tag slug or name.                                                                                                            |
| `sort`                      | `newest` (default), `oldest`, `price-asc`, `price-desc`, `name-asc`, `name-desc`.                                            |

Indexes for these are in
`1791400000001-storefrontCatalogIndexes.ts`. The existing `search`, `brandId`,
`categoryId`, `page` and `limit` are unchanged, so nothing you have now breaks.

`home` and `facets` are still composed on the frontend. They can stay there —
they are presentation, and a facet count that is one page stale is not a
correctness problem the way a filtered list is.

---

## Still not done

- **Caching.** `/storefront/theme` is identical for every shopper of a store and
  is the hottest route in the system. It needs an ETag or Redis entry keyed by API
  key, invalidated on publish, brand patch and profile update. There is a note at
  the controller. Do this before any real traffic.
- **The shopper session.** Unchanged, and still as
  [theme-engine.md](theme-engine.md) describes it: `CustomerApi` is the
  localStorage mock, and the real routes assume card payments, shipping methods
  and line-id cart edits the API does not have. That is a UI change against the
  existing `src/lib/api/shop` actions, not a missing endpoint.
- **Demo stores per preset** (`/store/demo-maison`). The presets carry
  `demoStoreName`, `demoTagline` and `vertical`, but there is no demo tenant
  behind them. The simplest route is a demo tenant per vertical, seeded with
  [the catalog seeder](#demo-catalog-seeding).
- **Theme schema migrations.** `schema_version` is stored on every theme and
  version row but nothing reads it yet. When a section schema changes
  incompatibly, that is the hook for migrating old documents lazily.

---

## Demo catalog seeding

For testing a storefront against the real API. Owner JWT, tenant from the token.

| Method | Path                  | Body                                                       |
| ------ | --------------------- | ---------------------------------------------------------- |
| GET    | `/admin/seed/catalog` | — (counts: available, total, already seeded)               |
| POST   | `/admin/seed/catalog` | `{ brands?, categories?, products?, withImages?, reset? }` |
| DELETE | `/admin/seed/catalog` | — (removes seeded rows)                                    |

Defaults install 24 brands, 27 categories (a real tree, parents and children) and
60 products with NPR prices, badges, compare-at prices and opening stock.

```bash
curl -X POST https://api.example.com/admin/seed/catalog \
  -H "Authorization: Bearer $OWNER_JWT" -H 'Content-Type: application/json' \
  -d '{"products":60,"withImages":true}'
```

Worth knowing:

- **Catalog only.** No customers, orders or payments. Those move money and stock,
  and a demo order in a production tenant's reports is worse than no demo data.
- **Re-running is safe.** Rows are matched by slug and SKU and skipped if present.
- **Everything is marked**: `demo-` slugs, `DEMO-` SKUs, `seed-*` image names,
  `{ seed: true }` on seeded categories. `DELETE` and `reset: true` only ever
  touch rows carrying those markers, so a merchant's own data is never at risk.
- **`withImages: true`** (the default) fetches demo imagery and puts it through
  the normal media pipeline, so seeded images are ordinary media-library assets:
  WebP, in R2, deletable from the UI. It adds about a minute and needs R2
  configured. If an upload fails the catalog is still seeded, and the response
  reports `images.failed`. Pass `withImages: false` for a fast, image-less run.
- **Removing seeded rows leaves the R2 objects.** The database rows go; a few
  hundred KB of demo images stay. Worth fixing if the seeder is run often.
