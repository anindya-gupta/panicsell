import type { BrokerStatus, MarketStatus } from "../types";

interface HeaderProps {
  brokers: BrokerStatus[];
  loading: boolean;
  marketStatus: MarketStatus | null;
  onLogin: (broker: string) => void;
  onLogout: (broker: string) => void;
}

export default function Header({ brokers, loading, marketStatus, onLogin, onLogout }: HeaderProps) {
  return (
    <header className="glass-strong sticky top-0 z-50 border-b border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent-red to-accent-orange rounded-xl opacity-40 group-hover:opacity-70 blur transition-opacity duration-300" />
            <div className="relative w-9 h-9 bg-surface-1 rounded-xl flex items-center justify-center border border-white/10">
              <span className="font-mono text-sm font-extrabold gradient-text">PS</span>
            </div>
          </div>
          <h1 className="text-lg font-bold tracking-tight">
            PANIC<span className="gradient-text">SELL</span>
          </h1>
          {marketStatus && <MarketBadge status={marketStatus} />}
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-8 w-32 bg-surface-3 rounded-lg animate-pulse" />
          ) : (
            brokers.map((b) =>
              b.connected ? (
                <div
                  key={b.broker}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg glass-card group/chip"
                >
                  <span className={`w-2 h-2 rounded-full animate-pulse ${b.broker === "zerodha" ? "bg-zerodha" : "bg-groww"}`} />
                  <span className="text-xs text-gray-400">{b.display_name}</span>
                  <span className="text-xs font-medium text-gray-200 font-mono">{b.user_name || b.user_id}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onLogout(b.broker); }}
                    className="ml-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-gray-600 hover:text-accent-red hover:bg-accent-red/10 border border-transparent hover:border-accent-red/20 opacity-0 group-hover/chip:opacity-100 transition-all duration-200"
                  >
                    Disconnect
                  </button>
                </div>
              ) : b.coming_soon ? (
                <div key={b.broker} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 opacity-40">
                  <span className="text-xs text-gray-600">{b.display_name}</span>
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-surface-3 text-gray-600">SOON</span>
                </div>
              ) : (
                <button
                  key={b.broker}
                  onClick={() => onLogin(b.broker)}
                  className="text-xs font-medium px-4 py-2 rounded-lg bg-surface-3 hover:bg-surface-4 text-gray-300 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
                >
                  Connect {b.display_name}
                </button>
              )
            )
          )}
        </div>
      </div>
    </header>
  );
}

function MarketBadge({ status }: { status: MarketStatus }) {
  const isOpen = status.is_open;
  return (
    <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-surface-2 border border-white/[0.04]">
      <span className="relative flex h-2 w-2">
        {isOpen && <span className="absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75 animate-ping" />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${isOpen ? "bg-accent-green" : "bg-accent-red"}`} />
      </span>
      <span className="text-[11px] font-medium text-gray-400">
        {isOpen ? "Market Open" : status.reason}
      </span>
    </div>
  );
}
