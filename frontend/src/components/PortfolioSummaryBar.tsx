import { useEffect, useRef, useState } from "react";
import type { PortfolioSummary } from "../types";

interface Props { summary: PortfolioSummary }

function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
}

function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = to;
    if (from === to) return;
    const dur = 600;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * ease);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);

  return <>{format(display)}</>;
}

export default function PortfolioSummaryBar({ summary }: Props) {
  const isProfit = summary.total_pnl >= 0;
  const cards = [
    { label: "Invested", value: summary.total_invested, format: formatINR },
    { label: "Current Value", value: summary.total_current, format: formatINR },
    {
      label: "Total P&L",
      value: summary.total_pnl,
      format: (n: number) => `${n >= 0 ? "+" : ""}${formatINR(n)}`,
      sub: `${isProfit ? "+" : ""}${summary.total_pnl_percentage}%`,
      color: isProfit,
    },
    { label: "Stocks", value: summary.stock_count, format: (n: number) => String(Math.round(n)) },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <div
          key={c.label}
          className={`glass-card rounded-2xl p-4 animate-fade-in-up stagger-${i + 1}`}
          style={{ animationFillMode: "both" }}
        >
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-2">{c.label}</p>
          <p className={`font-mono text-xl font-bold tabular-nums ${
            c.color !== undefined ? (c.color ? "gradient-text-green" : "gradient-text") : "text-white"
          }`}>
            <AnimatedNumber value={c.value} format={c.format} />
          </p>
          {c.sub && (
            <p className={`text-xs font-mono mt-1 ${c.color ? "text-accent-green/80" : "text-accent-red/80"}`}>{c.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
