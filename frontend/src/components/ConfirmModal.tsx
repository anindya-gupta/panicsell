import { useState } from "react";
import type { Holding } from "../types";
import BrokerBadge from "./BrokerBadge";

interface Props {
  mode: "selected" | "broker" | "all";
  brokerName?: string;
  holdings: Holding[];
  isAmo: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ mode, brokerName, holdings, isAmo, onConfirm, onCancel }: Props) {
  const [typedText, setTypedText] = useState("");

  const confirmPhrase =
    mode === "all" ? "SELL EVERYTHING" :
    mode === "broker" ? `SELL ${(brokerName || "").toUpperCase()}` : "";
  const needsTyping = mode !== "selected";
  const canConfirm = needsTyping ? typedText === confirmPhrase : true;
  const totalValue = holdings.reduce((sum, h) => sum + h.last_price * h.total_quantity, 0);

  const title =
    mode === "all" ? "CONFIRM: SELL EVERYTHING" :
    mode === "broker" ? `CONFIRM: SELL ALL ${(brokerName || "").toUpperCase()}` :
    "Confirm Sell Selected";

  const subtitle =
    mode === "all" ? "This will liquidate ALL holdings across ALL connected brokers." :
    mode === "broker" ? `This will sell all holdings in your ${brokerName} account.` :
    `You are about to sell ${holdings.length} stock${holdings.length !== 1 ? "s" : ""}.`;

  const severity = mode === "all" ? "from-accent-red/20 to-accent-orange/20 border-accent-red/30" : mode === "broker" ? "from-accent-red/10 to-surface-2 border-accent-red/20" : "from-amber-500/10 to-surface-2 border-amber-500/20";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onCancel} />
      <div className="relative glass-strong rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-scale-in border border-white/[0.06]">
        <div className={`px-6 py-5 border-b border-white/[0.06] bg-gradient-to-r ${severity}`}>
          <h2 className="font-mono font-extrabold text-lg">{title}</h2>
          <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          {isAmo && <p className="text-xs text-amber-400/80 mt-1">Orders will be queued as AMO for next market opening.</p>}
        </div>

        <div className="px-6 py-4 max-h-60 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-500 border-b border-white/[0.04]">
                <th className="text-left pb-2">Stock</th>
                <th className="text-left pb-2">Broker</th>
                <th className="text-right pb-2">Qty</th>
                <th className="text-right pb-2">~Value</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <tr key={`${h.broker}:${h.tradingsymbol}`} className="border-b border-white/[0.02]">
                  <td className="py-2.5 font-mono font-bold text-white">{h.tradingsymbol}</td>
                  <td className="py-2.5"><BrokerBadge broker={h.broker} /></td>
                  <td className="py-2.5 text-right font-mono text-gray-400">{h.total_quantity}</td>
                  <td className="py-2.5 text-right font-mono text-gray-400">
                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(h.last_price * h.total_quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-white/[0.04] bg-surface-2/50">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Estimated total</span>
            <span className="font-mono font-extrabold text-white">
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(totalValue)}
            </span>
          </div>
        </div>

        {needsTyping && (
          <div className="px-6 py-4 border-t border-white/[0.04]">
            <label className="text-sm text-gray-400 block mb-2">
              Type <span className="font-mono text-accent-red font-extrabold">{confirmPhrase}</span> to confirm
            </label>
            <input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value.toUpperCase())}
              placeholder={confirmPhrase}
              className="w-full bg-surface-3 border border-white/[0.06] rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-accent-red/50 focus:ring-1 focus:ring-accent-red/30 placeholder:text-gray-700 transition-all"
              autoFocus
            />
          </div>
        )}

        <div className="px-6 py-4 border-t border-white/[0.04] flex gap-3 justify-end">
          <button onClick={onCancel} className="px-5 py-2.5 text-sm rounded-xl bg-surface-3 text-gray-300 hover:bg-surface-4 border border-white/[0.06] transition-all">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
              canConfirm
                ? "bg-gradient-to-r from-accent-red to-accent-orange text-white shadow-lg shadow-accent-red/20 hover:shadow-accent-red/40"
                : "bg-surface-3 text-gray-600 cursor-not-allowed"
            }`}
          >
            {mode === "all" ? "SELL EVERYTHING" : mode === "broker" ? `SELL ALL ${(brokerName || "").toUpperCase()}` : `Sell ${holdings.length} Stock${holdings.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
