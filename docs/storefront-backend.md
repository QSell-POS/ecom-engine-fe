# Implementing the storefront backend (NestJS + PostgreSQL)

This guide is for the backend team. It describes everything the Next.js frontend needs from the NestJS API so that the storefront, theme store, simple customizer and theme builder work against real data. It covers the API contract, the database, and the business rules.

The frontend is already built against this contract. Today it runs on mock implementations; switching to your API is configuration only. **When in doubt about behaviour, the mocks are the reference implementation**:

| Area | Reference implementation (frontend repo) |
| --- | --- |
| Data shapes (DTOs) | `src/lib/storefront/types.ts` |
| API contracts (every method → endpoint) | `src/lib/storefront/contracts.ts` |
| Catalog: filtering, facets, sorting, pagination | `src/lib/storefront/mock/catalog-api.ts` |
| Cart, auth, addresses, orders, checkout | `src/lib/storefront/mock/customer-api.ts` |
| Checkout pricing | `src/lib/storefront/checkout.ts` |
| Catalog URL/query format | `src/lib/storefront/query.ts` |
| Store profile validation | `src/lib/storefront/profile.ts` |
| Theme documents, schemas, sanitisation | `src/lib/theme-engine/` (`schema.ts`, `document.ts`, `presets.ts`) |
| Admin theme service (to be replaced by API calls) | `src/lib/api/theme/service.ts` |
| HTTP clients the frontend will use | `src/lib/storefront/http/catalog-api.ts`, `http/customer-api.ts` |

---

## 1. How the frontend connects

### Environment variables (frontend)

```bash
API_URL=https://api.example.com                              # existing admin API (products, brands, categories)
API_KEY=...                                                  # existing server-to-server key
STOREFRONT_API_URL=https://api.example.com                   # server-side catalog reads (CatalogApi)
NEXT_PUBLIC_STOREFRONT_API_URL=https://api.example.com       # browser-side shopper calls (CustomerApi)
NEXT_PUBLIC_MEDIA_UPLOAD_URL=https://api.example.com/admin/media   # logo/banner uploads
```

Without them, the frontend uses the mocks. Theme demo stores (`/store/demo-*`) always use demo content and never call your API.

### Two kinds of callers

| Caller | Runs in | Auth | Endpoints |
| --- | --- | --- | --- |
| **CatalogApi** | Next.js server (RSC) | `x-storefront-key` header | Public, cacheable catalog reads |
| **CustomerApi** | Shopper's browser | `x-storefront-key` + httpOnly cookies (`credentials: "include"`) | Cart, wishlist, auth, account, orders, checkout, reviews |
| **Admin service** | Next.js server | Merchant session (replaces today's mock `ee_tenant` cookie) | Themes, store profile, media |

### Tenant resolution

Every storefront request carries `x-storefront-key: <store public key>` (e.g. `pk_live_acme_…`). Resolve the tenant from it in a guard and attach it to the request. **Every query must be scoped by `tenant_id`.** A key must never read another tenant's data.

```ts
// storefront-key.guard.ts
@Injectable()
export class StorefrontKeyGuard implements CanActivate {
  constructor(private readonly stores: StoresService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const key = req.header("x-storefront-key");
    const store = key ? await this.stores.findByPublicKey(key) : null; // cache this lookup
    if (!store) throw new UnauthorizedException("Invalid storefront key");
    req.store = store;
    return true;
  }
}
```

### CORS and cookies

The browser calls the API directly (a different origin from the storefront), so:

- CORS: `origin` = the storefront origin(s), `credentials: true`, allow headers `content-type, x-storefront-key`.
- Session and cart cookies: `HttpOnly; Secure; SameSite=None` (cross-site) or `SameSite=Lax` if the API is served on a subdomain of the storefront domain. **The same-site subdomain setup (e.g. `api.shop.com` + `shop.com`) is strongly recommended.**
- Cookies should be scoped per store, e.g. `sf_session_<storeId>` and `sf_cart_<storeId>`, or keyed server-side by (session, store).

### Error format

Return JSON `{ "message": string }` with a meaningful status. The frontend shows `message` to the shopper, so write it for humans.

| Status | Used for | Frontend behaviour |
| --- | --- | --- |
| 400 / 422 | Validation | Shows `message` |
| 401 | Not signed in / bad credentials | `GET /auth/me` → treated as signed out; account pages redirect to sign-in |
| 404 | Not found | Product/category/brand/order pages show "not found" |
| 409 | Stock conflicts, duplicate email, empty cart | Shows `message` (e.g. "Only 3 left in stock.") |
| 204 | Success without body | Supported |

---

## 2. Suggested NestJS module layout

```
src/
  tenancy/        stores, public keys, StorefrontKeyGuard, store profile
  catalog/        products, variants, categories, brands, collections, media, facets
  reviews/        reviews + moderation
  customers/      customers, addresses, auth (sessions, password reset)
  cart/           carts, cart lines, wishlist
  checkout/       shipping quotes, tax, payment provider, order creation
  orders/         orders, order lines, status timeline
  themes/         admin: themes, install/publish, brand style, theme sanitisation
  media/          uploads to object storage (S3/R2/Cloudinary)
  storefront/     public controllers under /storefront/* (composes the modules above)
  admin/          merchant controllers under /admin/*
```

Recommended libraries: TypeORM or Prisma or Drizzle, `argon2` for passwords, `zod` (lets you share the frontend's schemas verbatim), `@nestjs/throttler` for rate limiting, and Stripe (or similar) for payments.

---

## 3. Database schema (PostgreSQL)

The storefront reads from the existing catalog tables (products, brands, categories) plus the tables below. Adapt names to your existing schema. Money is stored as `numeric(12,2)` and returned as JSON numbers.

```sql
-- Tenancy -------------------------------------------------------------------
create table stores (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,             -- /store/:slug
  name            text not null,
  public_key      text not null unique,             -- x-storefront-key
  plan            text not null default 'starter',
  theme_limit     int  not null default 3,
  live_theme_id   uuid,                             -- fk added below
  created_at      timestamptz not null default now()
);

create table store_profiles (
  store_id   uuid primary key references stores(id) on delete cascade,
  profile    jsonb not null,                        -- StoreProfile (validated, see §8)
  updated_at timestamptz not null default now()
);

-- Themes --------------------------------------------------------------------
create table themes (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references stores(id) on delete cascade,
  name         text not null,
  preset_id    text,                                -- 'maison' | 'volt' | 'petal' | 'hearth' | …
  draft        jsonb not null,                      -- ThemeDocument (builder working copy)
  published    jsonb,                               -- ThemeDocument customers see (null = never published)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  published_at timestamptz
);
create index on themes (store_id);
alter table stores add constraint stores_live_theme_fk foreign key (live_theme_id) references themes(id) on delete set null;

-- Catalog additions -----------------------------------------------------------
-- (products / brands / categories already exist; add what's missing)
create table product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url        text not null,
  alt        text not null default '',
  position   int  not null default 0
);

create table product_options (                      -- e.g. Color, Size
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name       text not null,
  position   int  not null default 0
);
create table product_option_values (
  id        uuid primary key default gen_random_uuid(),
  option_id uuid not null references product_options(id) on delete cascade,
  value     text not null,
  swatch    text,                                   -- hex for color swatches
  position  int  not null default 0
);

create table product_variants (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references products(id) on delete cascade,
  sku              text not null,
  options          jsonb not null default '{}',     -- {"Color":"Black","Size":"M"}
  price            numeric(12,2) not null,
  compare_at_price numeric(12,2),
  inventory        int not null default 0,          -- available to sell
  position         int not null default 0
);
create index on product_variants (product_id);

create table collections (                          -- new-arrivals, best-sellers, sale are virtual (see §5)
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  slug        text not null,
  title       text not null,
  description text not null default '',
  image_url   text,
  unique (store_id, slug)
);
create table collection_products (
  collection_id uuid references collections(id) on delete cascade,
  product_id    uuid references products(id) on delete cascade,
  position      int not null default 0,
  primary key (collection_id, product_id)
);

-- Denormalised stats for fast sorting/filtering (maintain via triggers or jobs)
alter table products add column rating_average numeric(2,1) not null default 0;
alter table products add column rating_count   int not null default 0;
alter table products add column units_sold     int not null default 0;   -- "Best selling" sort
alter table products add column search         tsvector;                  -- name + brand + category + tags
create index on products using gin (search);

-- Reviews -------------------------------------------------------------------
create table reviews (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  customer_id uuid,
  author      text not null,
  rating      int  not null check (rating between 1 and 5),
  title       text not null,
  body        text not null,
  verified    boolean not null default false,       -- bought the product
  status      text not null default 'published',    -- or 'pending' with moderation
  created_at  timestamptz not null default now()
);
create index on reviews (product_id, status, created_at desc);

-- Customers -----------------------------------------------------------------
create table customers (
  id               uuid primary key default gen_random_uuid(),
  store_id         uuid not null references stores(id) on delete cascade,
  email            citext not null,
  password_hash    text not null,
  first_name       text not null,
  last_name        text not null,
  phone            text not null default '',
  marketing_opt_in boolean not null default false,
  created_at       timestamptz not null default now(),
  unique (store_id, email)                          -- accounts are per store
);

create table customer_sessions (
  id          text primary key,                     -- random 256-bit token (store a hash)
  customer_id uuid not null references customers(id) on delete cascade,
  expires_at  timestamptz not null
);

create table password_resets (
  token_hash  text primary key,
  customer_id uuid not null references customers(id) on delete cascade,
  expires_at  timestamptz not null,
  used_at     timestamptz
);

create table addresses (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  first_name text not null, last_name text not null, company text not null default '',
  line1 text not null, line2 text not null default '', city text not null,
  region text not null default '', postal_code text not null, country text not null,
  phone text not null default '',
  is_default  boolean not null default false
);

-- Cart & wishlist -------------------------------------------------------------
create table carts (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  updated_at  timestamptz not null default now()
);
create table cart_lines (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references carts(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete cascade,
  quantity   int  not null check (quantity > 0),
  unique (cart_id, variant_id)
);

create table wishlist_items (
  store_id    uuid not null,
  owner       text not null,                        -- 'customer:<id>' or 'guest:<cookie id>'
  product_id  uuid not null references products(id) on delete cascade,
  added_at    timestamptz not null default now(),
  primary key (owner, product_id)
);

-- Orders --------------------------------------------------------------------
create table orders (
  id               uuid primary key default gen_random_uuid(),
  store_id         uuid not null references stores(id),
  number           text not null,                   -- '#1104', sequential per store
  customer_id      uuid references customers(id),
  email            citext not null,
  status           text not null,                   -- confirmed | processing | shipped | delivered | cancelled
  subtotal numeric(12,2) not null, shipping numeric(12,2) not null,
  tax      numeric(12,2) not null, total    numeric(12,2) not null,
  currency         text not null,
  shipping_method  jsonb not null,                  -- {id,label,description,price}
  shipping_address jsonb not null,                  -- AddressInput snapshot
  payment          jsonb not null,                  -- {brand,last4,provider,reference}
  guest_token_hash text,                            -- lets a guest view their own order
  created_at       timestamptz not null default now(),
  unique (store_id, number)
);
create table order_lines (                          -- snapshot: prices never change after purchase
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid, variant_id uuid, slug text not null, name text not null,
  variant_title text not null, image jsonb not null,
  price numeric(12,2) not null, compare_at_price numeric(12,2), quantity int not null
);
create table order_events (                         -- status timeline
  order_id uuid not null references orders(id) on delete cascade,
  status   text not null,
  label    text not null,
  at       timestamptz not null default now()
);
```

---

## 4. Store and theme resolution (what `/store/:slug` renders)

The frontend currently resolves this itself from the mock DB (`resolveStorefront` in `src/lib/api/theme/service.ts`). Provide one public endpoint for it:

`GET /storefront/stores/:slug` → no key needed (the slug is public)

```jsonc
{
  "slug": "acme",
  "storeKey": "pk_live_acme_7f3a9c21",   // used for all further storefront calls
  "profile": { /* StoreProfile, §8 */ },
  "document": { /* published ThemeDocument of the live theme */ },
  "theme": { "id": "…", "name": "Maison", "presetId": "maison" }
}
```

- Return **404** if the store doesn't exist or has no published live theme. The frontend shows "store not found", which is how a new store behaves before it installs a theme.
- **Draft preview:** when a signed-in merchant previews their own theme, the frontend calls the admin endpoint `GET /admin/themes/:id` with the merchant session and renders `draft`. Never serve drafts on the public endpoint.
- The existing headless endpoint `GET /storefront/theme` (header `x-api-key`) returns `{ store, theme }` for custom or mobile storefronts.
- Later: add a `domains` table to map custom domains to a store.

---

## 5. Catalog API (server-side, public, cacheable)

All routes require `x-storefront-key`. Only return published or active products of that store.

### 5.1 `GET /storefront/home` → `HomeData`

One call with everything home page sections may render.

```jsonc
{
  "products":    [/* Product[]: enough for grids, e.g. the 48 most relevant (new, best-selling, on sale) */],
  "categories":  [/* Category[] */],
  "brands":      [/* Brand[] */],
  "collections": [/* Collection[] */],
  "media": {                     // fallback imagery for sections without a merchant image
    "hero":      [{ "url": "…", "alt": "" }],
    "banners":   [/* … */],
    "lifestyle": [/* … */]
  }
}
```

`media` should be the merchant's own brand images when they have them (e.g. uploaded banners or category images), and platform default imagery otherwise. Sections never render empty image slots.

Product-grid sections filter `products` client-side by collection (`new-arrivals`, `best-sellers`, `sale`, `all`), so include enough of each.

### 5.2 `GET /storefront/products` → `Paginated<Product>`

Query parameters (exact format in `src/lib/storefront/query.ts`):

| Param | Example | Meaning |
| --- | --- | --- |
| `q` | `linen shirt` | Search. Every term must match name, brand, category or tags (use `tsvector`/trigram). |
| `category` | `dresses` | Category slug (include descendants if categories are nested). |
| `brand` | `linea\|saltwater` | Brand slugs, pipe-separated, OR-ed. |
| `minPrice`, `maxPrice` | `50`, `200` | Inclusive, on the product's **lowest variant price**. |
| `rating` | `4` | `rating_average >= 4`. |
| `inStock` | `1` | Only products with a variant in stock. |
| `onSale` | `1` | Only products where `compareAtPrice > price`. |
| `collection` | `new-arrivals` | See virtual collections below. |
| `sort` | `price-asc` | `featured` (default) · `best-selling` · `newest` · `price-asc` · `price-desc` · `rating` |
| `page`, `pageSize` | `2`, `12` | 1-based; `pageSize` ≤ 48 |

Virtual collections (no rows needed):

- `sale` = `compare_at_price > price`
- `new-arrivals` = created in the last N days (e.g. 30), or a merchant-curated collection with that slug
- `best-sellers` = top by `units_sold`, or a curated collection
- Any other slug = rows in `collections` / `collection_products`

Sorting rules: `featured` puts in-stock items first, then merchandising order. `rating` sorts by average, then count. Always add a stable tie-breaker (`id`) so pagination is deterministic.

Response:

```json
{ "items": [/* Product */], "total": 23, "page": 1, "pageSize": 12, "pageCount": 2 }
```

If `page` is past the end, clamp to the last page (the mock does this).

### 5.3 `GET /storefront/products/facets` → `CatalogFacets`

Same query parameters. **Each facet is counted with all filters applied except its own**, so shoppers can switch between options:

- `categories`: counts with every filter except `category`
- `brands`: counts with every filter except `brand`
- `price.min/max`: over products matching every filter except the price range

Omit options with a count of 0.

```json
{
  "categories": [{ "id": "…", "slug": "dresses", "name": "Dresses", "count": 2 }],
  "brands":     [{ "id": "…", "slug": "linea", "name": "Linea", "count": 3 }],
  "price":      { "min": 32, "max": 289 }
}
```

### 5.4 Product detail and related data

| Route | Returns | Notes |
| --- | --- | --- |
| `GET /storefront/products/:slug` | `Product` or 404 | |
| `GET /storefront/products/:slug/related?limit=4` | `Product[]` | Same category first, then same brand; exclude the product itself |
| `GET /storefront/products/:slug/reviews?page=1` | `{ summary, reviews: Paginated<Review> }` | 5 per page, newest first, `status = 'published'` only |
| `GET /storefront/categories` · `/:slug` | `Category[]` · `Category` or 404 | include `productCount` |
| `GET /storefront/brands` · `/:slug` | `Brand[]` · `Brand` or 404 | include `productCount` |

Review summary: `{ average, count, distribution: { "1": n, "2": n, "3": n, "4": n, "5": n } }`.

### 5.5 The `Product` DTO

Build it from products, variants, options, images, brand and category. Field by field (full types in `types.ts`):

```jsonc
{
  "id": "…", "slug": "cropped-leather-jacket", "name": "Cropped Leather Jacket",
  "description": "…",
  "highlights": ["Fully lined", "Relaxed, boxy fit"],          // bullet list (may be [])
  "brand":    { "id": "…", "slug": "atelier-nord", "name": "Atelier Nord" },
  "category": { "id": "…", "slug": "outerwear", "name": "Outerwear" },
  "collections": ["best-sellers", "sale"],                      // slugs this product belongs to, incl. virtual ones
  "tags": ["outerwear"],
  "images": [{ "url": "https://cdn…/1.jpg", "alt": "…" }],      // ordered; [0] = card image, [1]/[2] = hover image
  "price": 289,                    // lowest variant price
  "compareAtPrice": 349,           // or null
  "options": [
    { "name": "Color", "values": [{ "value": "Black", "swatch": "#1c1917" }] },
    { "name": "Size",  "values": [{ "value": "S" }, { "value": "M" }] }
  ],
  "variants": [
    { "id": "…", "title": "Black / S", "options": { "Color": "Black", "Size": "S" },
      "sku": "FA-001-2", "price": 289, "compareAtPrice": 349, "inventory": 12 }
  ],
  "rating": { "average": 4.4, "count": 12 },
  "badges": ["sale", "bestseller"],   // computed, see below
  "available": true,                   // any variant with inventory > 0
  "createdAt": "2026-09-01T10:00:00.000Z"
}
```

- A product without options must still have **one variant** (title `"Default"`, `options: {}`). The cart always works with variant ids.
- `badges` (at most 2 are shown): `sold-out` if not available, else `sale` if on sale; `new` if in new arrivals; `bestseller` if a best seller.
- `inventory` may be capped for display (e.g. `min(stock, 50)`). The frontend shows "Only N left" when it's 5 or less.
- Image URLs should be CDN URLs. If your CDN supports width parameters, the frontend can build responsive `srcset`s (today this is implemented for Unsplash URLs in `StoreImage`; add your CDN pattern there).

### 5.6 Caching

The frontend caches catalog responses for 60 s with the cache tag `storefront:<storeKey>`. To make merchant edits appear instantly, add an authenticated revalidation webhook on the frontend (a route handler calling `revalidateTag`) and call it from the backend after catalog, profile or theme changes. You can also send `Cache-Control` headers for a CDN in front of the API.

---

## 6. Shopper API (browser, cookies)

All routes require `x-storefront-key` and are called with `credentials: "include"`.

### 6.1 Cart

| Method & path | Body | Returns |
| --- | --- | --- |
| `GET /storefront/cart` | | `Cart` (empty cart if none; don't create rows until the first add) |
| `POST /storefront/cart/lines` | `{ productId, variantId, quantity }` | `Cart` |
| `PATCH /storefront/cart/lines/:lineId` | `{ quantity }` (0 removes the line) | `Cart` |
| `DELETE /storefront/cart/lines/:lineId` | | `Cart` |

```json
{
  "id": "…",
  "lines": [{
    "id": "line-id", "productId": "…", "variantId": "…", "slug": "cropped-leather-jacket",
    "name": "Cropped Leather Jacket", "variantTitle": "Black / S",
    "image": { "url": "…", "alt": "…" },
    "price": 289, "compareAtPrice": 349, "quantity": 1, "maxQuantity": 12
  }],
  "itemCount": 1,
  "subtotal": 289
}
```

Rules:

- Adding an existing variant **increments** its line.
- Reject with **409** and a clear message when exceeding stock (`"Only 3 left in stock."`, `"Sorry, this option just sold out."`).
- Always recompute prices from current variant data; never trust client prices.
- `variantTitle` is `""` for single-variant products.
- **Guest cart:** set an httpOnly cart cookie on the first add. **On login or registration, merge** the guest cart into the customer's cart (sum quantities, cap at stock) and attach the cart to the customer.
- Drop lines whose variant was deleted or unpublished.

### 6.2 Wishlist

| Method & path | Body | Returns |
| --- | --- | --- |
| `GET /storefront/wishlist` | | `WishlistItem[]` (newest first) |
| `POST /storefront/wishlist` | `{ productId }` | `WishlistItem[]` (idempotent) |
| `DELETE /storefront/wishlist/:productId` | | `WishlistItem[]` |

`WishlistItem`: `{ productId, slug, name, brand, image, price, compareAtPrice, addedAt }`. Support guests with the cart cookie id and merge into the customer's wishlist on login.

### 6.3 Authentication

| Method & path | Body | Returns |
| --- | --- | --- |
| `GET /storefront/auth/me` | | `Customer` or **401** (treated as signed out) |
| `POST /storefront/auth/login` | `{ email, password }` | `Customer` + sets session cookie |
| `POST /storefront/auth/register` | `{ firstName, lastName, email, password, marketingOptIn }` | `Customer` + session cookie; **409** if the email exists in this store |
| `POST /storefront/auth/logout` | | 204, clears the cookie |
| `POST /storefront/auth/forgot-password` | `{ email }` | **Always 204**: never reveal whether the email exists; email a single-use token (expires in 1 h) |
| `PATCH /storefront/account` | `{ firstName?, lastName?, phone?, marketingOptIn? }` | `Customer` (email isn't editable here) |

`Customer`: `{ id, email, firstName, lastName, phone, marketingOptIn, createdAt }`.

Security:

- Hash passwords with argon2id. Enforce a minimum of 8 characters (the frontend checks this too).
- Session: a random token in an httpOnly cookie, with only its hash stored in the database. Rotate it on login.
- Rate-limit login, register and forgot-password per IP and per email.
- Customers are **per store**: the same email in two stores is two accounts.
- A reset-password page (`/account/reset?token=`) isn't built on the frontend yet. The endpoint would be `POST /storefront/auth/reset-password { token, password }`.

### 6.4 Addresses

| Method & path | Body | Returns |
| --- | --- | --- |
| `GET /storefront/account/addresses` | | `Address[]` |
| `POST /storefront/account/addresses` | `AddressInput & { isDefault? }` | `Address[]` |
| `PUT /storefront/account/addresses/:id` | `AddressInput & { isDefault? }` | `Address[]` |
| `DELETE /storefront/account/addresses/:id` | | `Address[]` |

Rules: exactly one default when any addresses exist. The first address becomes the default automatically. Deleting the default promotes another. All routes need a session (401 otherwise).

`AddressInput`: `{ firstName, lastName, company, line1, line2, city, region, postalCode, country, phone }`.

### 6.5 Orders

| Method & path | Returns |
| --- | --- |
| `GET /storefront/account/orders` | `Order[]` of the signed-in customer, newest first |
| `GET /storefront/orders/:id` | `Order`: if it belongs to the signed-in customer **or** the guest proves ownership (guest order cookie set at checkout); otherwise **404** (not 403, so ids don't leak) |

```jsonc
{
  "id": "…", "number": "#1104", "createdAt": "…", "email": "guest@example.com",
  "status": "confirmed",
  "lines": [/* OrderLine = CartLine without maxQuantity: snapshot at purchase */],
  "subtotal": 1266, "shipping": 15, "tax": 101.28, "total": 1382.28,
  "shippingMethod": { "id": "express", "label": "Express", "description": "1–2 business days", "price": 15 },
  "shippingAddress": { /* AddressInput */ },
  "payment": { "brand": "Visa", "last4": "4242" },
  "timeline": [{ "status": "confirmed", "label": "Order confirmed", "at": "…" }]
}
```

Status flow shown in the tracking UI: `confirmed → processing → shipped → delivered` (or `cancelled`). Append an `order_events` row on every change. Labels: *Order confirmed*, *Preparing your order*, *Shipped*, *Delivered*, *Cancelled*.

### 6.6 Checkout: `POST /storefront/checkout` → `Order`

```jsonc
{
  "email": "guest@example.com",               // ignored if signed in (use the customer's email)
  "shippingAddress": { /* AddressInput */ },
  "shippingMethodId": "standard",              // "standard" | "express"
  "payment": { "token": "pm_…", "brand": "Visa", "last4": "4242" },
  "saveAddress": true                          // signed-in only: add to address book if new
}
```

The backend is the authority on totals. In one database transaction:

1. Load the cart. Reject **409** `"Your bag is empty."` if there are no lines.
2. Lock the variants (`SELECT … FOR UPDATE`) and check stock. On failure, return **409** `"<name> has only N left. Update your bag to continue."`.
3. Price everything from the database:
   - `subtotal` = Σ variant price × quantity
   - shipping from the store profile's `checkout` config:
     - `standard` = 0 if `subtotal ≥ freeShippingThreshold`, else `standardRate`
     - `express` = `expressRate`
   - `tax` = `round(subtotal × taxRate, 2)` (replace with a tax service when needed)
   - `total` = subtotal + shipping + tax
4. Charge the payment token with the provider, e.g. Stripe PaymentIntent with `confirm: true`. Use an **idempotency key** (cart id + cart version) so retries never double-charge. On decline, return **402** with the provider's human-readable message.
5. Create the order: sequential `number` per store, line snapshots, status `confirmed` plus a timeline event. Decrement inventory and increment `units_sold`.
6. Empty the cart. For guests, set a guest-order cookie so the confirmation page can load the order.
7. After commit, send the confirmation email (via a queue).

The frontend currently shows card fields and sends a mock token. When you choose a provider, the frontend will swap those fields for the provider's hosted fields (e.g. Stripe Payment Element). The request body stays the same.

If shipping or tax becomes dynamic (carrier rates, regional tax), add `POST /storefront/checkout/quote { shippingAddress, shippingMethodId } → { methods, subtotal, shipping, tax, total }`. The frontend's `shippingMethods`/`orderTotals` helpers then become calls to it.

### 6.7 Reviews: `POST /storefront/products/:productId/reviews`

Body: `{ productId, rating (1–5), title (≤120), body (≤2000), author }` → `Review`.

- Set `verified = true` if the signed-in customer has a delivered order containing the product.
- Either publish immediately or set `status = 'pending'` for moderation. With moderation, return the review anyway; the frontend thanks the shopper.
- Recompute `rating_average` and `rating_count` on the product (trigger or job).
- Rate-limit per customer or IP. Limit to one review per customer per product.

---

## 7. Admin API: themes (merchant session)

Replace the bodies in `src/lib/api/theme/service.ts` with `apiClient` calls. The function signatures stay the same, so no page or component changes. Resolve the store from the merchant's session.

| Service function (frontend) | Endpoint | Rules |
| --- | --- | --- |
| `listThemes` | `GET /admin/themes` | Summaries + `isLive`, `hasUnpublishedChanges` (`draft ≠ published`) |
| `getTheme` | `GET /admin/themes/:id` | Full theme incl. `draft` and `published`; 404 for other stores' themes |
| `createThemeFromPreset` / `installTheme` | `POST /admin/themes` `{ presetId, publish }` | **403** when the store has `theme_limit` themes. `publish: true` = "Use this theme": create, snapshot, set live in one transaction. |
| `duplicateTheme` | `POST /admin/themes/:id/duplicate` | Same limit; copy is unpublished |
| `saveThemeDraft` | `PUT /admin/themes/:id/draft` `{ document, name? }` | **Sanitise** the document (below); only `draft` changes |
| `publishTheme` | `POST /admin/themes/:id/publish` `{ document?, name? }` | Optionally save, then `published = draft`, `published_at = now()`, `stores.live_theme_id = id` |
| `updateBrandStyle` | `PATCH /admin/themes/:id/brand` | Only `colorPrimary`, `colorPrimaryText`, `fontHeading`, `fontBody`; apply to **both** `draft` and `published` so the simple customizer is live immediately |
| `deleteTheme` | `DELETE /admin/themes/:id` | **409** if it's the live theme |
| `getStoreProfile` / `updateStoreProfile` | `GET` / `PUT /admin/store/profile` | Validate (§8); also update `stores.name` from `profile.name` |
| `uploadImage` (media.ts) | `POST /admin/media` (multipart `file`) | Validate type (png/jpeg/webp/gif, **no SVG**) and size, store in object storage, return `{ url }` |

### Theme presets

The ready-made themes (Maison, Volt, Petal, Hearth) are code: `THEME_PRESETS` in `src/lib/theme-engine/presets.ts`. `preset.build()` returns the initial `ThemeDocument`. Choose one approach:

- **Shared package (recommended):** move `src/lib/theme-engine/` into a workspace package imported by both apps. The backend builds preset documents and runs the same sanitiser.
- Or **frontend-built:** the frontend sends the built document when installing, and the backend only sanitises it.

### Sanitising theme documents (security boundary)

Theme documents come from merchants and are rendered on public pages. The backend **must** apply the same rules as `sanitizeDocument()` in `src/lib/theme-engine/document.ts` before every save or publish:

- **Section and block schemas:**
  - Drop unknown section types, block types and setting keys.
  - Enforce `maxBlocks` and singleton sections.
  - Allow at most 40 sections.
- **Setting values:**
  - Coerce every value to its field type.
  - Clamp ranges to min/max/step.
  - Enforce `select` options.
  - Colors must be `#rgb`/`#rrggbb`.
  - Text is capped at 300 characters and textarea at 3000.
- **Links and images:**
  - Links: only `http(s)://`, relative `/…`, `#`, `mailto:`, `tel:`.
  - Images: only `http(s)://`, relative, or raster `data:image/(png|jpeg|webp|gif|avif);base64,` up to 1.5 MB. **Once media uploads exist, reject data URLs entirely** and accept only your CDN URLs.

Sharing the `theme-engine` package gives you this for free.

---

## 8. Store profile

Stored in `store_profiles.profile` (jsonb) and validated exactly like `StoreProfileSchema` (`src/lib/storefront/profile.ts`):

```jsonc
{
  "name": "Acme Apparel",                       // 1–60 chars
  "tagline": "Everyday clothing, thoughtfully made.",
  "logo": "https://cdn…/logo.webp",             // "" = show the name as a wordmark
  "favicon": "https://cdn…/favicon.png",
  "currency": "USD",                            // USD EUR GBP CAD AUD INR NPR
  "contact": { "email": "hello@acme.com", "phone": "+1 …", "address": "…" },
  "social": { "instagram": "https://…", "facebook": "", "x": "", "tiktok": "", "youtube": "", "pinterest": "" },  // https:// or ""
  "announcement": { "enabled": true, "text": "Free shipping over $75", "link": "/products" },
  "navigation": [{ "label": "New in", "href": "/products?collection=new-arrivals" }],   // max 8; hrefs relative to the store
  "checkout": { "freeShippingThreshold": 75, "standardRate": 6, "expressRate": 15, "taxRate": 0.08 }
}
```

- Create a sensible default profile when a store is created: its name, the owner's email, empty social links, and the default navigation built from its categories.
- The profile belongs to the **store**, not the theme, so logo, menu and contact details survive theme switches.
- Use the `checkout` block for shipping and tax in §6.6.

---

## 9. Rollout checklist

1. Tenancy: `stores`, `store_profiles`, `StorefrontKeyGuard`, CORS and cookie setup.
2. `GET /storefront/stores/:slug` and the admin theme endpoints, then swap `service.ts` to `apiClient`. Theme store, customize and builder now persist in PostgreSQL.
3. Catalog read endpoints (§5), then set `STOREFRONT_API_URL`. Home, catalog, product, category and brand pages now show real products.
4. Cart, wishlist, auth and account (§6.1–6.5), then set `NEXT_PUBLIC_STOREFRONT_API_URL`.
5. Checkout with a real payment provider (§6.6) and order emails.
6. Reviews (§6.7), media uploads, revalidation webhook (§5.6).
7. Contract tests: run the same scenarios against the mock and the API and compare responses. Scenarios: filters and facets, stock conflicts, checkout totals, order access control, cross-tenant isolation.

### Test scenarios that must pass

- A key from store A can never read store B's products, carts, customers or orders.
- Facet counts ignore their own filter; price range reflects the other filters.
- Adding more than the stock returns 409 with a readable message; checkout re-checks stock under lock.
- Totals from `POST /checkout` match the frontend preview for the same cart and profile.
- A guest can see only the order they just placed; a customer only their own; other ids return 404.
- Login merges the guest cart and wishlist; logout clears the session only.
- `forgot-password` returns 204 for unknown emails.
- Saving a theme with `javascript:` links, SVG data images, unknown sections or out-of-range values stores a sanitised document.
- Installing a theme at the plan limit returns 403; deleting the live theme returns 409.
