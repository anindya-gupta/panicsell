import type { Holding } from "../types";
import BrokerBadge from "./BrokerBadge";

interface Props {
  holdings: Holding[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onToggleAll: () => void;
}

function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2,
  }).format(n);
}

function holdingKey(h: Holding): string {
  return `${h.broker}:${h.tradingsymbol}`;
}

export default function HoldingsTable({ holdings, selected, onToggle, onToggleAll }: Props) {
  const allSelected = holdings.length > 0 && selected.size === holdings.length;
  const someSelected = selected.size > 0 && selected.size < holdings.length;

  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.15s", animationFillMode: "both" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.04] text-left text-[11px] text-gray-500 uppercase tracking-wider">
              <th className="p-4 w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={onToggleAll}
                  className="w-4 h-4 rounded border-white/10 bg-surface-3 text-accent-red focus:ring-accent-red/50 focus:ring-offset-0 cursor-pointer"
                />
              </th>
              <th className="p-4">Stock</th>
              <th className="p-4">Broker</th>
              <th className="p-4 text-right">Qty</th>
              <th className="p-4 text-right">Avg</th>
              <th className="p-4 text-right">LTP</th>
              <th className="p-4 text-right">P&L</th>
              <th className="p-4 text-right">P&L %</th>
              <th className="p-4 text-right">Day</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, i) => {
              const key = holdingKey(h);
              const isProfit = h.pnl >= 0;
              const isDayUp = h.day_change >= 0;
              const isChecked = selected.has(key);

              return (
                <tr
                  key={key}
                  onClick={() => onToggle(key)}
                  className={`group cursor-pointer transition-all duration-200 border-b border-white/[0.02] animate-fade-in ${
                    isChecked
                      ? "bg-accent-red/[0.06] hover:bg-accent-red/[0.1]"
                      : "hover:bg-white/[0.02]"
                  }`}
                  style={{ animationDelay: `${i * 30}ms`, animationFillMode: "both" }}
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggle(key)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-white/10 bg-surface-3 text-accent-red focus:ring-accent-red/50 focus:ring-offset-0 cursor-pointer"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white group-hover:text-accent-cyan transition-colors duration-200">
                        {h.tradingsymbol}
                      </span>
                      {h.is_t1 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          T1
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-600 mt-0.5">{h.exchange}</div>
                  </td>
                  <td className="p-4"><BrokerBadge broker={h.broker} /></td>
                  <td className="p-4 text-right font-mono font-medium">
                    {h.total_quantity}
                    {h.t1_quantity > 0 && h.quantity > 0 && (
                      <div className="text-[10px] text-gray-600">{h.quantity}+{h.t1_quantity}</div>
                    )}
                  </td>
                  <td className="p-4 text-right font-mono text-gray-500">{formatINR(h.average_price)}</td>
                  <td className="p-4 text-right font-mono font-medium text-white">{formatINR(h.last_price)}</td>
                  <td className="p-4 text-right">
                    <span className={`font-mono font-bold ${isProfit ? "text-accent-green" : "text-accent-red"}`}>
                      {isProfit ? "+" : ""}{formatINR(h.pnl)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`inline-flex items-center gap-1 font-mono text-xs font-medium px-2 py-0.5 rounded-md ${
                      isProfit ? "bg-accent-green/10 text-accent-green" : "bg-accent-red/10 text-accent-red"
                    }`}>
                      {isProfit ? "+" : ""}{h.pnl_percentage}%
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`font-mono text-xs ${isDayUp ? "text-accent-green/70" : "text-accent-red/70"}`}>
                      {isDayUp ? "+" : ""}{h.day_change_percentage}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {holdings.length === 0 && (
        <div className="p-16 text-center">
          <div className="text-gray-600 text-sm">No holdings found</div>
          <div className="text-gray-700 text-xs mt-1">Connect a broker to see your portfolio</div>
        </div>
      )}
    </div>
  );
}

export { holdingKey };
