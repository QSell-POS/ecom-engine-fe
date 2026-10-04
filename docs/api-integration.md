# Talking to the ecom-engine API

How this frontend uses the backend, and the handful of places where the API's
shape is surprising enough to be worth writing down.

## Three credentials

Every route wants exactly one of them. `lib/api/client.ts` picks, and
`lib/api/session.ts` holds the tokens in httpOnly cookies — no token ever
reaches the browser.

| `auth` | Headers | Used by |
| --- | --- | --- |
| `"public"` | none | `/health`, `/tenant/login`, `/tenant/register` |
| `"key"` | `x-api-key` | public catalog, customer signup and login |
| `"owner"` | owner bearer **only** | everything under `/admin`, plus `/api-keys` and `/tenant/me` |
| `"customer"` | `x-api-key` + customer bearer | cart, orders, addresses, wishlist, writing reviews |

`auth` is inferred from the path when it is not passed: anything under
`/admin`, `/api-keys` or `/tenant/me` gets `"owner"`, everything else
`"key"`. Pass it explicitly when that would be wrong.

Owner routes take the bearer alone. Sending `x-api-key` alongside it gets the
request rejected when the key is absent, stale or from another tenant — and it
would make the dashboard unusable before a key exists, which is a deadlock,
since keys are minted from inside the dashboard.

The owner and customer tokens are **not** interchangeable — they carry a `typ`
claim and the API rejects the wrong one — so they live in separate cookies
(`ee_owner_token`, `ee_customer_token`).

Owner and customer calls read a cookie, which makes the caller dynamic. That
is correct for the dashboard, and it is the reason catalog reads must stay on
`"key"`: they are the only ones that can be cached.

## Four things that bite

**1. Everything is wrapped.** Successful responses are
`{ success, message, data, meta? }`. `apiClient` returns `data`; `apiList`
returns `{ data, meta }`. Two routes are *not* wrapped — `/tenant/register`
returns the tenant with `accessToken` on it, `/tenant/login` nests it as
`{ tenant, accessToken }` — so unwrapping is conditional on the envelope
being present, and `lib/api/auth/service.ts` normalises both.

**2. Unknown fields are rejected, not ignored.** Validation runs with
`forbidNonWhitelisted`, so one extra property fails the whole request with a
400. Re-posting a resource you just fetched will fail on `id` and
`createdAt`. Every payload type here lists exactly what its route accepts —
`UpdateOrderStatusPayload` is `{ status }` and nothing else, and a status flip
in the brands grid sends the flag rather than the whole record.

**3. Money is two types.** Product prices (`sellingPrice`, `compareAtPrice`,
`costPrice`) are decimal **strings** — `"1299.00"` — so cents never pass
through a float. Order money (`subtotalAmount`, `totalAmount`,
`deliveryCharge`) is a **number**. `toAmount()` in `lib/api/shared/types.ts`
parses either.

**4. Images are ids on write, objects on read.** A brand returns
`logo: { url, alt }` but is saved with `logoId`; categories use `image` /
`imageId`; products use `media[]` / `mediaIds` (ordered, first is primary).
Upload to `/admin/media` first — field name `files`, plural — then send the
id. `components/common/MediaField.tsx` does both in one step. Never set a
`Content-Type` on that upload: fetch must add its own multipart boundary.

## Shapes worth knowing

- **Orders keep snapshots.** Line items carry `productNameSnapshot`,
  `productSkuSnapshot`, `attributesSnapshot` and `priceSnapshot`, so a later
  catalog edit cannot rewrite history. Render from those, not from `product`.
- **Inventory**: `available = quantity − reserved`. Show `available`.
  Movements are `receive`, `adjust` (signed, with a reason type), `reserve`,
  `release`, `fulfill`; checkout reserves and releases on its own.
- **Cart**: lines are keyed by **product** id, and `POST /cart/items` takes a
  signed **delta** (`qty: -1` removes one). Reaching zero drops the line.
- **Checkout** takes `items` explicitly rather than reading the cart, so the
  two have to be reconciled by the caller. Send an `Idempotency-Key`:
  `placeShopOrder` generates one if you do not.
- **Discounts** have no DELETE. Retire a code with `isActive: false` so its
  redemption history survives.
- **Chat messages** are the one cursor-paginated route: `meta` is
  `{ nextCursor, hasMore }`, not `{ total, page }`.
- **Delivery rates**: a rate with `city: null` is the regional fallback; an
  exact city match wins. The quote route needs both `region` and `city`.

## Enums

Defined once each, next to the type that uses them:
`ORDER_STATUSES`, `PAYMENT_METHODS`, `CHECKOUT_PAYMENT_METHODS`,
`ORDER_CHANNELS` (`lib/api/order/types.ts`); `PAYMENT_STATUSES`
(`payment/types.ts`); `CUSTOMER_STATUSES` (`customer/types.ts`, note it is
`banned`, not "blocked"); `DISCOUNT_TYPES`, `DISCOUNT_SCOPES`
(`discount/types.ts`); `INVENTORY_TRANSACTION_TYPES`, `ADJUSTMENT_TYPES`
(`inventory/types.ts`); `PRODUCT_BADGES` (`product/types.ts`);
`MEDIA_FOLDERS` (`media-library/types.ts`).

## The storefront

`CatalogApi` is served for real by `lib/storefront/http/catalog-api.ts`. Two
things the API does not provide are composed there instead, and both are
noted in that file: filtering and sorting beyond `search`/`brandId`/
`categoryId` happen in-process on a fetched page, and `home` and `facets` are
assembled from the product, category and brand lists.

`CustomerApi` is still the localStorage mock. The real shopper routes are
implemented in `lib/api/shop` as server actions, but the contract assumes card
payments, shipping methods and line-id cart edits that the API does not have —
switching the storefront over is a UI change against those actions, not
another adapter. `lib/storefront/client.ts` says the same thing at the call
site.

## Routes this app does not call

`GET /tenant`, `GET /tenant/:id` and `PATCH /tenant/:id/status` are
unauthenticated platform-admin routes pending a backend fix. Anyone could list
every tenant or deactivate one. Nothing here calls them, and nothing should.
