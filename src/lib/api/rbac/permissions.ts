/**
 * The admin permission catalog, mirrored from the API (`modules/rbac/permissions.ts`). The API is
 * the authority: it enforces every route, and the role editor reads its live catalog from
 * `GET /admin/permissions`. This copy exists for type-checked `useCan("…")` calls and for labels.
 */
export const MODULES = {
  products: ["view", "create", "update", "delete"],
  categories: ["view", "manage"],
  brands: ["view", "manage"],
  inventory: ["view", "adjust"],
  orders: ["view", "update"],
  payments: ["view"],
  customers: ["view", "create", "update", "delete"],
  reviews: ["view", "moderate", "delete"],
  discounts: ["view", "manage"],
  delivery: ["view", "manage"],
  media: ["view", "upload", "delete"],
  chat: ["view", "reply", "manage"],
  themes: ["view", "edit", "publish", "delete"],
  settings: ["view", "manage"],
  api_keys: ["manage"],
  staff: ["view", "manage"],
} as const;

export type PermissionModule = keyof typeof MODULES;
export type Permission = { [M in PermissionModule]: `${M}:${(typeof MODULES)[M][number]}` }[PermissionModule];

export const MODULE_LABELS: Record<string, string> = {
  products: "Products",
  categories: "Categories",
  brands: "Brands",
  inventory: "Inventory",
  orders: "Orders",
  payments: "Payments",
  customers: "Customers",
  reviews: "Reviews",
  discounts: "Discounts",
  delivery: "Delivery rates",
  media: "Media",
  chat: "Chat",
  themes: "Themes",
  settings: "Store settings",
  api_keys: "API keys",
  staff: "Staff & roles",
};

export const ACTION_LABELS: Record<string, string> = {
  view: "View",
  create: "Create",
  update: "Edit",
  delete: "Delete",
  manage: "Manage",
  adjust: "Adjust stock",
  moderate: "Moderate",
  upload: "Upload",
  reply: "Reply",
  edit: "Edit",
  publish: "Publish",
};

export function moduleLabel(module: string) {
  return MODULE_LABELS[module] ?? module;
}

export function permissionLabel(permission: string) {
  if (permission === "*") return "Everything";
  const [module, action] = permission.split(":");
  return `${moduleLabel(module)}: ${action === "*" ? "All" : (ACTION_LABELS[action] ?? action)}`;
}

/** Same expansion the API applies: `*`, `module:*`, or one permission; unknown strings grant nothing. */
export function expandGrant(grant: string): string[] {
  const all = (Object.keys(MODULES) as PermissionModule[]).flatMap((m) => MODULES[m].map((a) => `${m}:${a}`));
  if (grant === "*") return all;
  const [module, action] = grant.split(":");
  const actions = (MODULES as Record<string, readonly string[]>)[module];
  if (!actions) return [];
  if (action === "*") return actions.map((a) => `${module}:${a}`);
  return actions.includes(action) ? [grant] : [];
}

/**
 * The API's resolution rule, mirrored for previews: (role ∪ allow) − deny, and any action in a
 * module implies its view unless view is denied.
 */
export function resolvePermissions(roleGrants: string[], overrides: { permission: string; effect: "allow" | "deny" }[] = []) {
  const granted = new Set(roleGrants.flatMap(expandGrant));
  overrides.filter((o) => o.effect === "allow").flatMap((o) => expandGrant(o.permission)).forEach((p) => granted.add(p));
  const denied = new Set(overrides.filter((o) => o.effect === "deny").flatMap((o) => expandGrant(o.permission)));
  denied.forEach((p) => granted.delete(p));
  for (const p of [...granted]) {
    const view = `${p.split(":")[0]}:view`;
    if (expandGrant(view).length && !denied.has(view)) granted.add(view);
  }
  return granted;
}

/** Who is signed in to the dashboard, from `GET /admin/me`. */
export type Me = {
  kind: "owner" | "staff";
  id?: string;
  name: string;
  email: string;
  role: { id: string; name: string } | null;
  permissions: string[];
};

export function meCan(me: Me | null, permission: Permission | "owner") {
  if (!me || me.kind === "owner") return true;
  if (permission === "owner") return false;
  return me.permissions.includes(permission);
}
