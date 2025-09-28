import api from "./apiClient";
export async function getWishlist() {
  const { data } = await api.get("/wishlist/");
  return data;
}
export async function addToWishlist(product_id: number | string) {
  const { data } = await api.post("/wishlist/items/", { product_id });
  return data;
}
export async function removeFromWishlist(id: number | string) {
  const { data } = await api.delete(`/wishlist/items/${id}/`);
  return data;
}
