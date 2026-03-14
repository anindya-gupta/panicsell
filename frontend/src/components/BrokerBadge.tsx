const STYLES: Record<string, string> = {
  zerodha: "bg-zerodha/15 text-zerodha-light border-zerodha/20",
  groww: "bg-groww/15 text-groww-light border-groww/20",
};

export default function BrokerBadge({ broker }: { broker: string }) {
  const style = STYLES[broker] || "bg-surface-3 text-gray-400 border-white/10";
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${style}`}>
      {broker.charAt(0).toUpperCase() + broker.slice(1)}
    </span>
  );
}
