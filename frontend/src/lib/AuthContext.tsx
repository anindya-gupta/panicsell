import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { getToken, setToken, clearToken, apiFetch } from "./apiFetch";

interface AuthContextValue {
  isAuthenticated: boolean;
  checking: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsAuthenticated(false);
      setChecking(false);
      return;
    }
    fetch("/api/auth/status", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.status === 401) {
          clearToken();
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        clearToken();
        setIsAuthenticated(false);
      })
      .finally(() => setChecking(false));
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/app-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        return data?.detail || "Invalid credentials";
      }
      const data = await res.json();
      setToken(data.token);
      setIsAuthenticated(true);
      return null;
    } catch {
      return "Connection failed. Please try again.";
    }
  }, []);

  const logout = useCallback(async () => {
    await apiFetch("/api/auth/app-logout", { method: "POST" }).catch(() => {});
    clearToken();
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAppAuth must be used inside AuthProvider");
  return ctx;
}
