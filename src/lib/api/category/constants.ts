export const CATEGORIES_TAG = "categories";

export function categoryTag(id: string) {
  return `categories-${id}`;
}

export const CATEGORY_PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const CATEGORY_ROUTES = {
  list: "/categories",
};
