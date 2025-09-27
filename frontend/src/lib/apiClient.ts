import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true, // dj-rest-auth can use cookies; safe even if tokens in memory
});

let isRefreshing = false;
let pending: Array<(token: string) => void> = [];

const onRefreshed = (token: string) => pending.forEach(cb => cb(token));
const addPending = (cb: (token: string) => void) => pending.push(cb);

export const setAccessToken = (token: string | null) => {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
};

api.interceptors.response.use(
  r => r,
  async (error) => {
    const original = error.config;
    if (!original || original._retry) throw error;

    if (error?.response?.status === 401) {
      original._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const { data } = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/token/refresh/`,
            { refresh: typeof window !== "undefined" ? localStorage.getItem("refresh") : null },
            { withCredentials: true }
          );
          const newAccess = data?.access;
          if (newAccess) {
            localStorage.setItem("access", newAccess);
            setAccessToken(newAccess);
            onRefreshed(newAccess);
            pending = [];
          }
          isRefreshing = false;
          return api(original);
        } catch (e) {
          isRefreshing = false;
          pending = [];
          // optional: clear local state here; AuthProvider will logout on next call
          throw e;
        }
      }

      // Queue up while refresh is happening
      return new Promise((resolve) => {
        addPending((token) => {
          if (token) original.headers["Authorization"] = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    throw error;
  }
);

export default api;
