import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/apiFetch";
import type { OrderHistoryItem } from "../types";
import BrokerBadge from "../components/BrokerBadge";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    apiFetch("/api/orders/history")
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d) => setOrders(d.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  return (
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/dashboard" className="text-xs text-gray-600 hover:text-gray-400 transition-colors mb-2 inline-block">&larr; Back to Dashboard</Link>
          <h1 className="text-2xl font-extrabold">Order History</h1>
          <p className="text-sm text-gray-500 mt-1">Today's completed and pending orders across all brokers</p>
        </div>
        <button onClick={fetchOrders} disabled={loading} className="text-sm px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50">
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="font-mono text-gray-600 animate-pulse">Loading orders...</div>
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-gray-500">No orders placed today</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-gray-500 uppercase tracking-wider border-b border-white/[0.04]">
                  <th className="p-4">Stock</th>
                  <th className="p-4">Broker</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-right">Qty</th>
                  <th className="p-4 text-right">Price</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr key={`${o.order_id}-${i}`} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-mono font-bold text-white">{o.tradingsymbol}</td>
                    <td className="p-4"><BrokerBadge broker={o.broker} /></td>
                    <td className="p-4">
                      <span className={`text-xs font-bold ${o.transaction_type === "SELL" ? "text-accent-red" : "text-accent-green"}`}>
                        {o.transaction_type}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono">{o.quantity}</td>
                    <td className="p-4 text-right font-mono text-gray-500">{o.price ? `₹${o.price.toFixed(2)}` : "—"}</td>
                    <td className="p-4"><StatusBadge status={o.status} /></td>
                    <td className="p-4 text-xs text-gray-600 font-mono">{formatTime(o.placed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
