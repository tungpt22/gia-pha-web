// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  loadUserInfo,
  AUTH_CHANGED_EVENT,
  type UserInfo,
} from "../api/authApi";

type AuthCtx = {
  token: string | null;
  user: any | null;
  login: (phone_number: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    loadUserInfo()?.access_token ?? null
  );
  const [user, setUser] = useState<any | null>(loadUserInfo()?.user ?? null);

  // đồng bộ theo sự kiện phát từ authApi khi login/logout
  useEffect(() => {
    const onAuth = (e: Event) => {
      const detail = (e as CustomEvent<UserInfo | null>).detail || null;
      setToken(detail?.access_token ?? null);
      setUser(detail?.user ?? null);
    };
    document.addEventListener(AUTH_CHANGED_EVENT, onAuth as EventListener);
    return () =>
      document.removeEventListener(AUTH_CHANGED_EVENT, onAuth as EventListener);
  }, []);

  const login = useCallback(async (phone_number: string, password: string) => {
    const info = await apiLogin(phone_number, password);
    setToken(info.access_token);
    setUser(info.user);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({ token, user, login, logout }),
    [token, user, login, logout]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
