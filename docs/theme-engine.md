# Storefront & theme system

A merchant picks a ready-made theme and has a complete, working online store
immediately: home page, catalog, product pages, cart, checkout and customer
accounts. Nothing needs the builder. Customization comes in two levels:

| Level | Where | For |
| --- | --- | --- |
| **Simple** | Admin → Online store → **Customize** (`/themes/customize`) | Everyone. Store name, logo, favicon, brand color, fonts, announcement bar, main menu, contact details, social links, currency and shipping prices, with a live preview. |
| **Advanced** | **Edit in builder** (`/editor/:themeId`) | Optional. Add, remove and reorder home sections, banners, spacing, color schemes and every theme setting. Drafts publish separately. |

## Merchant journey

1. **Theme store** (`/themes/store`): marketplace of complete themes with live desktop and phone previews, filterable by industry.
2. **Theme page** (`/themes/store/:id`): device-switchable preview, features and included pages, palette and fonts.
3. **View demo store** (`/store/demo-<id>`): the full storefront with demo content. Every page works, including checkout and accounts.
4. **Use this theme**: installs *and publishes* in one step (confirming first if it replaces a live theme), then opens the customizer with a welcome note. The store is live.
5. **Customize**: saving updates the store profile and the live theme's brand color and fonts instantly.
6. **Online store hub** (`/themes`): live theme, a "make it yours" checklist, the theme library (publish, preview on your store, duplicate, delete) and theme suggestions.

A merchant previewing an unpublished theme (`/preview/:themeId`) browses their own store with that draft. Only their admin session sees it, and **Exit preview** clears it.

## Try it

| URL | What |
| --- | --- |
| `/themes`, `/themes/store`, `/themes/customize` | Merchant flows. Switch store top-right: **Bloom Beauty** starts with no theme. |
| `/store/acme`, `/store/nova` | Live stores (Maison, Volt). |
| `/store/demo-maison`, `-volt`, `-petal`, `-hearth` | Theme demo stores. |
| Sign in on any store | Demo shopper: `demo@example.com` / `demo1234` (orders, addresses). Test card `4242 4242 4242 4242`. |

Mock data: tenants and themes in `.data/theme-engine.json` (delete to reset). Shopper sessions live in the browser's localStorage per store.

## Architecture

```
src/lib/storefront/            Commerce domain: backend-agnostic
  types.ts                     DTOs: Product, Category, Brand, Cart, Order, Customer, StoreProfile…
  contracts.ts                 CatalogApi (server reads) + CustomerApi (session), 1:1 with NestJS endpoints
  query.ts                     Catalog URL format (?q&category&brand&minPrice&…&sort&page)
  checkout.ts / format.ts      Price previews, money/date formatting
  profile.ts                   StoreProfile validation (zod), shared by UI and server
  server.ts / client.ts        Pick the implementation: HTTP when env is set, mock otherwise
  http/                        NestJS clients (fetch)
  mock/                        Demo catalogs (4 verticals, real photography), mock APIs

src/lib/theme-engine/          Theme documents: tokens + home sections, schemas, sanitisation, presets
src/lib/api/theme/             Tenants, themes, profile: service (mock JSON DB) + server actions
src/lib/api/media.ts           Image uploads: media endpoint, or inline data URLs in mock mode

src/components/storefront/     The storefront (every theme renders through this)
  StorefrontRoot / overlay     Theme CSS variables, shopper state, chrome, drawers
  shell.tsx                    Announcement bar, header, search, mobile menu, cart drawer, footer
  sections.tsx                 12 home sections (hero, product grid/carousel, categories, promo…)
  ProductCard / primitives     Cards, images (never blank), price, stars, badges, links
  pages/                       Catalog, product, cart, wishlist, checkout, auth, account
  motion.tsx                   framer-motion reveal helpers (theme toggle + reduced motion aware)
src/app/(storefront)/store/[slug]/…   Routes: home, products, categories, brands, cart, wishlist,
                                      checkout (+success), account (login, register, forgot, orders, addresses)
src/components/themes/         Admin: theme store, previews, customizer, actions
```

- **Theme = look, profile = identity.** A theme document holds design tokens (colors, fonts, radius, buttons, header, cards, motion) and home sections. The store profile (name, logo, menu, contact, social, announcement, checkout prices) belongs to the store, so it carries over when switching themes.
- **One renderer everywhere.** The live store, theme store thumbnails, customizer preview and builder canvas all render the same components with container queries, so each device preview is exact.
- **Never blank.** Section images fall back to the store's media (a category tile uses that category's image), and broken images become a soft placeholder.

## Connecting the NestJS / PostgreSQL backend

Set environment variables; no component changes:

```bash
STOREFRONT_API_URL=https://api.example.com                # server: CatalogApi
NEXT_PUBLIC_STOREFRONT_API_URL=https://api.example.com    # browser: CustomerApi (cookies, credentials: include)
NEXT_PUBLIC_MEDIA_UPLOAD_URL=https://api.example.com/admin/media   # logo/banner uploads → { url }
```

Requests carry `x-storefront-key: <store public key>` to resolve the tenant. Demo stores (`demo-*`) always use demo content.

### Storefront API (public)

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/storefront/home` | `HomeData` (products, categories, brands, collections, media) |
| GET | `/storefront/products?q&category&brand&minPrice&maxPrice&rating&inStock&onSale&collection&sort&page&pageSize` | `Paginated<Product>` |
| GET | `/storefront/products/facets?(same)` | `CatalogFacets` (each facet counted without its own filter) |
| GET | `/storefront/products/:slug` · `/related?limit` · `/reviews?page` | `Product` · `Product[]` · `{ summary, reviews }` |
| GET | `/storefront/categories[/:slug]`, `/storefront/brands[/:slug]` | `Category`, `Brand` |
| GET/POST/PATCH/DELETE | `/storefront/cart`, `/storefront/cart/lines[/:id]` | `Cart` (stock-checked; guest cart via cookie) |
| GET/POST/DELETE | `/storefront/wishlist[/:productId]` | `WishlistItem[]` |
| GET/POST | `/storefront/auth/me`, `/login`, `/register`, `/logout`, `/forgot-password` | `Customer` (httpOnly session cookie) |
| PATCH | `/storefront/account` | `Customer` |
| GET/POST/PUT/DELETE | `/storefront/account/addresses[/:id]` | `Address[]` |
| GET | `/storefront/account/orders`, `/storefront/orders/:id` | `Order[]`, `Order` |
| POST | `/storefront/checkout` | `Order`: recalculates totals, charges the **payment token** (never raw card data), empties the cart |
| POST | `/storefront/products/:id/reviews` | `Review` |
| GET | `/storefront/theme` (`x-api-key`) | `{ store, theme }`: published live theme (already served by `/api/storefront/theme`) |

Exact shapes: `src/lib/storefront/types.ts`. Reference behaviour (filtering, facets, stock, totals, order history): the mock implementations in `src/lib/storefront/mock/`.

### Admin API (merchant session)

Replace the bodies in `src/lib/api/theme/service.ts` (same signatures), delete `db.ts`, and resolve the tenant from the real session instead of the `ee_tenant` cookie.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/themes` · `/admin/themes/:id` | summaries · full theme (draft + published) |
| POST | `/admin/themes` `{ presetId, publish }` | install; enforce `themeLimit` (403). "Use this theme" = `publish: true` |
| POST | `/admin/themes/:id/duplicate` | enforce `themeLimit` |
| PUT | `/admin/themes/:id/draft` | builder save; **sanitise server-side** |
| POST | `/admin/themes/:id/publish` | snapshot draft → published, set live |
| PATCH | `/admin/themes/:id/brand` `{ colorPrimary, colorPrimaryText, fontHeading, fontBody }` | simple customizer: applies to draft **and** published |
| DELETE | `/admin/themes/:id` | 409 if live |
| GET/PUT | `/admin/store/profile` | `StoreProfile`, validated like `StoreProfileSchema` |
| POST | `/admin/media` (multipart) | `{ url }` for logos, favicons, banners |

Suggested tables: `tenants`, `store_profiles (tenant_id, jsonb)`, `themes (tenant_id, preset_id, draft jsonb, published jsonb, published_at)`, and `tenants.live_theme_id`. Theme presets can stay in code, shared with the backend as a package.

## Security

- `sanitizeDocument()` (themes) and `StoreProfileSchema` (profile) run on the server before every save. They drop unknown keys, clamp ranges, and only allow `http(s)`, relative, `#`, `mailto:` and `tel:` links, plus raster images (no SVG data URLs). The backend must apply the same rules.
- Merchant content renders as React text, never HTML. Product JSON-LD is escaped.
- Draft previews require the store's admin session. Demo and preview pages are `noindex`.
- Checkout sends only a payment-provider token (plus brand and last four digits for display).

## Adding a section type

1. Add a `SectionSchema` to `SECTION_SCHEMAS` in `schema.ts` (use `withLayout()` for color scheme and spacing).
2. Add its component to `SECTION_COMPONENTS` in `components/storefront/sections.tsx`, using container queries (`@3xl:`, `@5xl:`) and `<EditableBlock>` around blocks.

The builder library, settings panel, validation and sanitisation pick it up automatically.
