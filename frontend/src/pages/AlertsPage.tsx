import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/apiFetch";
import { useAuth } from "../hooks/useAuth";
import type { AlertConfig } from "../types";

export default function AlertsPage() {
  const { brokers } = useAuth();
  const connectedBrokers = brokers.filter((b) => b.connected);

  const [config, setConfig] = useState<AlertConfig>({
    enabled: false, email: "", thresholds: {}, baselines: {}, last_triggered: {},
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch("/api/alerts/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    await apiFetch("/api/alerts/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: config.enabled, email: config.email, thresholds: config.thresholds }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [config]);

  return (
    <div className="max-w-lg w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/dashboard" className="text-xs text-gray-600 hover:text-gray-400 transition-colors mb-2 inline-block">&larr; Back to Dashboard</Link>
      <h1 className="text-2xl font-extrabold mb-1">Portfolio Drop Alerts</h1>
      <p className="text-sm text-gray-500 mb-8">Get emailed when a broker's portfolio drops below your threshold</p>

      <div className="glass-card rounded-2xl border border-white/[0.06] p-6 space-y-6 animate-fade-in-up">
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
            className="w-full bg-surface-3 border border-white/[0.06] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-red/50 focus:ring-1 focus:ring-accent-red/30 placeholder:text-gray-700 transition-all"
          />
        </div>

        {connectedBrokers.length === 0 ? (
          <p className="text-sm text-gray-600">Connect a broker first to configure thresholds</p>
        ) : (
          connectedBrokers.map((b) => (
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
                className="w-full bg-surface-3 border border-white/[0.06] rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-accent-red/50 focus:ring-1 focus:ring-accent-red/30 transition-all"
              />
              {config.baselines[b.broker] && (
                <p className="text-[10px] text-gray-600 mt-1 font-mono">
                  Baseline: ₹{config.baselines[b.broker]?.toLocaleString("en-IN")}
                </p>
              )}
            </div>
          ))
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Link to="/dashboard" className="px-5 py-2.5 text-sm rounded-xl bg-surface-3 text-gray-300 hover:bg-surface-4 border border-white/[0.06] transition-all text-center">
            Cancel
          </Link>
          <button onClick={save} disabled={saving} className="px-6 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-accent-red to-accent-orange text-white shadow-lg shadow-accent-red/20 hover:shadow-accent-red/40 transition-all disabled:opacity-50">
            {saving ? "Saving..." : saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
