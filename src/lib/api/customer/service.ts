import "server-only";
import { apiClient, apiList } from "@/lib/api/client";
import { buildQuery, type ListParams, type ListResponse } from "@/lib/api/shared/types";
import type { CreateCustomerPayload, UpdateCustomerStatusPayload } from "./dto";
import type { Customer, CustomerAddress, CustomerCart } from "./types";
import { CUSTOMERS_TAG, customerAddressesTag, customerCartTag, customerTag } from "./constants";

/** Filters: status. `search` covers name, email and phone. */
export async function getCustomers(params?: ListParams): Promise<ListResponse<Customer>> {
  return apiList<Customer>(`/admin/customers${buildQuery(params)}`, { auth: "owner", tags: [CUSTOMERS_TAG], revalidate: 30 });
}

export async function getCustomer(id: string) {
  return apiClient<Customer>(`/admin/customers/${id}`, { auth: "owner", tags: [customerTag(id)], revalidate: 30 });
}

export async function createCustomer(data: CreateCustomerPayload) {
  return apiClient<Customer>("/admin/customers", { method: "POST", body: data, auth: "owner" });
}

export async function deleteCustomer(id: string) {
  // 409 when the customer has orders — ban them instead.
  return apiClient<null>(`/admin/customers/${id}`, { method: "DELETE", auth: "owner" });
}

/** Anything other than `active` ends that shopper's session on their next request. */
export async function updateCustomerStatus(id: string, data: UpdateCustomerStatusPayload) {
  return apiClient<Customer>(`/admin/customers/${id}/status`, { method: "PATCH", body: data, auth: "owner" });
}

export async function getCustomerAddresses(customerId: string) {
  const response = await apiList<CustomerAddress>(`/admin/customers/${customerId}/addresses`, {
    auth: "owner",
    tags: [customerAddressesTag(customerId)],
    revalidate: 60,
  });
  return response.data;
}

export async function getCustomerAddress(customerId: string, id: string) {
  return apiClient<CustomerAddress>(`/admin/customers/${customerId}/addresses/${id}`, {
    auth: "owner",
    tags: [customerAddressesTag(customerId)],
    revalidate: 60,
  });
}

/** Their live basket — what abandoned-cart follow-up works from. */
export async function getCustomerCart(customerId: string) {
  return apiClient<CustomerCart>(`/admin/customers/${customerId}/cart`, {
    auth: "owner",
    tags: [customerCartTag(customerId)],
    revalidate: 15,
    allow404: true,
  });
}
