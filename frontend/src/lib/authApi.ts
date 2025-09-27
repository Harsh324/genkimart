import api, { setAccessToken } from "./apiClient";

type LoginPayload = { email: string; password: string };
type RegisterPayload = { email: string; username: string; password1: string; password2: string };

export async function login(payload: LoginPayload) {
  const { data } = await api.post("/api/auth/login/", payload);
  const access = data?.access || data?.access_token;
  const refresh = data?.refresh || data?.refresh_token;
  if (access) localStorage.setItem("access", access);
  if (refresh) localStorage.setItem("refresh", refresh);
  setAccessToken(access || null);
  return data;
}

export async function logout() {
  try { await api.post("/api/auth/logout/"); } catch {}
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  setAccessToken(null);
}

export async function register(payload: RegisterPayload) {
  // dj-rest-auth registration: email + password1/2
  const { data } = await api.post("/api/auth/registration/", payload);
  return data;
}

export async function getUser() {
  const { data } = await api.get("/api/auth/user/");
  return data; // {email, first_name, ...}
}

export async function refreshToken() {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return null;
  const { data } = await api.post("/api/auth/token/refresh/", { refresh });
  const access = data?.access;
  if (access) {
    localStorage.setItem("access", access);
    setAccessToken(access);
  }
  return access;
}

export async function resendVerificationEmail(email: string) {
  // dj-rest-auth expects {email}
  const { data } = await api.post("/api/auth/registration/resend-email/", { email });
  return data;
}

export async function verifyEmail(key: string) {
  // key comes from the verification link
  const { data } = await api.post("/api/auth/registration/verify-email/", { key });
  return data;
}
