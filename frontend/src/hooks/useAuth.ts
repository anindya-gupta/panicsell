import { useState, useEffect, useCallback } from "react";
import type { BrokerStatus } from "../types";

export function useAuth() {
  const [brokers, setBrokers] = useState<BrokerStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/status");
      const data = await res.json();
      setBrokers(data.brokers || []);
    } catch {
      setBrokers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const login = (brokerName: string) => {
    window.location.href = `/api/auth/login/${brokerName}`;
  };

  const logout = async (brokerName: string) => {
    await fetch(`/api/auth/logout/${brokerName}`, { method: "POST" });
    await checkStatus();
  };

  const anyConnected = brokers.some((b) => b.connected);

  return { brokers, loading, anyConnected, login, logout, refresh: checkStatus };
}
