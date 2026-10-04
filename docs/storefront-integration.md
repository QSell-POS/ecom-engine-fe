# Storefront integration

Written for: the frontend team building the storefront, and for any merchant
building their own.

One deployment serves every tenant's storefront on `*.qsellpos.com`. A request to
the API carries two things: **a key that says which deployment is asking**, and
**a host that says which store it is asking about**.

```
GET https://api.qsellpos.com/products?limit=24
x-api-key:     ek_platform_…                     ← which deployment
x-store-host:  bibash-toys.qsellpos.com          ← which store
```

Everything else — the catalog, the theme, the store profile — follows from those
two headers. Nothing per tenant is configured at build time.

---

## 1. Which key you have

|                 | `storefront` key                      | `platform` key                                  |
| --------------- | ------------------------------------- | ----------------------------------------------- |
| You are         | a merchant building your own frontend | the platform's hosted storefront                |
| Looks like      | `ek_live_…`                           | `ek_platform_…`                                 |
| Resolves to     | the tenant that owns the key          | whichever store `X-Store-Host` names            |
| `X-Store-Host`  | **ignored**                           | **required**                                    |
| Methods         | as each route allows                  | GET/HEAD only                                   |
| Where to get it | dashboard → `POST /api-keys`          | `npm run platform:create-key`, server-side only |

**If you are a merchant building your own storefront**, you need nothing from this
page except §4 and §5: create a key in the dashboard, send it as `x-api-key`, and
ignore `X-Store-Host` entirely. Your key already means your store.

**If you are the hosted storefront**, read on.

### The platform key is server-side only

It can read every store on the platform. In a Next.js app that means server
components, route handlers or server actions — never a client-side `fetch`, never
`NEXT_PUBLIC_*`. A platform key in a browser bundle exposes every merchant's
catalog.

If something in the browser needs catalog data, proxy it through your own route
handler. The API will also refuse anything that is not a GET or HEAD on a
platform key, so a leak cannot be used to write — but it can be used to read.

---

## 2. Resolving the host

A browser arrives at `bibash-toys.qsellpos.com`. Before rendering, resolve it:

```http
GET /storefront/resolve?host=bibash-toys.qsellpos.com
```

No credential needed. Three outcomes:

```json
// 1. render this store
{ "data": { "status": "active",
            "store": { "id": "…", "name": "Bibash Toy Shop",
                       "subdomain": "bibash-toys", "host": "bibash-toys.qsellpos.com" } } }

// 2. the merchant renamed: issue a 301 to `host`, do not render
{ "data": { "status": "moved", "from": "old-name.qsellpos.com",
            "subdomain": "bibash-toys", "host": "bibash-toys.qsellpos.com" } }

// 3. 404: unknown host, malformed host, or a suspended store — render your 404 page
```

Handle `moved` with a permanent redirect. The data routes will not serve a store
at its old address — they 404 with "This store has moved to …" — so skipping this
step turns a rename into a broken store rather than a redirect.

In Next.js this belongs in middleware, keyed on the request host, with the result
cached briefly per host.

---

## 3. Rendering the store

### The theme and the store profile

```http
GET /storefront/theme
x-api-key: …
x-store-host: bibash-toys.qsellpos.com
```

Returns the published theme document and the store profile (name, logo, currency,
navigation, announcement, contact, social, checkout rates) in one call. This is
the route that makes a shop render. Its shape, and the one behaviour that differs
from the original contract — it serves a default preset rather than 404ing when a
merchant has published nothing, flagged by `theme.source` — are documented in
[theme-backend-status.md](theme-backend-status.md).

### The catalog

All of these take the same two headers.

| Route                                                          | For                             |
| -------------------------------------------------------------- | ------------------------------- |
| `GET /products`                                                | Catalog listing. Filters below. |
| `GET /products/:id`, `GET /products/slug/:slug`                | Product page.                   |
| `GET /categories`, `/categories/:id`, `/categories/slug/:slug` | Navigation, category pages.     |
| `GET /brands`, `/brands/:id`, `/brands/slug/:slug`             | Brand pages.                    |
| `GET /reviews/product/:productId`                              | Reviews on a product page.      |
| `GET /delivery-rates/quote?region=…&city=…`                    | Shipping cost before checkout.  |

`GET /products` filters and sorts in SQL, across the whole catalog:

| Query                   | Meaning                                                                           |
| ----------------------- | --------------------------------------------------------------------------------- |
| `search`                | Name or slug.                                                                     |
| `categorySlug`          | That category **and its direct children**.                                        |
| `brandSlug`             | One brand.                                                                        |
| `categoryId`, `brandId` | The same, by id.                                                                  |
| `minPrice`, `maxPrice`  | Inclusive price range.                                                            |
| `inStock=true`          | Only sellable stock. Anything other than `true` means no filter.                  |
| `badge`                 | One badge, e.g. `featured`, `best_seller`, `new_arrival`.                         |
| `tag`                   | Tag slug or name.                                                                 |
| `sort`                  | `newest` (default), `oldest`, `price-asc`, `price-desc`, `name-asc`, `name-desc`. |
| `page`, `limit`         | `limit` max 100.                                                                  |

Do not filter or sort a fetched page in the client. Applied to one page of forty,
a price filter shows the shopper the wrong products and a count that does not
match what they can see.

### What a platform key cannot reach

The cart, orders, payments, wishlist, addresses and customer registration all
belong to a **shopper session**, not to a deployment. A platform key is refused
on them, by design — a credential that can name any store must not be able to
read one shopper's data.

Those routes need the customer's own JWT plus a `storefront` key. Wiring them up
to the hosted storefront is an open question, not a missing endpoint; see "Still
not done" in [theme-backend-status.md](theme-backend-status.md).

---

## 4. Response and error shapes

Every response is the same envelope:

```json
{ "success": true, "message": "Products fetched successfully", "data": [ … ],
  "meta": { "total": 60, "page": 1, "limit": 24, "totalPages": 3 } }
```

`meta` is present on paginated routes only. Errors:

| Status | Means                                                                                        | Do                                                                                 |
| ------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 401    | Missing, unknown or expired key                                                              | Fix the deployment. Not retryable.                                                 |
| 403    | The key may not do this — wrong scope, a write on a platform key, or a route it cannot reach | Not retryable; it is a bug in the caller.                                          |
| 404    | Unknown store address, or the resource does not exist                                        | Render 404. Check the `message`: "This store has moved to …" means you skipped §2. |
| 400    | Validation failed                                                                            | `errors` is a map of field → messages.                                             |
| 429    | Rate limited                                                                                 | Respect `Retry-After`.                                                             |

---

## 5. Merchant-managed store address

For the dashboard, with the owner's JWT (`Authorization: Bearer …`):

| Method | Path                                           | Notes                                                                              |
| ------ | ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| GET    | `/admin/store/domain`                          | Current address, full host, the rules, and previous addresses that still redirect. |
| GET    | `/admin/store/domain/availability?subdomain=…` | Check as they type.                                                                |
| PATCH  | `/admin/store/domain`                          | `{ "subdomain": "bibash-toys" }`. 409 if taken.                                    |
| GET    | `/tenant/subdomain/availability?subdomain=…`   | Same check during sign-up, before a tenant exists. No auth.                        |

Availability answers with a reason you can show directly:

```json
{
  "data": {
    "available": false,
    "reason": "reserved",
    "message": "That store address is reserved. Please choose another.",
    "rules": "3–63 characters, lowercase letters, numbers and hyphens, …",
    "rootDomain": "qsellpos.com"
  }
}
```

`reason` is one of `required`, `too-short`, `too-long`, `invalid-characters`,
`hyphen-edge`, `punycode-prefix`, `reserved`, `taken`. Render `message`; the
`reason` is there if you want your own copy.

A rename keeps the old address pointing at the store — it is never freed for
another merchant — so existing links keep working through the `moved` response in
§2.

`POST /tenant/register` and `POST /tenant/login` both now return `subdomain` and
`storefrontHost`, so the dashboard can show the merchant their address
immediately after sign-up without another call.

### API keys, for a merchant building their own frontend

| Method | Path            | Notes                                                      |
| ------ | --------------- | ---------------------------------------------------------- |
| POST   | `/api-keys`     | `{ "name": "my storefront" }`. Returns `fullKey` **once**. |
| GET    | `/api-keys`     | Lists keys by prefix. The secret is not recoverable.       |
| DELETE | `/api-keys/:id` | Revokes.                                                   |

Only the `storefront` scope can be requested. Show the full key once, tell the
merchant to store it server-side, and offer "create a new key" rather than any
form of recovery — only a SHA-256 hash is stored.

---

## 6. Cookies — read this before writing a session

**Never set a cookie with `Domain=.qsellpos.com`.** Every tenant store is a
subdomain of one registrable domain, so a parent-domain cookie is readable by
every other merchant's storefront, including a merchant who writes a few lines of
JavaScript to read it.

Set cookies on the exact host by omitting `Domain` entirely. `localStorage` and
`sessionStorage` are per-origin and isolate per subdomain for free.

---

## Checklist for a new storefront deployment

1. `*.qsellpos.com` points at the deployment (one wildcard record, already set
   up — see [tenant-domains.md](tenant-domains.md)).
2. `API_URL=https://api.qsellpos.com` and the platform key in **server-side**
   environment only.
3. Middleware resolves the request host via `/storefront/resolve`, 301s on
   `moved`, 404s on 404.
4. Every API call sends `x-api-key` and `x-store-host`, from the server.
5. Cookies set on the exact host, no `Domain`.
6. Filtering and sorting pushed to `GET /products`, not done in the client.
