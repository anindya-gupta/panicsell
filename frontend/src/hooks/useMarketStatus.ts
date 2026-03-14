import { useState, useEffect, useCallback } from "react";
import type { MarketStatus } from "../types";

export function useMarketStatus() {
  const [status, setStatus] = useState<MarketStatus | null>(null);

  const fetch_status = useCallback(async () => {
    try {
      const res = await fetch("/api/market/status");
      const data: MarketStatus = await res.json();
      setStatus(data);
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    fetch_status();
    const interval = setInterval(fetch_status, 30000);
    return () => clearInterval(interval);
  }, [fetch_status]);

  return status;
}
