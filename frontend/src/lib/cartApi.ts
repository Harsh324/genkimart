import { api } from "./apiClient";

export async function getCartFromDb() {
  const { data } = await api.get("/api/cart/");
  return data;
}
export async function saveCartToDb(payload: { product_id: number | string; qty: number }) {
  const { data } = await api.post("/api/cart/", payload);
  return data;
}
export async function updateCartItem(id: string | number, payload: { qty: number }) {
  const { data } = await api.patch(`/cart/items/${id}/`, payload);
  return data;
}
export async function removeCartItem(id: string | number) {
  const { data } = await api.delete(`/cart/items/${id}/`);
  return data;
}
