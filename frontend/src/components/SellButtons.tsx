import type { BrokerStatus, MarketStatus } from "../types";

interface Props {
  selectedCount: number;
  connectedBrokers: BrokerStatus[];
  marketStatus: MarketStatus | null;
  selling: boolean;
  onSellSelected: () => void;
  onSellBroker: (broker: string) => void;
  onSellAll: () => void;
}

export default function SellButtons({
  selectedCount, connectedBrokers, marketStatus, selling,
  onSellSelected, onSellBroker, onSellAll,
}: Props) {
  const isAmo = marketStatus ? !marketStatus.is_open : false;
  const amoLabel = isAmo ? " (AMO)" : "";

  return (
    <div className="space-y-3 pt-2 animate-fade-in-up" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
      {isAmo && (
        <div className="glass-card rounded-xl p-3 flex items-center gap-3 border-amber-500/20">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs text-amber-300/80">
            Market is closed. Orders will be queued as AMO for the next opening.
          </span>
        </div>
      )}

      <button
        onClick={onSellSelected}
        disabled={selectedCount === 0 || selling}
        className="w-full py-3.5 px-6 rounded-xl text-sm font-semibold border border-amber-500/30 text-amber-400 hover:bg-amber-500/[0.06] hover:border-amber-500/50 transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
      >
        {selling ? "Processing..." : `Sell Selected (${selectedCount})${amoLabel}`}
      </button>

      {connectedBrokers.length > 0 && (
        <div className="flex gap-3">
          {connectedBrokers.map((b) => (
            <button
              key={b.broker}
              onClick={() => onSellBroker(b.broker)}
              disabled={selling}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold border border-accent-red/30 text-accent-red/80 hover:bg-accent-red/[0.06] hover:border-accent-red/50 transition-all duration-200 disabled:opacity-30"
            >
              {selling ? "Processing..." : `Panic Sell ${b.display_name}${amoLabel}`}
            </button>
          ))}
        </div>
      )}

      {connectedBrokers.length > 0 && (
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-red via-accent-orange to-accent-red rounded-2xl opacity-50 group-hover:opacity-80 blur-sm transition-opacity duration-300 animate-glow-pulse" />
          <button
            onClick={onSellAll}
            disabled={selling}
            className="relative w-full py-4 px-6 rounded-xl text-sm font-extrabold bg-gradient-to-r from-accent-red to-accent-orange text-white shadow-2xl shadow-accent-red/20 hover:shadow-accent-red/40 transition-all duration-300 disabled:opacity-50 uppercase tracking-widest"
          >
            {selling ? "SELLING EVERYTHING..." : `MEGA PANIC SELL ALL${amoLabel}`}
          </button>
        </div>
      )}
    </div>
  );
}
