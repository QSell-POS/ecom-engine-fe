"use server";

import { updateTag } from "next/cache";
import { authActionClient } from "@/lib/safe-action";
import {
  changeOwnPassword,
  createRole,
  createStaff,
  deleteRole,
  deleteStaff,
  setStaffOverrides,
  updateRole,
  updateStaff,
} from "./service";
import { AUDIT_TAG, ROLES_TAG, STAFF_TAG } from "./constants";
import {
  ChangePasswordSchema,
  CreateStaffSchema,
  RoleIdSchema,
  RoleSchema,
  SetOverridesSchema,
  StaffIdSchema,
  UpdateRoleSchema,
  UpdateStaffSchema,
} from "./validation";

function refreshAccess() {
  updateTag(STAFF_TAG);
  updateTag(ROLES_TAG);
  updateTag(AUDIT_TAG);
}

export const createStaffAction = authActionClient.inputSchema(CreateStaffSchema).action(async ({ parsedInput }) => {
  const staff = await createStaff(parsedInput);
  refreshAccess();
  return { staff };
});

export const updateStaffAction = authActionClient.inputSchema(UpdateStaffSchema).action(async ({ parsedInput }) => {
  const { id, ...data } = parsedInput;
  const staff = await updateStaff(id, data);
  refreshAccess();
  return { staff };
});

export const setStaffOverridesAction = authActionClient.inputSchema(SetOverridesSchema).action(async ({ parsedInput }) => {
  const staff = await setStaffOverrides(parsedInput.id, parsedInput.overrides);
  refreshAccess();
  return { staff };
});

export const deleteStaffAction = authActionClient.inputSchema(StaffIdSchema).action(async ({ parsedInput }) => {
  await deleteStaff(parsedInput.id);
  refreshAccess();
  return { success: true };
});

export const createRoleAction = authActionClient.inputSchema(RoleSchema).action(async ({ parsedInput }) => {
  const role = await createRole(parsedInput);
  refreshAccess();
  return { role };
});

export const updateRoleAction = authActionClient.inputSchema(UpdateRoleSchema).action(async ({ parsedInput }) => {
  const { id, ...data } = parsedInput;
  const role = await updateRole(id, data);
  refreshAccess();
  return { role };
});

export const deleteRoleAction = authActionClient.inputSchema(RoleIdSchema).action(async ({ parsedInput }) => {
  await deleteRole(parsedInput.id);
  refreshAccess();
  return { success: true };
});

export const changePasswordAction = authActionClient.inputSchema(ChangePasswordSchema).action(async ({ parsedInput }) => {
  await changeOwnPassword({ currentPassword: parsedInput.currentPassword, newPassword: parsedInput.newPassword });
  updateTag(AUDIT_TAG);
  return { success: true };
});
