import {
  Boxes,
  Images,
  CreditCard,
  Database,
  Globe,
  History,
  ShieldCheck,
  UserCog,
  UserRound,
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
import type { Permission } from "@/lib/api/rbac/permissions";
import { ROUTES } from "./routes";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Hidden unless the admin holds this. `"owner"` = the store owner only. Omitted = everyone. */
  permission?: Permission | "owner";
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
      { label: "Products", href: ROUTES.products, icon: Package, permission: "products:view" },
      { label: "Categories", href: ROUTES.categories, icon: Shapes, permission: "categories:view" },
      { label: "Brands", href: ROUTES.brands, icon: Tag, permission: "brands:view" },
      { label: "Inventory", href: ROUTES.inventory, icon: Boxes, permission: "inventory:view" },
      { label: "Media", href: ROUTES.media, icon: Images, permission: "media:view" },
    ],
  },
  {
    label: "Selling",
    items: [
      { label: "Orders", href: ROUTES.orders, icon: ReceiptText, permission: "orders:view" },
      { label: "Customers", href: ROUTES.customers, icon: Users, permission: "customers:view" },
      { label: "Payments", href: ROUTES.payments, icon: CreditCard, permission: "payments:view" },
      { label: "Discounts", href: ROUTES.discounts, icon: TicketPercent, permission: "discounts:view" },
      { label: "Delivery rates", href: ROUTES.deliveryRates, icon: Truck, permission: "delivery:view" },
    ],
  },
  {
    label: "Engage",
    items: [
      { label: "Chat", href: ROUTES.chat, icon: MessagesSquare, permission: "chat:view" },
      { label: "Reviews", href: ROUTES.reviews, icon: MessageSquareQuote, permission: "reviews:view" },
    ],
  },
  {
    label: "Online store",
    items: [
      { label: "Themes", href: ROUTES.themes, icon: LayoutTemplate, permission: "themes:view" },
      { label: "Customize", href: ROUTES.customize, icon: Palette, permission: "themes:view" },
      { label: "Theme store", href: ROUTES.themeStore, icon: Store, permission: "themes:view" },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Store address", href: ROUTES.storeAddress, icon: Globe, permission: "settings:view" },
      { label: "Staff", href: ROUTES.staff, icon: UserCog, permission: "staff:view" },
      { label: "Roles", href: ROUTES.roles, icon: ShieldCheck, permission: "staff:view" },
      { label: "Audit log", href: ROUTES.auditLog, icon: History, permission: "staff:manage" },
      { label: "API keys", href: ROUTES.apiKeys, icon: KeyRound, permission: "api_keys:manage" },
      { label: "Demo data", href: ROUTES.demoData, icon: Database, permission: "owner" },
      { label: "Your account", href: ROUTES.account, icon: UserRound },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

/** The nav item that owns a pathname (e.g. /products/12/edit → Products). The most specific match wins. */
export function navItemForPath(pathname: string): NavItem | undefined {
  return NAV_ITEMS.filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)).sort((a, b) => b.href.length - a.href.length)[0];
}
