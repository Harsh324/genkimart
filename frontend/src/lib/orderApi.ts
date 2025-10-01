// src/lib/orderApi.ts
import { api } from "./apiClient";
export interface BillingInfo {
  email: string;
  firstName: string;
  lastName: string;
  country: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  orderNotes?: string;
}


export interface OrderPayload {
  items: { product: string; quantity: number }[];
  billing: BillingInfo;
  paymentMethod: "cod" | "credit_card";
}

export async function createOrder(payload: OrderPayload) {
  const { data } = await api.post("/api/orders/", payload);
  return data;
}
