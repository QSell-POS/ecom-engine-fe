import { orderTotals, shippingMethods, StorefrontError } from "../checkout";
import type { CustomerApi } from "../contracts";
import type {
  Address,
  Cart,
  CartLine,
  Customer,
  Order,
  OrderLine,
  OrderStatus,
  Product,
  Review,
  StoreProfile,
  Vertical,
  WishlistItem,
} from "../types";
import { demoCatalog } from "./catalog-data";

// MOCK customer API (browser only): cart, wishlist, accounts and orders kept
// in localStorage per store, with the behaviour the NestJS API must provide
// (stock checks, server-side totals, order history). A demo shopper account
// is seeded so account pages look lived-in:
//
//   demo@example.com / demo1234

export const DEMO_CUSTOMER = { email: "demo@example.com", password: "demo1234" };

type StoredUser = { customer: Customer; password: string; addresses: Address[] };
type StoredCart = { id: string; lines: { id: string; productId: string; variantId: string; quantity: number }[] };
type State = {
  version: number;
  users: StoredUser[];
  sessionUserId: string | null;
  cart: StoredCart;
  wishlist: { productId: string; addedAt: string }[];
  orders: Order[];
  guestOrderIds: string[];
  reviews: Review[];
};

const VERSION = 1;
const LATENCY_MS = 220;
const memory = new Map<string, string>();

const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
const wait = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
const now = () => new Date().toISOString();
const daysAgo = (days: number, hours = 0) => new Date(Date.now() - days * 86_400_000 - hours * 3_600_000).toISOString();

const STATUS_LABELS: Record<OrderStatus, string> = {
  confirmed: "Order confirmed",
  processing: "Preparing your order",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function lineFor(product: Product, variantId: string, quantity: number, lineId: string): CartLine | null {
  const variant = product.variants.find((v) => v.id === variantId);
  if (!variant) return null;
  return {
    id: lineId,
    productId: product.id,
    variantId,
    slug: product.slug,
    name: product.name,
    variantTitle: variant.title === "Default" ? "" : variant.title,
    image: product.images[0],
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    quantity: Math.min(quantity, Math.max(1, variant.inventory)),
    maxQuantity: variant.inventory,
  };
}

/** Order lines are cart lines without the live stock ceiling. */
function toOrderLine(line: CartLine): OrderLine {
  const { id, productId, variantId, slug, name, variantTitle, image, price, compareAtPrice, quantity } = line;
  return { id, productId, variantId, slug, name, variantTitle, image, price, compareAtPrice, quantity };
}

function seed(products: Product[], checkout: StoreProfile["checkout"]): State {
  const customer: Customer = {
    id: "cus_demo",
    email: DEMO_CUSTOMER.email,
    firstName: "Alex",
    lastName: "Morgan",
    phone: "+1 (555) 201-7788",
    marketingOptIn: true,
    createdAt: daysAgo(210),
  };
  const home: Address = {
    id: "adr_home", firstName: "Alex", lastName: "Morgan", company: "", line1: "245 Park Avenue", line2: "Apt 12B",
    city: "New York", region: "NY", postalCode: "10167", country: "United States", phone: customer.phone, isDefault: true,
  };
  const work: Address = {
    id: "adr_work", firstName: "Alex", lastName: "Morgan", company: "Northwind Studio", line1: "90 Bedford Street", line2: "",
    city: "Brooklyn", region: "NY", postalCode: "11211", country: "United States", phone: customer.phone, isDefault: false,
  };

  const inStock = products.filter((p) => p.available);
  const order = (n: number, picks: number[], status: OrderStatus, age: number): Order => {
    const lines = picks
      .map((i) => inStock[i % inStock.length])
      .map((p, i) => lineFor(p, p.variants.find((v) => v.inventory > 0)!.id, i === 0 ? 1 : 2, uid("ol"))!)
      .map(toOrderLine);
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const method = shippingMethods(subtotal, checkout)[0];
    const flow: OrderStatus[] = status === "delivered" ? ["confirmed", "processing", "shipped", "delivered"] : status === "shipped" ? ["confirmed", "processing", "shipped"] : ["confirmed", "processing"];
    return {
      id: `ord_demo_${n}`,
      number: `#10${40 + n}`,
      createdAt: daysAgo(age),
      email: customer.email,
      status,
      lines,
      ...orderTotals(subtotal, method.price, checkout),
      shippingMethod: method,
      shippingAddress: home,
      payment: { brand: "Visa", last4: "4242" },
      timeline: flow.map((s, i) => ({ status: s, label: STATUS_LABELS[s], at: daysAgo(age - i * (age > 5 ? 2 : 0.3), -i * 3) })),
    };
  };

  return {
    version: VERSION,
    users: [{ customer, password: DEMO_CUSTOMER.password, addresses: [home, work] }],
    sessionUserId: null,
    cart: { id: uid("cart"), lines: [] },
    wishlist: [],
    orders: [order(3, [1, 5], "processing", 1), order(2, [3, 8, 11], "shipped", 6), order(1, [0], "delivered", 42)],
    guestOrderIds: [],
    reviews: [],
  };
}

export function createMockCustomerApi(options: { storeKey: string; vertical: Vertical; checkout: StoreProfile["checkout"] }): CustomerApi {
  const key = `ee:storefront:${options.storeKey}`;
  const products = () => demoCatalog(options.vertical).products;
  const byId = (id: string) => products().find((p) => p.id === id);

  function load(): State {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      raw = memory.get(key) ?? null;
    }
    if (raw) {
      try {
        const state = JSON.parse(raw) as State;
        if (state.version === VERSION) return state;
      } catch {
        // fall through to a fresh seed
      }
    }
    const fresh = seed(products(), options.checkout);
    save(fresh);
    return fresh;
  }

  function save(state: State) {
    const raw = JSON.stringify(state);
    try {
      window.localStorage.setItem(key, raw);
    } catch {
      memory.set(key, raw);
    }
  }

  function update<T>(mutate: (state: State) => T): T {
    const state = load();
    const result = mutate(state);
    save(state);
    return result;
  }

  function currentUser(state: State) {
    return state.users.find((u) => u.customer.id === state.sessionUserId) ?? null;
  }

  function requireUser(state: State) {
    const user = currentUser(state);
    if (!user) throw new StorefrontError("Please sign in to continue.", 401);
    return user;
  }

  function buildCart(state: State): Cart {
    const lines = state.cart.lines
      .map((stored) => {
        const product = byId(stored.productId);
        return product ? lineFor(product, stored.variantId, stored.quantity, stored.id) : null;
      })
      .filter((line): line is CartLine => line !== null);
    return {
      id: state.cart.id,
      lines,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal: Math.round(lines.reduce((sum, line) => sum + line.price * line.quantity, 0) * 100) / 100,
    };
  }

  function buildWishlist(state: State): WishlistItem[] {
    return state.wishlist
      .map(({ productId, addedAt }) => {
        const product = byId(productId);
        if (!product) return null;
        return {
          productId,
          slug: product.slug,
          name: product.name,
          brand: product.brand.name,
          image: product.images[0],
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          addedAt,
        };
      })
      .filter((item): item is WishlistItem => item !== null);
  }

  return {
    async getCart() {
      return buildCart(load());
    },

    async addToCart({ productId, variantId, quantity }) {
      await wait();
      return update((state) => {
        const product = byId(productId);
        const variant = product?.variants.find((v) => v.id === variantId);
        if (!product || !variant) throw new StorefrontError("This product is no longer available.", 404);
        const existing = state.cart.lines.find((line) => line.variantId === variantId);
        const next = (existing?.quantity ?? 0) + quantity;
        if (variant.inventory <= 0) throw new StorefrontError("Sorry, this option just sold out.", 409);
        if (next > variant.inventory) throw new StorefrontError(`Only ${variant.inventory} left in stock.`, 409);
        if (existing) existing.quantity = next;
        else state.cart.lines.push({ id: uid("line"), productId, variantId, quantity });
        return buildCart(state);
      });
    },

    async updateCartLine(lineId, quantity) {
      await wait();
      return update((state) => {
        const line = state.cart.lines.find((l) => l.id === lineId);
        if (!line) return buildCart(state);
        const max = byId(line.productId)?.variants.find((v) => v.id === line.variantId)?.inventory ?? 0;
        if (quantity > max) throw new StorefrontError(`Only ${max} left in stock.`, 409);
        if (quantity <= 0) state.cart.lines = state.cart.lines.filter((l) => l.id !== lineId);
        else line.quantity = quantity;
        return buildCart(state);
      });
    },

    async removeCartLine(lineId) {
      await wait();
      return update((state) => {
        state.cart.lines = state.cart.lines.filter((l) => l.id !== lineId);
        return buildCart(state);
      });
    },

    async getWishlist() {
      return buildWishlist(load());
    },
    async addToWishlist(productId) {
      return update((state) => {
        if (!state.wishlist.some((w) => w.productId === productId)) state.wishlist.unshift({ productId, addedAt: now() });
        return buildWishlist(state);
      });
    },
    async removeFromWishlist(productId) {
      return update((state) => {
        state.wishlist = state.wishlist.filter((w) => w.productId !== productId);
        return buildWishlist(state);
      });
    },

    async getCustomer() {
      return currentUser(load())?.customer ?? null;
    },

    async login({ email, password }) {
      await wait();
      return update((state) => {
        const user = state.users.find((u) => u.customer.email.toLowerCase() === email.trim().toLowerCase());
        if (!user || user.password !== password) throw new StorefrontError("That email and password don't match. Try again or reset your password.", 401);
        state.sessionUserId = user.customer.id;
        return user.customer;
      });
    },

    async register(input) {
      await wait();
      return update((state) => {
        const email = input.email.trim().toLowerCase();
        if (state.users.some((u) => u.customer.email.toLowerCase() === email)) {
          throw new StorefrontError("An account with this email already exists. Sign in instead.", 409);
        }
        const customer: Customer = {
          id: uid("cus"),
          email,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          phone: "",
          marketingOptIn: input.marketingOptIn,
          createdAt: now(),
        };
        state.users.push({ customer, password: input.password, addresses: [] });
        state.sessionUserId = customer.id;
        return customer;
      });
    },

    async logout() {
      update((state) => {
        state.sessionUserId = null;
      });
    },

    async requestPasswordReset() {
      await wait();
    },

    async updateProfile(patch) {
      await wait();
      return update((state) => {
        const user = requireUser(state);
        user.customer = { ...user.customer, ...patch };
        return user.customer;
      });
    },

    async listAddresses() {
      const user = currentUser(load());
      return user ? user.addresses : [];
    },

    async saveAddress({ id, isDefault, ...input }) {
      await wait();
      return update((state) => {
        const user = requireUser(state);
        const makeDefault = isDefault || user.addresses.length === 0;
        if (makeDefault) user.addresses.forEach((a) => (a.isDefault = false));
        const existing = id ? user.addresses.find((a) => a.id === id) : undefined;
        if (existing) Object.assign(existing, input, makeDefault ? { isDefault: true } : {});
        else user.addresses.push({ ...input, id: uid("adr"), isDefault: makeDefault });
        return user.addresses;
      });
    },

    async deleteAddress(id) {
      await wait();
      return update((state) => {
        const user = requireUser(state);
        const removed = user.addresses.find((a) => a.id === id);
        user.addresses = user.addresses.filter((a) => a.id !== id);
        if (removed?.isDefault && user.addresses[0]) user.addresses[0].isDefault = true;
        return user.addresses;
      });
    },

    async listOrders() {
      await wait();
      const state = load();
      const user = currentUser(state);
      if (!user) return [];
      return state.orders.filter((o) => o.email === user.customer.email).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async getOrder(id) {
      await wait();
      const state = load();
      const order = state.orders.find((o) => o.id === id);
      if (!order) return null;
      const user = currentUser(state);
      const owns = user ? order.email === user.customer.email : false;
      return owns || state.guestOrderIds.includes(id) ? order : null;
    },

    async placeOrder(input) {
      await wait();
      await wait();
      return update((state) => {
        const cart = buildCart(state);
        if (cart.lines.length === 0) throw new StorefrontError("Your bag is empty.", 409);
        for (const line of cart.lines) {
          if (line.quantity > line.maxQuantity) throw new StorefrontError(`${line.name} has only ${line.maxQuantity} left. Update your bag to continue.`, 409);
        }
        const method = shippingMethods(cart.subtotal, options.checkout).find((m) => m.id === input.shippingMethodId);
        if (!method) throw new StorefrontError("Choose a delivery option.", 400);

        const user = currentUser(state);
        const number = `#${1100 + state.orders.length + 1}`;
        const order: Order = {
          id: uid("ord"),
          number,
          createdAt: now(),
          email: user?.customer.email ?? input.email.trim().toLowerCase(),
          status: "confirmed",
          lines: cart.lines.map(toOrderLine),
          ...orderTotals(cart.subtotal, method.price, options.checkout),
          shippingMethod: method,
          shippingAddress: input.shippingAddress,
          payment: { brand: input.payment.brand, last4: input.payment.last4 },
          timeline: [{ status: "confirmed", label: STATUS_LABELS.confirmed, at: now() }],
        };
        state.orders.push(order);
        if (!user) state.guestOrderIds.push(order.id);
        if (user && input.saveAddress) {
          const exists = user.addresses.some((a) => a.line1 === input.shippingAddress.line1 && a.postalCode === input.shippingAddress.postalCode);
          if (!exists) user.addresses.push({ ...input.shippingAddress, id: uid("adr"), isDefault: user.addresses.length === 0 });
        }
        state.cart = { id: uid("cart"), lines: [] };
        return order;
      });
    },

    async submitReview(input) {
      await wait();
      return update((state) => {
        const review: Review = {
          id: uid("rev"),
          productId: input.productId,
          author: input.author.trim() || "Anonymous",
          rating: Math.min(5, Math.max(1, Math.round(input.rating))),
          title: input.title.trim().slice(0, 120),
          body: input.body.trim().slice(0, 2000),
          createdAt: now(),
          verified: Boolean(currentUser(state)),
        };
        state.reviews.unshift(review);
        return review;
      });
    },
  };
}

/** Reviews submitted in this browser (mock mode), merged into the product page's list. */
export function localReviews(storeKey: string, productId: string): Review[] {
  try {
    const state = JSON.parse(window.localStorage.getItem(`ee:storefront:${storeKey}`) ?? "null") as State | null;
    return state?.reviews.filter((r) => r.productId === productId) ?? [];
  } catch {
    return [];
  }
}
