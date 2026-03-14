import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/apiFetch";
import type { MarketStatus } from "../types";

export function useMarketStatus() {
  const [status, setStatus] = useState<MarketStatus | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiFetch("/api/market/status");
      const data: MarketStatus = await res.json();
      setStatus(data);
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return status;
}
