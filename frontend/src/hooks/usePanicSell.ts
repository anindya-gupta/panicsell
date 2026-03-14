import { useState } from "react";
import type { SellResponse } from "../types";

export function usePanicSell() {
  const [selling, setSelling] = useState(false);
  const [result, setResult] = useState<SellResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeSell = async (
    symbols?: string[],
    broker?: string,
    variety: string = "regular"
  ) => {
    setSelling(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/orders/panic-sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbols: symbols ?? null,
          broker: broker ?? null,
          variety,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || `HTTP ${res.status}`);
      }
      const data: SellResponse = await res.json();
      setResult(data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sell failed";
      setError(msg);
      return null;
    } finally {
      setSelling(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { selling, result, error, executeSell, reset };
}
