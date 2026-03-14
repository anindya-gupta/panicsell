import { useState, useEffect } from "react";
import type { MarginsResponse } from "../types";

function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
}

export default function FundsBar({ broker }: { broker?: string }) {
  const [data, setData] = useState<MarginsResponse | null>(null);

  useEffect(() => {
    fetch("/api/portfolio/margins")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data || data.margins.length === 0) return null;

  const visible = broker ? data.margins.filter((m) => m.broker === broker) : data.margins;
  if (visible.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap animate-fade-in">
      {visible.map((m) => (
        <div key={m.broker} className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${m.broker === "zerodha" ? "bg-zerodha" : "bg-groww"}`} />
          <span className="text-[11px] uppercase text-gray-500 font-medium tracking-wide">{m.broker}</span>
          <span className="text-sm font-mono font-bold text-accent-green">{formatINR(m.available_cash)}</span>
          <span className="text-[10px] text-gray-600">available</span>
        </div>
      ))}
      {!broker && visible.length > 1 && (
        <div className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-3">
          <span className="text-[11px] uppercase text-gray-500 font-medium tracking-wide">Total</span>
          <span className="text-sm font-mono font-bold text-white">{formatINR(data.combined.available_cash)}</span>
        </div>
      )}
    </div>
  );
}
