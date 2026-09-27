// Storefront domain model: the DTOs the storefront exchanges with its data
// source. The mock implementation and the NestJS backend both speak exactly
// these shapes (see contracts.ts), so pages and themes never change when the
// data source does. Money is a plain number in the store's currency.

/** Demo catalog a store uses until it has real products (mock mode only). */
export type Vertical = "fashion" | "electronics" | "beauty" | "home";

export type StoreImage = { url: string; alt: string };

export type Ref = { id: string; slug: string; name: string };

export type Category = Ref & { description: string; image: StoreImage; productCount: number };
export type Brand = Ref & { description: string; image: StoreImage; productCount: number };
export type Collection = { id: string; slug: string; title: string; description: string; image: StoreImage };

export type ProductOptionValue = { value: string; swatch?: string };
export type ProductOption = { name: string; values: ProductOptionValue[] };

export type ProductVariant = {
  id: string;
  title: string;
  /** Option name → value, e.g. { Color: "Black", Size: "M" }. */
  options: Record<string, string>;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  inventory: number;
};

export type ProductBadge = "new" | "sale" | "bestseller" | "sold-out";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  highlights: string[];
  brand: Ref;
  category: Ref;
  collections: string[];
  tags: string[];
  images: StoreImage[];
  /** Lowest variant price. */
  price: number;
  compareAtPrice: number | null;
  options: ProductOption[];
  variants: ProductVariant[];
  rating: { average: number; count: number };
  badges: ProductBadge[];
  available: boolean;
  createdAt: string;
};

export type ProductSort = "featured" | "newest" | "price-asc" | "price-desc" | "rating" | "best-selling";

export type CatalogQuery = {
  q: string;
  category: string | null;
  brands: string[];
  minPrice: number | null;
  maxPrice: number | null;
  /** Minimum average rating (1–5). */
  rating: number | null;
  inStock: boolean;
  onSale: boolean;
  collection: string | null;
  sort: ProductSort;
  page: number;
  pageSize: number;
};

export type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number; pageCount: number };

export type FacetOption = Ref & { count: number };
export type CatalogFacets = {
  categories: FacetOption[];
  brands: FacetOption[];
  price: { min: number; max: number };
};

export type Review = {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  verified: boolean;
};

export type ReviewSummary = { average: number; count: number; distribution: Record<1 | 2 | 3 | 4 | 5, number> };

/** Stock imagery used by theme sections until the merchant adds their own. */
export type StoreMedia = { hero: StoreImage[]; banners: StoreImage[]; lifestyle: StoreImage[] };

/** Everything a home page may render, fetched in one request. */
export type HomeData = {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  collections: Collection[];
  media: StoreMedia;
};

// ---------------------------------------------------------------------------
// Store profile: merchant identity, independent of the theme. Edited in the
// simple "Customize" screen; every theme renders it.
// ---------------------------------------------------------------------------

export type NavLink = { label: string; href: string };

export type SocialLinks = {
  instagram: string;
  facebook: string;
  x: string;
  tiktok: string;
  youtube: string;
  pinterest: string;
};

export type StoreProfile = {
  name: string;
  tagline: string;
  /** Logo image URL; the store name is shown as a wordmark when empty. */
  logo: string;
  favicon: string;
  currency: string;
  contact: { email: string; phone: string; address: string };
  social: SocialLinks;
  announcement: { enabled: boolean; text: string; link: string };
  /** Main menu. Hrefs are relative to the store root ("/products?category=shoes"). */
  navigation: NavLink[];
  checkout: { freeShippingThreshold: number; standardRate: number; expressRate: number; taxRate: number };
};

// ---------------------------------------------------------------------------
// Customer session: cart, wishlist, account, orders.
// ---------------------------------------------------------------------------

export type CartLine = {
  id: string;
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  variantTitle: string;
  image: StoreImage;
  price: number;
  compareAtPrice: number | null;
  quantity: number;
  maxQuantity: number;
};

export type Cart = { id: string; lines: CartLine[]; itemCount: number; subtotal: number };

export type WishlistItem = {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image: StoreImage;
  price: number;
  compareAtPrice: number | null;
  addedAt: string;
};

export type Customer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  marketingOptIn: boolean;
  createdAt: string;
};

export type AddressInput = {
  firstName: string;
  lastName: string;
  company: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
};

export type Address = AddressInput & { id: string; isDefault: boolean };

export type ShippingMethod = { id: "standard" | "express"; label: string; description: string; price: number };

export type OrderStatus = "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

export type OrderLine = Omit<CartLine, "maxQuantity">;

export type Order = {
  id: string;
  number: string;
  createdAt: string;
  email: string;
  status: OrderStatus;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingMethod: ShippingMethod;
  shippingAddress: AddressInput;
  payment: { brand: string; last4: string };
  timeline: { status: OrderStatus; label: string; at: string }[];
};

export type CheckoutInput = {
  email: string;
  shippingAddress: AddressInput;
  shippingMethodId: ShippingMethod["id"];
  /** Real deployments send a payment-provider token here, never raw card data. */
  payment: { token: string; brand: string; last4: string };
  saveAddress: boolean;
};

export type RegisterInput = { firstName: string; lastName: string; email: string; password: string; marketingOptIn: boolean };
export type ReviewInput = { productId: string; rating: number; title: string; body: string; author: string };
