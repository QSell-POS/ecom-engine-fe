import { z } from "zod";
import { makeIdSchema } from "@/lib/api/shared/validation";

const password = z.string().min(8, "Use at least 8 characters").max(72, "Use 72 characters or fewer");

export const StaffIdSchema = makeIdSchema("Staff member");
export const RoleIdSchema = makeIdSchema("Role");

export const CreateStaffSchema = z.object({
  name: z.string().trim().min(1, "Enter their name").max(120),
  email: z.email("Enter a valid email"),
  password,
  roleId: z.string().min(1, "Choose a role"),
});

export const UpdateStaffSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Enter their name").max(120).optional(),
  roleId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  // Blank means "keep the current password".
  password: z.preprocess((v) => (v === "" ? undefined : v), password.optional()),
});

export const SetOverridesSchema = z.object({
  id: z.string().min(1),
  overrides: z.array(z.object({ permission: z.string().min(1), effect: z.enum(["allow", "deny"]) })).max(200),
});

export const RoleSchema = z.object({
  name: z.string().trim().min(1, "Give the role a name").max(80),
  description: z.string().trim().max(300).optional(),
  permissions: z.array(z.string()).min(1, "Pick at least one permission"),
});

export const UpdateRoleSchema = RoleSchema.extend({ id: z.string().min(1) });

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });

export type CreateStaffPayload = z.infer<typeof CreateStaffSchema>;
export type UpdateStaffPayload = Omit<z.infer<typeof UpdateStaffSchema>, "id">;
export type CreateRolePayload = z.infer<typeof RoleSchema>;
export type UpdateRolePayload = CreateRolePayload;
