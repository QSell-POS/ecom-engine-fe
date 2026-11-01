import { estimatedShipping, StorefrontError } from "../checkout";
import type { CustomerApi } from "../contracts";
import type {
  Address,
  AddressInput,
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

// MOCK customer API (browser only, demo/preview/design modes): cart,
// wishlist, accounts and orders kept in localStorage per store, with the
// behaviour the real API provides for a live store (stock checks,
// server-computed totals, order history). A demo shopper account is seeded
// so account pages look lived-in:
//
//   demo@example.com / demo1234

export const DEMO_CUSTOMER = { email: "demo@example.com", password: "demo1234" };

type StoredUser = { customer: Customer; password: string; addresses: Address[]; orders: Order[] };
type StoredCartLine = { productId: string; quantity: number };
type State = {
  version: number;
  users: StoredUser[];
  sessionUserId: string | null;
  cart: StoredCartLine[];
  wishlist: { id: string; productId: string; addedAt: string }[];
  guestOrders: Order[];
  reviews: Review[];
};

const VERSION = 2;
const LATENCY_MS = 220;
const memory = new Map<string, string>();

const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
const wait = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
const now = () => new Date().toISOString();
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

const EMPTY_ADDRESS: AddressInput = { region: "", city: "", area: "", buildingStreet: "", address: "", landmark: "", postalCode: "", phone: "", label: "HOME" };

function lineFor(product: Product, quantity: number): CartLine | null {
  const variant = product.variants[0];
  if (!variant) return null;
  return {
    id: product.id,
    productId: product.id,
    slug: product.slug,
    name: product.name,
    image: product.images[0],
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    quantity: Math.min(quantity, Math.max(1, variant.inventory)),
    maxQuantity: variant.inventory,
  };
}

function toOrderLine(line: CartLine): OrderLine {
  return { id: uid("ol"), productId: line.productId, name: line.name, sku: "", quantity: line.quantity, price: line.price };
}

function seed(products: Product[], checkout: StoreProfile["checkout"]): State {
  const customer: Customer = {
    id: "cus_demo",
    email: DEMO_CUSTOMER.email,
    firstName: "Alex",
    lastName: "Morgan",
    phone: "+9779800000000",
    createdAt: daysAgo(210),
  };
  const home: Address = { ...EMPTY_ADDRESS, id: "adr_home", region: "Bagmati", city: "Kathmandu", area: "Baneshwor", buildingStreet: "House 42", address: "House 42, Mid-Baneshwor, Kathmandu", phone: customer.phone, isDefault: true };
  const work: Address = { ...EMPTY_ADDRESS, id: "adr_work", region: "Bagmati", city: "Lalitpur", area: "Jhamsikhel", buildingStreet: "Suite 5", address: "Suite 5, Jhamsikhel, Lalitpur", label: "OFFICE", phone: customer.phone, isDefault: false };

  const inStock = products.filter((p) => p.available);
  const standardRate = estimatedShipping(0, checkout);
  const order = (n: number, picks: number[], status: OrderStatus, age: number): Order => {
    const lines = picks
      .map((i) => inStock[i % inStock.length])
      .map((p, i) => lineFor(p, i === 0 ? 1 : 2))
      .filter((l): l is CartLine => l !== null)
      .map(toOrderLine);
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    return {
      id: `ord_demo_${n}`,
      number: `ORD-2026-00${40 + n}`,
      createdAt: daysAgo(age),
      status,
      paymentMethod: "cod",
      lines,
      subtotal,
      discount: 0,
      shipping: standardRate,
      total: subtotal + standardRate,
      shippingAddress: home.address,
      shippingCity: home.city,
      shippingRegion: home.region,
    };
  };

  return {
    version: VERSION,
    users: [{ customer, password: DEMO_CUSTOMER.password, addresses: [home, work], orders: [order(3, [1, 5], "processing", 1), order(2, [3, 8, 11], "shipped", 6), order(1, [0], "delivered", 42)] }],
    sessionUserId: null,
    cart: [],
    wishlist: [],
    guestOrders: [],
    reviews: [],
  };
}

export function createMockCustomerApi(options: { storeKey: string; vertical: Vertical; checkout: StoreProfile["checkout"] }): CustomerApi {
  const key = `ee:storefront:${options.storeKey}`;
  const products = () => demoCatalog(options.vertical).products;
  const byId = (id: string) => products().find((p) => p.id === id);
  const standardRate = () => estimatedShipping(0, options.checkout);

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
    const lines = state.cart
      .map((stored) => {
        const product = byId(stored.productId);
        return product ? lineFor(product, stored.quantity) : null;
      })
      .filter((line): line is CartLine => line !== null);
    return {
      id: "cart",
      lines,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal: Math.round(lines.reduce((sum, line) => sum + line.price * line.quantity, 0) * 100) / 100,
    };
  }

  function buildWishlist(state: State): WishlistItem[] {
    return state.wishlist
      .map(({ id, productId, addedAt }) => {
        const product = byId(productId);
        if (!product) return null;
        return { id, productId, slug: product.slug, name: product.name, image: product.images[0], price: product.price, compareAtPrice: product.compareAtPrice, addedAt };
      })
      .filter((item): item is WishlistItem => item !== null);
  }

  return {
    async getCart() {
      return buildCart(load());
    },

    async addToCart({ productId, quantity }) {
      await wait();
      return update((state) => {
        const product = byId(productId);
        if (!product) throw new StorefrontError("This product is no longer available.", 404);
        const variant = product.variants[0];
        const existing = state.cart.find((line) => line.productId === productId);
        const next = (existing?.quantity ?? 0) + quantity;
        if (!variant || variant.inventory <= 0) throw new StorefrontError("Sorry, this is out of stock.", 409);
        if (next > variant.inventory) throw new StorefrontError(`Only ${variant.inventory} left in stock.`, 409);
        if (existing) existing.quantity = next;
        else state.cart.push({ productId, quantity });
        return buildCart(state);
      });
    },

    async updateCartLine(productId, quantity) {
      await wait();
      return update((state) => {
        const line = state.cart.find((l) => l.productId === productId);
        if (!line) return buildCart(state);
        const max = byId(productId)?.variants[0]?.inventory ?? 0;
        if (quantity > max) throw new StorefrontError(`Only ${max} left in stock.`, 409);
        if (quantity <= 0) state.cart = state.cart.filter((l) => l.productId !== productId);
        else line.quantity = quantity;
        return buildCart(state);
      });
    },

    async removeCartLine(productId) {
      await wait();
      return update((state) => {
        state.cart = state.cart.filter((l) => l.productId !== productId);
        return buildCart(state);
      });
    },

    async getWishlist() {
      return buildWishlist(load());
    },

    async toggleWishlist(productId) {
      await wait();
      return update((state) => {
        if (state.wishlist.some((w) => w.productId === productId)) state.wishlist = state.wishlist.filter((w) => w.productId !== productId);
        else state.wishlist.unshift({ id: uid("wish"), productId, addedAt: now() });
        return buildWishlist(state);
      });
    },

    async getCustomer() {
      return currentUser(load())?.customer ?? null;
    },

    async login({ identifier, password }) {
      await wait();
      return update((state) => {
        const target = identifier.trim().toLowerCase();
        const user = state.users.find((u) => u.customer.email.toLowerCase() === target || u.customer.phone === identifier.trim());
        if (!user || user.password !== password) return null;
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
        const customer: Customer = { id: uid("cus"), email, firstName: input.firstName?.trim() ?? "", lastName: input.lastName?.trim() ?? "", phone: input.phone ?? "", createdAt: now() };
        state.users.push({ customer, password: input.password, addresses: [], orders: [] });
        state.sessionUserId = customer.id;
        return customer;
      });
    },

    async logout() {
      update((state) => {
        state.sessionUserId = null;
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
      const user = currentUser(load());
      return user ? [...user.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
    },

    async getOrder(id) {
      await wait();
      const state = load();
      const user = currentUser(state);
      return user?.orders.find((o) => o.id === id) ?? state.guestOrders.find((o) => o.id === id) ?? null;
    },

    async placeOrder({ addressId, items, paymentMethod, discountCode }) {
      void discountCode;
      await wait();
      return update((state) => {
        const user = requireUser(state);
        const address = user.addresses.find((a) => a.id === addressId);
        if (!address) throw new StorefrontError("Choose a delivery address.", 400);

        const lines = items
          .map(({ productId, quantity }) => {
            const product = byId(productId);
            return product ? lineFor(product, quantity) : null;
          })
          .filter((l): l is CartLine => l !== null);
        if (lines.length === 0) throw new StorefrontError("Your bag is empty.", 409);
        for (const line of lines) {
          if (line.quantity > line.maxQuantity) throw new StorefrontError(`${line.name} has only ${line.maxQuantity} left.`, 409);
        }

        const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
        const shipping = standardRate();
        const order: Order = {
          id: uid("ord"),
          number: `ORD-2026-${String(user.orders.length + 1).padStart(6, "0")}`,
          createdAt: now(),
          status: paymentMethod === "cod" ? "confirmed" : "pending",
          paymentMethod,
          lines: lines.map(toOrderLine),
          subtotal,
          discount: 0,
          shipping,
          total: subtotal + shipping,
          shippingAddress: address.address,
          shippingCity: address.city,
          shippingRegion: address.region,
        };
        user.orders.push(order);
        state.cart = state.cart.filter((line) => !items.some((i) => i.productId === line.productId));
        return order;
      });
    },

    async cancelOrder(orderId) {
      await wait();
      return update((state) => {
        const user = requireUser(state);
        const order = user.orders.find((o) => o.id === orderId);
        if (!order) throw new StorefrontError("Order not found.", 404);
        if (order.status !== "pending" && order.status !== "confirmed") throw new StorefrontError("This order can no longer be cancelled.", 409);
        order.status = "cancelled";
        return order;
      });
    },

    async initiatePayment(orderId) {
      await wait();
      // No real gateway in mock mode: confirm the order immediately and
      // bounce straight back to the same-site success page.
      update((state) => {
        for (const user of state.users) {
          const order = user.orders.find((o) => o.id === orderId);
          if (order) order.status = "confirmed";
        }
      });
      return { redirectUrl: `/checkout/success?order=${orderId}` };
    },

    async submitReview({ productId, rating, comment }) {
      await wait();
      return update((state) => {
        const review: Review = {
          id: uid("rev"),
          productId,
          author: currentUser(state)?.customer.firstName || "You",
          rating: Math.min(5, Math.max(1, Math.round(rating))),
          title: "",
          body: (comment ?? "").trim().slice(0, 2000),
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
