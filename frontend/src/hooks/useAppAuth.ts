import { useState, useCallback } from "react";
import { getToken, setToken, clearToken, apiFetch } from "../lib/apiFetch";

export function useAppAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getToken());
  const [checking, setChecking] = useState(true);

  const verify = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setIsAuthenticated(false);
      setChecking(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        clearToken();
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
    } catch {
      setIsAuthenticated(false);
      clearToken();
    }
    setChecking(false);
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

  return { isAuthenticated, checking, verify, login, logout };
}
