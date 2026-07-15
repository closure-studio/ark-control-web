import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { createApiClient, type ApiClient } from "@/api/client";

const TOKEN_STORAGE_KEY = "ark-control-admin-token";

type AuthState = {
  token: string;
  api: ApiClient | null;
  signIn: (token: string) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) ?? "");

  function signOut() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken("");
  }

  function signIn(value: string) {
    const next = value.trim();
    if (!next) return;
    localStorage.setItem(TOKEN_STORAGE_KEY, next);
    setToken(next);
  }

  const api = useMemo(() => (token ? createApiClient(token, signOut) : null), [token]);
  const value = useMemo(() => ({ token, api, signIn, signOut }), [token, api]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
