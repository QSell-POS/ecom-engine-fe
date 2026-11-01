import type { Address as ApiAddress } from "@/lib/api/shared/types";
import { toAmount } from "@/lib/api/shared/types";
import {
  cancelOrderAction,
  changeCartItemAction,
  deleteAddressAction,
  getShopAddressesAction,
  getShopOrderAction,
  getShopOrdersAction,
  getShopSessionAction,
  initiatePaymentAction,
  placeOrderAction,
  removeFromCartAction,
  saveAddressAction,
  shopLoginAction,
  shopLogoutAction,
  shopRegisterAction,
  toggleWishlistAction,
} from "@/lib/api/shop/action";
import type { ShopCart, ShopCartItem, ShopCustomer, ShopWishlistItem } from "@/lib/api/shop/types";
import type { Order as ApiOrder } from "@/lib/api/order/types";
import { submitReviewAction } from "@/lib/api/review/action";
import type { CustomerApi } from "../contracts";
import type { Address, AddressInput, Cart, CartLine, Customer, Order, OrderLine, Review, StoreImage, WishlistItem } from "../types";
import { StorefrontError } from "../checkout";

/**
 * The live adapter: every method is a thin call to a server action in
 * `lib/api/shop`, which keeps the customer JWT in an httpOnly cookie. Mapping
 * lives here rather than in the components, so pages never see the
 * difference between this and the mock (demo/preview/design) implementation.
 */

function unwrap<T>(result: { data?: T; serverError?: string; validationErrors?: unknown } | undefined, fallback: string): T {
  if (!result?.data) throw new StorefrontError(result?.serverError ?? firstValidationError(result?.validationErrors) ?? fallback);
  return result.data;
}

// next-safe-action reports schema failures as { field: { _errors: [...] } }
// rather than a serverError; without this the shopper only sees the fallback.
function firstValidationError(errors: unknown): string | undefined {
  if (!errors || typeof errors !== "object") return undefined;
  for (const value of Object.values(errors as Record<string, unknown>)) {
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    const nested = firstValidationError(value);
    if (nested) return nested;
  }
  return undefined;
}

const FALLBACK_IMAGE: StoreImage = { url: "", alt: "" };

function productImage(product: ShopCartItem["product"] | ShopWishlistItem["product"]): StoreImage {
  const first = [...(product?.media ?? [])].sort((a, b) => a.position - b.position)[0];
  return first ? { url: first.media.url, alt: first.media.alt ?? product?.name ?? "" } : FALLBACK_IMAGE;
}

function mapCartLine(item: ShopCartItem): CartLine {
  const price = toAmount(item.product?.sellingPrice ?? "0");
  const compareAtPrice = item.product?.compareAtPrice ? toAmount(item.product.compareAtPrice) : null;
  return {
    id: item.productId,
    productId: item.productId,
    slug: item.product?.slug ?? "",
    name: item.product?.name ?? "Product",
    image: productImage(item.product),
    price,
    compareAtPrice: compareAtPrice && compareAtPrice > price ? compareAtPrice : null,
    quantity: item.quantity,
    // The API reports stock as inStock/not, never a count.
    maxQuantity: item.product?.inStock === false ? item.quantity : 99,
  };
}

function mapCart(cart: ShopCart | null): Cart {
  const lines = (cart?.items ?? []).map(mapCartLine);
  return {
    id: cart?.id ?? "cart",
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
  };
}

function mapWishlistItem(item: ShopWishlistItem): WishlistItem {
  const price = toAmount(item.product?.sellingPrice ?? "0");
  const compareAtPrice = item.product?.compareAtPrice ? toAmount(item.product.compareAtPrice) : null;
  return {
    id: item.id,
    productId: item.productId,
    slug: item.product?.slug ?? "",
    name: item.product?.name ?? "Product",
    image: productImage(item.product),
    price,
    compareAtPrice: compareAtPrice && compareAtPrice > price ? compareAtPrice : null,
    addedAt: item.createdAt ?? new Date().toISOString(),
  };
}

function mapCustomer(customer: Pick<ShopCustomer, "id" | "email" | "firstName" | "lastName" | "phone">): Customer {
  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName ?? "",
    lastName: customer.lastName ?? "",
    phone: customer.phone ?? "",
    createdAt: new Date().toISOString(),
  };
}

function mapAddress(address: ApiAddress): Address {
  return {
    id: address.id,
    region: address.region,
    city: address.city,
    area: address.area,
    buildingStreet: address.buildingStreet,
    address: address.address,
    landmark: address.landmark ?? "",
    postalCode: address.postalCode ?? "",
    phone: "",
    label: address.label ?? "HOME",
    isDefault: address.isDefaultShipping ?? false,
  };
}

function toAddressPayload(input: AddressInput) {
  return {
    region: input.region,
    city: input.city,
    area: input.area,
    buildingStreet: input.buildingStreet,
    address: input.address,
    landmark: input.landmark || undefined,
    postalCode: input.postalCode || undefined,
    label: input.label,
  };
}

function mapOrderLine(item: NonNullable<ApiOrder["items"]>[number]): OrderLine {
  return {
    id: item.id,
    productId: item.productId,
    name: item.productNameSnapshot,
    sku: item.productSkuSnapshot ?? "",
    quantity: item.quantity,
    price: toAmount(item.priceSnapshot),
  };
}

function mapOrder(order: ApiOrder): Order {
  return {
    id: order.id,
    number: order.orderNumber,
    createdAt: order.createdAt ?? new Date().toISOString(),
    status: order.status,
    paymentMethod: order.paymentMethod,
    lines: (order.items ?? []).map(mapOrderLine),
    subtotal: toAmount(order.subtotalAmount),
    discount: order.discountAmount ? toAmount(order.discountAmount) : 0,
    shipping: order.deliveryCharge ? toAmount(order.deliveryCharge) : 0,
    total: toAmount(order.totalAmount),
    shippingAddress: order.shippingAddressSnapshot ?? "",
    shippingCity: order.shippingCitySnapshot ?? "",
    shippingRegion: order.shippingRegionSnapshot ?? "",
  };
}

async function fetchAddresses(): Promise<Address[]> {
  const result = unwrap(await getShopAddressesAction({}), "Couldn't load your addresses.");
  return result.addresses.map(mapAddress);
}

export function createLiveCustomerApi(): CustomerApi {
  return {
    async getCart() {
      const session = unwrap(await getShopSessionAction({}), "Couldn't load your cart.");
      return mapCart(session.cart);
    },

    async addToCart({ productId, quantity }) {
      const cart = unwrap(await changeCartItemAction({ productId, qty: quantity }), "Couldn't add that to your bag.");
      return mapCart(cart.cart);
    },

    async updateCartLine(productId, quantity) {
      // The contract takes an absolute quantity; the API wants a signed
      // delta, so the current line has to be read first. Carts are small —
      // this is one extra round trip, not a design to optimise away.
      const current = unwrap(await getShopSessionAction({}), "Couldn't load your cart.");
      const line = current.cart?.items.find((item) => item.productId === productId);
      const delta = quantity - (line?.quantity ?? 0);
      if (delta === 0) return mapCart(current.cart);
      const cart = unwrap(await changeCartItemAction({ productId, qty: delta }), "Couldn't update your bag.");
      return mapCart(cart.cart);
    },

    async removeCartLine(productId) {
      const cart = unwrap(await removeFromCartAction({ productId }), "Couldn't remove that.");
      return mapCart(cart.cart);
    },

    async getWishlist() {
      const session = unwrap(await getShopSessionAction({}), "Couldn't load your wishlist.");
      return session.wishlist.map(mapWishlistItem);
    },

    async toggleWishlist(productId) {
      unwrap(await toggleWishlistAction({ productId }), "Couldn't update your wishlist.");
      const session = unwrap(await getShopSessionAction({}), "Couldn't load your wishlist.");
      return session.wishlist.map(mapWishlistItem);
    },

    async getCustomer() {
      const session = unwrap(await getShopSessionAction({}), "Couldn't load your account.");
      return session.customer ? mapCustomer(session.customer) : null;
    },

    async login({ identifier, password }) {
      const result = await shopLoginAction({ identifier, password });
      if (!result?.data) throw new StorefrontError(result?.serverError ?? "That email/phone or password isn't right.", 401);
      return mapCustomer(result.data.customer);
    },

    async register(input) {
      const result = await shopRegisterAction(input);
      return mapCustomer(unwrap(result, "Couldn't create your account.").customer);
    },

    async logout() {
      await shopLogoutAction();
    },

    async listAddresses() {
      return fetchAddresses();
    },

    async saveAddress(input) {
      unwrap(
        // A new address arrives with id "" from checkout; the action wants a UUID or nothing.
        await saveAddressAction({ ...toAddressPayload(input), id: input.id || undefined, isDefaultShipping: input.isDefault }),
        "Couldn't save that address.",
      );
      return fetchAddresses();
    },

    async deleteAddress(id) {
      unwrap(await deleteAddressAction({ id }), "Couldn't remove that address.");
      return fetchAddresses();
    },

    async listOrders() {
      const result = await getShopOrdersAction({ limit: 50 });
      return unwrap(result, "Couldn't load your orders.").orders.map(mapOrder);
    },

    async getOrder(id) {
      const result = await getShopOrderAction({ id });
      const order = result?.data?.order;
      return order ? mapOrder(order) : null;
    },

    async placeOrder({ addressId, items, paymentMethod, discountCode }) {
      const result = await placeOrderAction({ addressId, items, paymentMethod, discountCode, idempotencyKey: crypto.randomUUID() });
      return mapOrder(unwrap(result, "Couldn't place your order.").order);
    },

    async initiatePayment(orderId) {
      const result = await initiatePaymentAction({ id: orderId });
      return unwrap(result, "Couldn't start the payment.").initiation;
    },

    async cancelOrder(orderId) {
      const result = await cancelOrderAction({ id: orderId });
      return mapOrder(unwrap(result, "Couldn't cancel this order.").order);
    },

    async submitReview({ productId, rating, comment }) {
      const result = await submitReviewAction({ productId, rating, comment });
      const review = unwrap(result, "Couldn't post your review.").review;
      return {
        id: review.id,
        productId: review.productId,
        author: "You",
        rating: review.rating,
        title: "",
        body: review.comment ?? "",
        createdAt: review.createdAt ?? new Date().toISOString(),
        verified: review.isVerifiedBuyer ?? true,
      };
    },
  };
}

export type { Review };
