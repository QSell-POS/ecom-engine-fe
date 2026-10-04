import {
  Boxes,
  Images,
  CreditCard,
  Globe,
  KeyRound,
  LayoutDashboard,
  LayoutTemplate,
  MessagesSquare,
  MessageSquareQuote,
  Package,
  Palette,
  ReceiptText,
  Shapes,
  Store,
  Tag,
  TicketPercent,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "./routes";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string | null;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ label: "Dashboard", href: ROUTES.dashboard, icon: LayoutDashboard }],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: ROUTES.products, icon: Package },
      { label: "Categories", href: ROUTES.categories, icon: Shapes },
      { label: "Brands", href: ROUTES.brands, icon: Tag },
      { label: "Inventory", href: ROUTES.inventory, icon: Boxes },
      { label: "Media", href: ROUTES.media, icon: Images },
    ],
  },
  {
    label: "Selling",
    items: [
      { label: "Orders", href: ROUTES.orders, icon: ReceiptText },
      { label: "Customers", href: ROUTES.customers, icon: Users },
      { label: "Payments", href: ROUTES.payments, icon: CreditCard },
      { label: "Discounts", href: ROUTES.discounts, icon: TicketPercent },
      { label: "Delivery rates", href: ROUTES.deliveryRates, icon: Truck },
    ],
  },
  {
    label: "Engage",
    items: [
      { label: "Chat", href: ROUTES.chat, icon: MessagesSquare },
      { label: "Reviews", href: ROUTES.reviews, icon: MessageSquareQuote },
    ],
  },
  {
    label: "Online store",
    items: [
      { label: "Themes", href: ROUTES.themes, icon: LayoutTemplate },
      { label: "Customize", href: ROUTES.customize, icon: Palette },
      { label: "Theme store", href: ROUTES.themeStore, icon: Store },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Store address", href: ROUTES.storeAddress, icon: Globe },
      { label: "API keys", href: ROUTES.apiKeys, icon: KeyRound },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

/** The nav item that owns a pathname (e.g. /products/12/edit → Products). The most specific match wins. */
export function navItemForPath(pathname: string): NavItem | undefined {
  return NAV_ITEMS.filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)).sort((a, b) => b.href.length - a.href.length)[0];
}
