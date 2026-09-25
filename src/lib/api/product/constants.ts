export const PRODUCTS_TAG = "products";

export function productTag(id: string) {
  return `product-${id}`;
}

export const PRODUCT_PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const PRODUCT_ROUTES = {
  list: "/products",
  create: "/products/create",
  edit: (id: string) => `/products/${id}/edit`,
};
