"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useCanFn } from "@/components/auth/PermissionsProvider";
import { ACTION_LABELS, MODULES, moduleLabel, type Permission, type PermissionModule } from "@/lib/api/rbac/permissions";
import { cn } from "@/lib/utils";

/**
 * Modules down the side, their actions across. Used for a role's permissions, and for one person's
 * effective permissions when `base` (what their role gives) is passed: cells that differ from the
 * role are marked as custom.
 *
 * Cells the signed-in admin does not hold are disabled: the API refuses to let anyone hand out
 * access they don't have.
 */
export function PermissionMatrix({
  value,
  onChange,
  base,
  readOnly = false,
}: {
  value: Set<string>;
  onChange?: (next: Set<string>) => void;
  base?: Set<string>;
  readOnly?: boolean;
}) {
  const can = useCanFn();
  const modules = Object.keys(MODULES) as PermissionModule[];

  function toggle(permission: string, on: boolean) {
    const next = new Set(value);
    if (on) next.add(permission);
    else next.delete(permission);
    onChange?.(next);
  }

  function toggleModule(module: PermissionModule, on: boolean) {
    const next = new Set(value);
    for (const action of MODULES[module]) {
      const p = `${module}:${action}`;
      if (!can(p as Permission)) continue;
      if (on) next.add(p);
      else next.delete(p);
    }
    onChange?.(next);
  }

  return (
    <div className="divide-y rounded-md border">
      {modules.map((module) => {
        const actions = MODULES[module].map((action) => `${module}:${action}`);
        const all = actions.every((p) => value.has(p));
        const some = actions.some((p) => value.has(p));
        const moduleLocked = readOnly || actions.every((p) => !can(p as Permission));
        return (
          <div key={module} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-4">
            <label className="flex w-44 shrink-0 items-center gap-2 text-sm font-medium">
              <Checkbox
                checked={all ? true : some ? "indeterminate" : false}
                disabled={moduleLocked}
                onCheckedChange={(checked) => toggleModule(module, checked === true)}
                aria-label={`All ${moduleLabel(module)} permissions`}
              />
              {moduleLabel(module)}
            </label>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {actions.map((permission) => {
                const action = permission.split(":")[1];
                const on = value.has(permission);
                const custom = base !== undefined && base.has(permission) !== on;
                const locked = readOnly || !can(permission as Permission);
                return (
                  <label
                    key={permission}
                    className={cn("flex items-center gap-1.5 text-sm", locked && !readOnly && "opacity-60", custom && "font-medium text-primary")}
                    title={locked && !readOnly ? "You can only grant permissions you have yourself" : custom ? (on ? "Added for this person" : "Removed for this person") : undefined}
                  >
                    <Checkbox checked={on} disabled={locked} onCheckedChange={(checked) => toggle(permission, checked === true)} />
                    {ACTION_LABELS[action] ?? action}
                    {custom && <span className="text-xs">{on ? "(added)" : "(removed)"}</span>}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
