import type {
  Address,
  AddressInput,
  Brand,
  Cart,
  CatalogFacets,
  CatalogQuery,
  Category,
  CheckoutInput,
  Customer,
  HomeData,
  Order,
  Paginated,
  Product,
  RegisterInput,
  Review,
  ReviewInput,
  ReviewSummary,
  WishlistItem,
} from "./types";

// The two data contracts the storefront depends on. Each method maps 1:1 onto
// an endpoint of the NestJS storefront API (paths below, relative to
// STOREFRONT_API_URL). The mock implementations in ./mock follow the same
// contract, so switching to the real backend is configuration only.

/**
 * Public catalog reads. Server-side (React Server Components), authenticated
 * with the store's public API key (`x-storefront-key`).
 */
export interface CatalogApi {
  /** GET /storefront/home */
  home(): Promise<HomeData>;
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
 * Customer session: runs in the browser. The real API keeps the session in an
 * httpOnly cookie (`credentials: "include"`); a guest cart is identified by a
 * cart cookie issued on first add.
 */
export interface CustomerApi {
  /** GET /storefront/cart */
  getCart(): Promise<Cart>;
  /** POST /storefront/cart/lines { variantId, quantity } */
  addToCart(input: { productId: string; variantId: string; quantity: number }): Promise<Cart>;
  /** PATCH /storefront/cart/lines/:lineId { quantity } */
  updateCartLine(lineId: string, quantity: number): Promise<Cart>;
  /** DELETE /storefront/cart/lines/:lineId */
  removeCartLine(lineId: string): Promise<Cart>;

  /** GET /storefront/wishlist */
  getWishlist(): Promise<WishlistItem[]>;
  /** POST /storefront/wishlist { productId } */
  addToWishlist(productId: string): Promise<WishlistItem[]>;
  /** DELETE /storefront/wishlist/:productId */
  removeFromWishlist(productId: string): Promise<WishlistItem[]>;

  /** GET /storefront/auth/me (null when signed out) */
  getCustomer(): Promise<Customer | null>;
  /** POST /storefront/auth/login */
  login(input: { email: string; password: string }): Promise<Customer>;
  /** POST /storefront/auth/register */
  register(input: RegisterInput): Promise<Customer>;
  /** POST /storefront/auth/logout */
  logout(): Promise<void>;
  /** POST /storefront/auth/forgot-password (always succeeds: never reveals whether an email exists) */
  requestPasswordReset(email: string): Promise<void>;
  /** PATCH /storefront/account */
  updateProfile(patch: Partial<Pick<Customer, "firstName" | "lastName" | "phone" | "marketingOptIn">>): Promise<Customer>;

  /** GET /storefront/account/addresses */
  listAddresses(): Promise<Address[]>;
  /** POST /storefront/account/addresses · PUT /storefront/account/addresses/:id */
  saveAddress(input: AddressInput & { id?: string; isDefault?: boolean }): Promise<Address[]>;
  /** DELETE /storefront/account/addresses/:id */
  deleteAddress(id: string): Promise<Address[]>;

  /** GET /storefront/account/orders */
  listOrders(): Promise<Order[]>;
  /** GET /storefront/orders/:id (own orders, or a guest order just placed in this session) */
  getOrder(id: string): Promise<Order | null>;
  /** POST /storefront/checkout → creates the order, charges the payment token, empties the cart */
  placeOrder(input: CheckoutInput): Promise<Order>;

  /** POST /storefront/products/:productId/reviews */
  submitReview(input: ReviewInput): Promise<Review>;
}
