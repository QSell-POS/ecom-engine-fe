import type {
  Address,
  AddressInput,
  Brand,
  Cart,
  CatalogFacets,
  CatalogQuery,
  Category,
  CheckoutPaymentMethod,
  Customer,
  HomeData,
  Order,
  Paginated,
  Product,
  ReturnRequestInput,
  Review,
  ReviewSummary,
  StoreReturn,
  StoreReturnEligibility,
  WishlistItem,
} from "./types";

// The two data contracts the storefront's pages and themes depend on.
//
// CatalogApi is served for real by ./http/catalog-api.ts, which maps the
// API's /products, /categories, /brands and /reviews routes onto it (see that
// file for what the API cannot supply and what is composed here instead).
//
// CustomerApi has two implementations, chosen by store mode (see
// lib/storefront/client.ts): a "live" store calls the real shopper routes in
// lib/api/shop directly through ./http/customer-api.ts; demo/preview/design
// modes — a theme-store preview or the builder canvas, which have no real
// tenant behind them — keep the localStorage-backed mock. Both speak exactly
// this shape, which is why components never branch on mode themselves.

/**
 * Public catalog reads. Server-side (React Server Components), authenticated
 * with the store's public API key (`x-storefront-key`).
 */
export interface CatalogApi {
  /**
   * GET /storefront/home. `sources` are the Product grid sources the theme uses (see
   * theme-engine/product-source.ts); each is fetched by name so none comes up short.
   */
  home(sources?: string[]): Promise<HomeData>;
  /** GET /storefront/products?q&category&brand&minPrice&maxPrice&rating&inStock&onSale&collection&sort&page&pageSize */
  listProducts(query: CatalogQuery): Promise<Paginated<Product>>;
  /** GET /storefront/products/facets?(same filters) */
  facets(query: CatalogQuery): Promise<CatalogFacets>;
  /** GET /storefront/products/:slug */
  getProduct(slug: string): Promise<Product | null>;
  /** GET /storefront/products/:slug/related?limit */
  relatedProducts(slug: string, limit: number): Promise<Product[]>;
  /** GET /storefront/categories */
  listCategories(): Promise<Category[]>;
  /** GET /storefront/categories/:slug */
  getCategory(slug: string): Promise<Category | null>;
  /** GET /storefront/brands */
  listBrands(): Promise<Brand[]>;
  /** GET /storefront/brands/:slug */
  getBrand(slug: string): Promise<Brand | null>;
  /** GET /storefront/products/:slug/reviews?page */
  listReviews(slug: string, page: number): Promise<{ summary: ReviewSummary; reviews: Paginated<Review> }>;
}

/**
 * Customer session. For a live store this runs through server actions, which
 * keep the customer JWT in an httpOnly cookie — nothing here carries a token.
 * Login is the one call that can fail without throwing a generic error: it
 * resolves to `null` on bad credentials so forms can show their own message.
 */
export interface CustomerApi {
  getCart(): Promise<Cart>;
  /** `productId` only — the catalog has no variants. */
  addToCart(input: { productId: string; quantity: number }): Promise<Cart>;
  /** `quantity` is the new absolute amount; the API itself takes a signed delta. */
  updateCartLine(productId: string, quantity: number): Promise<Cart>;
  removeCartLine(productId: string): Promise<Cart>;

  getWishlist(): Promise<WishlistItem[]>;
  /** Toggling is idempotent, so add and remove are the same call. */
  toggleWishlist(productId: string): Promise<WishlistItem[]>;

  getCustomer(): Promise<Customer | null>;
  login(input: { identifier: string; password: string }): Promise<Customer | null>;
  register(input: { firstName?: string; lastName?: string; phone?: string; email: string; password: string }): Promise<Customer>;
  logout(): Promise<void>;

  listAddresses(): Promise<Address[]>;
  saveAddress(input: AddressInput & { id?: string; isDefault?: boolean }): Promise<Address[]>;
  deleteAddress(id: string): Promise<Address[]>;

  listOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  /** Creates the order. cod orders are placed outright; esewa/khalti need a follow-up redirect — see `initiatePayment`. */
  placeOrder(input: { addressId: string; items: { productId: string; quantity: number }[]; paymentMethod: CheckoutPaymentMethod; discountCode?: string }): Promise<Order>;
  /** Where to send the shopper for esewa/khalti. Never called for cod. */
  initiatePayment(orderId: string): Promise<{ redirectUrl: string }>;
  /** Only while `pending` or `confirmed`; later statuses reject it. */
  cancelOrder(orderId: string): Promise<Order>;
  /** The order's returns, and whether (and how much) can still be returned. Storefront orders, delivered, within the return window. */
  getOrderReturns(orderId: string): Promise<{ returns: StoreReturn[]; eligibility: StoreReturnEligibility }>;
  /** Ask the store for a return or exchange; nothing moves until the store processes it. */
  requestReturn(orderId: string, input: ReturnRequestInput): Promise<StoreReturn>;
  /** Withdraw a request the store hasn't acted on yet. */
  cancelReturn(orderId: string, returnId: string): Promise<StoreReturn>;

  submitReview(input: { productId: string; rating: number; comment?: string }): Promise<Review>;
}
