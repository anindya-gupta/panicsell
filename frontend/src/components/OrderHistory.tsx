import { useState, useEffect } from "react";
import { apiFetch } from "../lib/apiFetch";
import type { OrderHistoryItem } from "../types";
import BrokerBadge from "./BrokerBadge";

export default function OrderHistory({ broker }: { broker?: string }) {
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = () => {
    setLoading(true);
    apiFetch("/api/orders/history")
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d) => setOrders(d.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const visible = broker ? orders.filter((o) => o.broker === broker) : orders;
  if (visible.length === 0 && !loading) return null;

  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.25s", animationFillMode: "both" }}>
      <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-300">Today's Orders</h3>
        <button onClick={fetchOrders} disabled={loading} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-gray-500 uppercase tracking-wider border-b border-white/[0.04]">
              <th className="p-3">Stock</th>
              <th className="p-3">Broker</th>
              <th className="p-3">Type</th>
              <th className="p-3 text-right">Qty</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3">Status</th>
              <th className="p-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((o, i) => (
              <tr key={`${o.order_id}-${i}`} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                <td className="p-3 font-mono font-bold text-white">{o.tradingsymbol}</td>
                <td className="p-3"><BrokerBadge broker={o.broker} /></td>
                <td className="p-3">
                  <span className={`text-xs font-bold ${o.transaction_type === "SELL" ? "text-accent-red" : "text-accent-green"}`}>
                    {o.transaction_type}
                  </span>
                </td>
                <td className="p-3 text-right font-mono">{o.quantity}</td>
                <td className="p-3 text-right font-mono text-gray-500">{o.price ? `₹${o.price.toFixed(2)}` : "—"}</td>
                <td className="p-3"><StatusBadge status={o.status} /></td>
                <td className="p-3 text-xs text-gray-600 font-mono">{formatTime(o.placed_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const style =
    s === "COMPLETE" ? "bg-accent-green/10 text-accent-green border-accent-green/20" :
    s === "REJECTED" ? "bg-accent-red/10 text-accent-red border-accent-red/20" :
    "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${style}`}>{s}</span>;
}

function formatTime(ts: string): string {
  if (!ts) return "—";
  try { return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ts; }
}
