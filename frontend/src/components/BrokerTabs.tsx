import type { BrokerStatus, Holding } from "../types";

interface Props {
  connectedBrokers: BrokerStatus[];
  active: string;
  holdings: Holding[];
  onChange: (tab: string) => void;
}

export default function BrokerTabs({ connectedBrokers, active, holdings, onChange }: Props) {
  const counts: Record<string, number> = { all: holdings.length };
  for (const b of connectedBrokers) {
    counts[b.broker] = holdings.filter((h) => h.broker === b.broker).length;
  }

  const tabs = [
    { key: "all", label: "All Brokers", color: "white" },
    ...connectedBrokers.map((b) => ({
      key: b.broker,
      label: b.display_name,
      color: b.broker === "zerodha" ? "zerodha" : "groww",
    })),
  ];

  return (
    <div className="flex gap-1.5 p-1 glass rounded-2xl">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        const dotColor = tab.key === "zerodha" ? "bg-zerodha" : tab.key === "groww" ? "bg-groww" : "";

        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              isActive
                ? "bg-surface-3 text-white shadow-lg shadow-black/20 border border-white/[0.08]"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
            }`}
          >
            {tab.key !== "all" && <span className={`w-2 h-2 rounded-full ${dotColor} ${isActive ? "animate-pulse" : "opacity-50"}`} />}
            {tab.label}
            <span className={`font-mono text-xs tabular-nums ${isActive ? "text-gray-300" : "text-gray-600"}`}>
              {counts[tab.key] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
