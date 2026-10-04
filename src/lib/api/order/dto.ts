import type { OrderStatus } from "./types";

/** PATCH /admin/orders/:id/status takes the status and nothing else. */
export type UpdateOrderStatusPayload = { status: OrderStatus };
