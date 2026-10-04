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

> The storefront's catalog is the real API when `API_URL` and `API_KEY` are
> set; its cart, checkout and accounts are still the mock. See
> [Connecting the backend](#connecting-the-backend).

## Architecture

```
src/lib/storefront/            Commerce domain: backend-agnostic
  types.ts                     DTOs: Product, Category, Brand, Cart, Order, Customer, StoreProfile…
  contracts.ts                 CatalogApi (server reads) + CustomerApi (session), 1:1 with NestJS endpoints
  query.ts                     Catalog URL format (?q&category&brand&minPrice&…&sort&page)
  checkout.ts / format.ts      Price previews, money/date formatting
  profile.ts                   StoreProfile validation (zod), shared by UI and server
  server.ts / client.ts        Pick the implementation: the API for the catalog, mock for the session
  http/                        API clients: catalog-api.ts maps the real routes onto CatalogApi
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

## Connecting the backend

The commerce API is already live and connected — see
**[api-integration.md](api-integration.md)** for how this app talks to it: the
three credentials, the response envelope, and the places the API's shape is
surprising. Two environment variables drive it:

```bash
API_URL=https://api.abhishekpun.com.np   # the API
API_KEY=ek_live_...                      # this deployment's storefront key
```

Without them the storefront falls back to its demo catalog, so the theme
builder works with no backend at all.

**Catalog reads are real.** `src/lib/storefront/http/catalog-api.ts` maps the
API's `/products`, `/categories`, `/brands` and `/reviews` onto the
`CatalogApi` contract. Two things the API does not provide are composed there
instead, and that file says so: filtering and sorting beyond
`search`/`brandId`/`categoryId` happen in-process on a fetched page, and
`home` and `facets` are assembled from the product, category and brand lists.

**The shopper session is not wired up.** `CustomerApi` is still the
localStorage mock. The real shopper routes exist, typed, in `src/lib/api/shop`
as server actions, but the contract here assumes card payments, shipping
methods and line-id cart edits that the API does not have — switching the
storefront over is a UI change against those actions, not another adapter.
`src/lib/storefront/client.ts` says the same at the call site.

**Themes have no backend yet.** They still read and write
`.data/theme-engine.json`, a JSON file on the frontend's disk that is not in
the container image, so builder edits do not survive a redeploy. What needs
building is in **[theme-api-request.md](theme-api-request.md)** (the contract)
and **[theme-backend.md](theme-backend.md)** (the data model). Until it lands,
a deployment serves a default preset with the real catalog behind it, so the
public shop works and simply ignores the builder.

## Security

- `sanitizeDocument()` (themes) and `StoreProfileSchema` (profile) run on the server before every save. They drop unknown keys, clamp ranges, and only allow `http(s)`, relative, `#`, `mailto:` and `tel:` links, plus raster images (no SVG data URLs). The backend must apply the same rules.
- Merchant content renders as React text, never HTML. Product JSON-LD is escaped.
- Draft previews require the store's admin session. Demo and preview pages are `noindex`.
- Checkout sends only a payment-provider token (plus brand and last four digits for display).

## Adding a section type

1. Add a `SectionSchema` to `SECTION_SCHEMAS` in `schema.ts` (use `withLayout()` for color scheme and spacing).
2. Add its component to `SECTION_COMPONENTS` in `components/storefront/sections.tsx`, using container queries (`@3xl:`, `@5xl:`) and `<EditableBlock>` around blocks.

The builder library, settings panel, validation and sanitisation pick it up automatically.
