import { api, authless, setAccessToken } from "./apiClient";

type LoginPayload = { email: string; password: string };
type RegisterPayload = { email: string; username: string; password1: string; password2: string };

export async function login(payload: LoginPayload) {
  // ensure we don't send a stale header during login
  setAccessToken(null);
  if (typeof window !== "undefined") {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  }

  const { data, headers } = await authless.post("/api/auth/login/", payload);

  // Try JSON first
  const access = data?.access || data?.access_token || null;
  const refresh = data?.refresh || data?.refresh_token || null;

  // Some backends also echo Authorization header; optional fallback
  const authHeader = headers?.authorization || headers?.Authorization;
  const bearerMatch = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  const finalAccess = access || bearerMatch || null;

  if (finalAccess) {
    if (typeof window !== "undefined") localStorage.setItem("access", finalAccess);
    setAccessToken(finalAccess);
  } else {
    // cookie mode: rely purely on httpOnly cookies
    setAccessToken(null);
  }

  if (refresh && typeof window !== "undefined") localStorage.setItem("refresh", refresh);

  return data;
}


export async function logout() {
  try {
    // If you're using tokens in localStorage (bearer mode)
    const refresh =
      typeof window !== "undefined" ? localStorage.getItem("refresh") : null;

    // dj-rest-auth expects { refresh } when using SimpleJWT + blacklist
    await authless.post("/api/auth/logout/", refresh ? { refresh } : {});
  } catch (e) {
    // Swallow errors like:
    // {"detail":"Refresh token was not included in request data."} or 401 on expired refresh
    // We still clear client state below.
  } finally {
    // Always clear client-side session
    if (typeof window !== "undefined") {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
    }
    setAccessToken(null);
  }
}

export async function register(payload: RegisterPayload) {
  const { data } = await authless.post("/api/auth/registration/", payload);
  return data;
}

export async function getUser() {
  const { data } = await api.get("/api/auth/user/");
  return data;
}

export async function refreshToken() {
  // let interceptor handle refresh automatically;
  // this helper is used only at boot to prefill header if we have stored tokens
  const stored = typeof window !== "undefined" ? localStorage.getItem("access") : null;
  if (stored) setAccessToken(stored);
  return stored;
}

export async function resendVerificationEmail(email: string) {
  // dj-rest-auth expects {email}
  const { data } = await authless.post("/api/auth/registration/resend-email/", { email });
  return data;
}

export async function verifyEmail(key: string) {
  // key comes from the verification link
  const { data } = await authless.post("/api/auth/registration/verify-email/", { key });
  return data;
}

// Update user profile (PUT or PATCH – using PATCH keeps it minimal)
export async function updateUser(payload: {
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string; // allowed by dj-rest-auth, but changes may trigger re-verify depending on settings
}) {
  const { data } = await authless.patch("/api/auth/user/", payload);
  return data;
}

export async function changePassword(payload: {
  old_password: string;
  new_password1: string;
  new_password2: string;
}) {
  // dj-rest-auth endpoint
  const { data } = await authless.post("/api/auth/password/change/", payload);
  return data;
}