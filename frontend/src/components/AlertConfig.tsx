import { useState, useEffect } from "react";
import { apiFetch } from "../lib/apiFetch";
import type { AlertConfig as AlertConfigType, BrokerStatus } from "../types";

interface Props {
  brokers: BrokerStatus[];
  onClose: () => void;
}

export default function AlertConfig({ brokers, onClose }: Props) {
  const [config, setConfig] = useState<AlertConfigType>({
    enabled: false, email: "", thresholds: {}, baselines: {}, last_triggered: {},
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch("/api/alerts/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    await apiFetch("/api/alerts/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: config.enabled, email: config.email, thresholds: config.thresholds }),
    });
    setSaving(false);
    onClose();
  };

  const connectedBrokers = brokers.filter((b) => b.connected);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative glass-strong rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scale-in border border-white/[0.06]">
        <div className="px-6 py-5 border-b border-white/[0.04]">
          <h2 className="font-mono font-extrabold text-lg">Portfolio Drop Alerts</h2>
          <p className="text-xs text-gray-500 mt-1">Get emailed when a broker's portfolio drops below your threshold</p>
        </div>

        <div className="px-6 py-5 space-y-5">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="w-4 h-4 rounded border-white/10 bg-surface-3 text-accent-red focus:ring-accent-red/50"
            />
            <span className="text-sm group-hover:text-white transition-colors">Enable alerts</span>
          </label>

          <div>
            <label className="text-[11px] text-gray-500 uppercase tracking-wider block mb-2">Email address</label>
            <input
              type="email"
              value={config.email}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
              placeholder="you@gmail.com"
              className="w-full bg-surface-3 border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-red/50 focus:ring-1 focus:ring-accent-red/30 placeholder:text-gray-700 transition-all"
            />
          </div>

          {connectedBrokers.map((b) => (
            <div key={b.broker}>
              <label className="text-[11px] text-gray-500 uppercase tracking-wider block mb-2">
                {b.display_name} drop threshold (%)
              </label>
              <input
                type="number"
                value={config.thresholds[b.broker] ?? -5}
                onChange={(e) =>
                  setConfig({ ...config, thresholds: { ...config.thresholds, [b.broker]: Number(e.target.value) } })
                }
                className="w-full bg-surface-3 border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-accent-red/50 focus:ring-1 focus:ring-accent-red/30 transition-all"
              />
              {config.baselines[b.broker] && (
                <p className="text-[10px] text-gray-600 mt-1 font-mono">
                  Baseline: ₹{config.baselines[b.broker]?.toLocaleString("en-IN")}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-white/[0.04] flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 text-sm rounded-xl bg-surface-3 text-gray-300 hover:bg-surface-4 border border-white/[0.06] transition-all">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="px-6 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-accent-red to-accent-orange text-white shadow-lg shadow-accent-red/20 hover:shadow-accent-red/40 transition-all">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
