import { z } from "zod";

export function makeIdSchema(entityLabel: string) {
  return z.object({
    id: z.string().min(1, `${entityLabel} id is required`),
  });
}

export const emptyToUndefined = (value: unknown) =>
  value === "" ? undefined : value;

export const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.url().optional(),
);

export const optionalText = z.preprocess(
  emptyToUndefined,
  z.string().optional(),
);
