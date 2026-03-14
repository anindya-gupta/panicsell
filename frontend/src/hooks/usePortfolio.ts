import { useState, useCallback } from "react";
import type { Holding, PortfolioSummary } from "../types";

export function usePortfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHoldings = useCallback(async (broker?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = broker
        ? `/api/portfolio/holdings?broker=${broker}`
        : "/api/portfolio/holdings";
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setHoldings(data.holdings);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch holdings");
    } finally {
      setLoading(false);
    }
  }, []);

  return { holdings, summary, loading, error, fetchHoldings };
}
