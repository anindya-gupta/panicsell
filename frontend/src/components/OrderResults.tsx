import type { SellResponse } from "../types";
import BrokerBadge from "./BrokerBadge";

interface Props {
  result: SellResponse;
  onDismiss: () => void;
}

export default function OrderResults({ result, onDismiss }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onDismiss} />
      <div className="relative glass-strong rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-scale-in border border-white/[0.06]">
        <div className="px-6 py-5 border-b border-white/[0.04]">
          <h2 className="font-mono font-extrabold text-lg">Orders Complete</h2>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-accent-green font-mono font-bold">{result.summary.success} succeeded</span>
            {result.summary.failed > 0 && <span className="text-accent-red font-mono font-bold">{result.summary.failed} failed</span>}
          </div>
        </div>
        <div className="px-6 py-4 max-h-72 overflow-y-auto space-y-2">
          {result.results.map((r, i) => (
            <div
              key={`${r.tradingsymbol}-${i}`}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                r.status === "success"
                  ? "border-accent-green/20 bg-accent-green/[0.04]"
                  : "border-accent-red/20 bg-accent-red/[0.04]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-white">{r.tradingsymbol}</span>
                <span className="text-gray-600 text-xs font-mono">x{r.quantity}</span>
                <BrokerBadge broker={r.broker} />
              </div>
              <div className="text-right">
                {r.status === "success" ? (
                  <div>
                    <span className="text-accent-green text-xs font-bold">SOLD</span>
                    <div className="text-[10px] text-gray-600 font-mono">#{r.order_id}</div>
                  </div>
                ) : (
                  <div>
                    <span className="text-accent-red text-xs font-bold">FAILED</span>
                    <div className="text-[10px] text-gray-600 truncate max-w-[200px]">{r.error}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-white/[0.04] flex justify-end">
          <button onClick={onDismiss} className="px-6 py-2.5 text-sm font-medium rounded-xl bg-surface-3 hover:bg-surface-4 text-gray-200 border border-white/[0.06] transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
