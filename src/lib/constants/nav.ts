import { ROUTES } from "./routes";

export type NavItem = {
  label: string;
  href: string;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: ROUTES.dashboard },
  { label: "Brands", href: ROUTES.brands },
  { label: "Categories", href: ROUTES.categories },
  { label: "Products", href: ROUTES.products },
];
