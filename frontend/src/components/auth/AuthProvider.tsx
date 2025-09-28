"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getUser, login as apiLogin, logout as apiLogout, register as apiRegister, refreshToken } from "@/lib/authApi";
import { setAccessToken } from "@/lib/apiClient";
import { toast } from "react-toastify";

type User = any;
type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (p: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  register: (p: { email: string; username: string; password1: string; password2: string }) => Promise<void>;
  refetchUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem("access") : null;
        if (stored) setAccessToken(stored); // bearer mode
        await refreshToken(); // no-op for bearer; primes header; cookie mode: nothing to set
        const u = await getUser();
        setUser(u);
      } catch {
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (p: { email: string; password: string }) => {
    setLoading(true);
    try {
      await apiLogin(p);
      const u = await getUser();
      setUser(u);
      toast.success("Logged in");
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.response?.data || "Login failed";
      toast.error(typeof msg === "string" ? msg : "Login failed");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiLogout();
      setUser(null);
      toast.info("Logged out");
    } finally {
      setLoading(false);
    }
  };

  const register = async (p: { email: string; username: string; password1: string; password2: string }) => {
    setLoading(true);
    try {
      await apiRegister(p);
      toast.success("Registered! Please verify your email if required.");
    } catch (e: any) {
      const msg = e?.response?.data || "Registration failed";
      toast.error(typeof msg === "string" ? msg : "Registration failed");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const refetchUser = async () => {
    try {
      const u = await getUser();
      setUser(u);
    } catch {
      setUser(null);
    }
  };

  const value = useMemo(() => ({ user, loading, login, logout, register, refetchUser }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
