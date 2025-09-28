import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
});

export const authless = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
});

// attach/remove Authorization for bearer mode
export const setAccessToken = (token: string | null) => {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
};

let isRefreshing = false;
let pending: Array<(token: string | null) => void> = [];

const onRefreshed = (t: string | null) => pending.forEach(cb => cb(t));
const addPending = (cb: (t: string | null) => void) => pending.push(cb);

const AUTH_PATHS = [
  "/api/auth/login/",
  "/api/auth/logout/",
  "/api/auth/registration/",
  "/api/auth/password/",
  "/api/auth/token/refresh/",
  "/api/auth/token/verify/",
  "/api/auth/registration/verify-email/",
  "/api/auth/registration/resend-email/",
];

const isAuthPath = (url?: string) => !!url && AUTH_PATHS.some(p => url.includes(p));

api.interceptors.response.use(
  r => r,
  async (error) => {
    const original = error.config || {};
    // Don't refresh on auth endpoints themselves
    if (isAuthPath(original.url)) throw error;
    if (original._retry) throw error;

    if (error?.response?.status === 401) {
      original._retry = true;

      // queue all 401s while we refresh once
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          // support both cookie-based refresh and body-based refresh
          const storedRefresh = typeof window !== "undefined" ? localStorage.getItem("refresh") : null;
          const body = storedRefresh ? { refresh: storedRefresh } : {}; // empty body for cookie mode

          const { data } = await authless.post("/api/auth/token/refresh/", body);
          const newAccess: string | undefined = data?.access || data?.access_token || null as any;

          // bearer mode: set header + persist
          if (newAccess) {
            setAccessToken(newAccess);
            if (typeof window !== "undefined") localStorage.setItem("access", newAccess);
          } else {
            // cookie mode: no Authorization header needed
            setAccessToken(null);
          }

          onRefreshed(newAccess ?? null);
          pending = [];
          isRefreshing = false;
          return api(original);
        } catch (e) {
          isRefreshing = false;
          pending = [];
          // clear local tokens; cookie mode will just remain unauth
          if (typeof window !== "undefined") {
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
          }
          setAccessToken(null);
          throw e;
        }
      }

      // wait for refresh
      return new Promise((resolve) => {
        addPending((token) => {
          if (token && original.headers) original.headers["Authorization"] = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    throw error;
  }
);
