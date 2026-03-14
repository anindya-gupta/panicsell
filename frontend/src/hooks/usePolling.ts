import { useEffect, useRef, useState } from "react";
import type { MarketStatus } from "../types";

export function usePolling(
  marketStatus: MarketStatus | null,
  anyConnected: boolean,
  onUpdate: () => void,
  intervalMs: number = 30000
) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!anyConnected || !marketStatus?.is_open) return;

    timerRef.current = setInterval(() => {
      onUpdate();
      setLastUpdated(new Date());
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [anyConnected, marketStatus?.is_open, onUpdate, intervalMs]);

  return { lastUpdated };
}
