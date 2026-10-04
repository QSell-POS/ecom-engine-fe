# ecom-engine-fe

Admin dashboard and storefront for the ecom-engine platform, as one Next.js
app. The dashboard manages the catalog (products, categories, brands, media,
inventory), selling (orders, customers, payments, discounts, delivery rates),
engagement (Meta chat inbox, reviews) and storefront themes; the `(storefront)`
route group renders the shop itself.

- **[docs/api-integration.md](docs/api-integration.md)** — how this app talks
  to the API: the three credentials, and the places its shape surprises you.
- **[docs/deploy-ec2.md](docs/deploy-ec2.md)** — deploying to EC2. One command
  per deploy: `bash deploy/deploy.sh`.

## Running it locally

```bash
npm install
cp deploy/.env.example .env   # set API_URL and API_KEY at least
npm run dev
```

Without `API_URL`/`API_KEY` the storefront falls back to its demo catalog, so
the theme builder works with no backend. The dashboard needs both: sign in at
`/login`, or create a store at `/register`.

## Tech stack

- Next.js 16 (App Router, Turbopack), React 19
- TypeScript
- Tailwind CSS v4 + shadcn/ui (Radix primitives)
- TanStack Table v9, TanStack Query
- react-hook-form + zod, next-safe-action for server actions
- lucide-react for icons

## Project structure

```
src/
  app/
    (auth)/          route group: login, register (tenant owner)
    (dashboard)/     route group: the admin app
    (storefront)/    route group: the shop, and theme previews
    layout.tsx, globals.css
  components/
    <feature>/       UI for a feature (forms, data tables) — brand, category, product
    common/           shared, feature-agnostic UI (DataTable, SortableHeader, AdminNavbar, AdminSidebar)
    ui/               shadcn primitives (do not hand-edit generated pieces beyond what's needed)
  lib/
    api/
      client.ts        low-level fetch wrapper (auth header, tags, revalidate)
      shared/           types/helpers shared across feature modules
      <feature>/        self-contained feature module (see contract below)
    constants/          app-shell constants (routes, nav) — not feature-owned
    safe-action.ts       next-safe-action client setup
    utils.ts
  hooks/
```

### Route groups

- `(auth)` — unauthenticated screens: `/login`, `/register`. The owner JWT the
  API returns goes straight into an httpOnly cookie.
- `(dashboard)` — the admin app, guarded by `src/proxy.ts` (Next 16's renamed
  middleware). `/dashboard` is the landing page; `/products`, `/categories`,
  `/brand`, `/inventory`, `/orders`, `/customers`, `/payments`, `/discounts`,
  `/delivery-rates`, `/chat`, `/reviews`, `/api-keys` and `/integrations` are
  the feature screens, plus `/themes` for the theme builder.
- `(storefront)` — the customer-facing shop at `/store/[slug]`, and theme
  previews. Its catalog is the real API; its cart and checkout are still the
  demo implementation (see docs/api-integration.md).

## Feature module contract

Every domain feature under `src/lib/api/<feature>/` follows the same file
layout so a new feature can be added by copying the pattern rather than
inventing a new one:

| File | Responsibility |
| --- | --- |
| `types.ts` | The domain entity type(s), owned by this feature. |
| `constants.ts` | Cache/revalidation tag names, table page-size options, route paths — anything hardcoded that's specific to this feature. |
| `dto.ts` | Create/Update payload shapes sent to the API, built from `./types`. |
| `validation.ts` | zod schemas for forms and server actions, built on `lib/api/shared/validation.ts` helpers where useful. |
| `service.ts` | `apiClient`/`apiList`-based fetch and mutation functions, tagged for cache invalidation, each declaring the credential its route needs. |
| `action.ts` | `next-safe-action`-wrapped server actions that call `service.ts` and revalidate tags from `constants.ts`. |
| `grid.ts` | Data-grid column definitions and status maps for this entity's list view. |
| `index.ts` | Barrel re-exporting the above, so consumers can `import { Brand, getBrands } from "@/lib/api/brand"`. |

Corresponding UI lives in `src/components/<feature>/`: a `*DataTable.tsx`
(composition only — columns come from `lib/api/<feature>/table-columns.tsx`),
`Create*Form.tsx`, `Update*Form.tsx`, `Delete*Form.tsx`.

## Shared / common code

- `src/lib/api/shared/` — `ListResponse<T>`, `PaginationParams`, and zod
  helpers (`makeIdSchema`, `emptyToUndefined`, `optionalText`, `optionalUrl`)
  used by every feature's `service.ts`/`validation.ts` instead of duplicating
  the same shapes.
- `src/lib/constants/` — app-shell-level constants that don't belong to any
  one feature: `routes.ts` (top-level app routes) and `nav.ts` (sidebar/navbar
  item definitions).
- `src/components/common/` — `DataTable` (generic TanStack Table wrapper),
  `SortableHeader` (shared sortable column header used by every
  `table-columns.tsx`), `AdminNavbar`, `AdminSidebar`.

## How to add a new feature module

1. Create `src/lib/api/<feature>/` with `types.ts`, `constants.ts`, `dto.ts`,
   `validation.ts`, `service.ts`, `action.ts`, `index.ts` (`table-columns.tsx`
   once there's a list UI). Use an existing module (`brand` is the simplest)
   as the template, and `lib/api/shared/*` for anything duplicated.
2. Point `service.ts` at the real endpoint and give it its own cache tag(s) in
   `constants.ts`.
3. Add the entity type to `types.ts` — never to a global types file.
4. Build `src/components/<feature>/` UI: `*DataTable.tsx` (using
   `table-columns.tsx` + `SortableHeader`), `Create*Form.tsx`,
   `Update*Form.tsx`, `DeleteForm.tsx` (mirror the `AlertDialog` pattern in
   `DeleteBrandForm.tsx`).
5. Add a route under `src/app/(dashboard)/<feature>/` and a nav entry in
   `src/lib/constants/nav.ts`.
6. Run `npm run build` and `npm run lint`.

## Environment variables

| Variable | Description |
| --- | --- |
| `API_URL` | Base URL of the backend REST API. |
| `API_KEY` | Server-side API key sent as `x-api-key` on every request (see `src/lib/api/client.ts`). |

Both are required — `apiClient` throws at startup if either is missing.

## Coding conventions

- No code comments. Code should read clearly from naming and structure alone.
- shadcn-first: reach for the primitives in `src/components/ui/` before
  writing raw HTML form/table/button elements.
- Colocate types with the feature module that owns them
  (`lib/api/<feature>/types.ts`), not a global `types/` folder.
- Feature modules are self-contained: a feature's `service.ts`/`action.ts`
  should only import from its own module, `lib/api/shared`, and `lib/api/client`.

## Getting started

```bash
npm install
npm run dev      # start the dev server (Turbopack)
npm run build    # production build
npm run start    # run the production build
npm run lint     # eslint
```

Create a `.env` (or `.env.local`) with `API_URL` and `API_KEY` before running
`dev` or `build` — pages that fetch data server-side will fail without them.
