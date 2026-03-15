import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import PortfolioSummaryBar from "../components/PortfolioSummaryBar";
import FundsBar from "../components/FundsBar";
import HoldingsTable, { holdingKey } from "../components/HoldingsTable";
import BrokerTabs from "../components/BrokerTabs";
import SellButtons from "../components/SellButtons";
import ConfirmModal from "../components/ConfirmModal";
import OrderResults from "../components/OrderResults";
import OrderHistory from "../components/OrderHistory";
import { useAuth } from "../hooks/useAuth";
import { usePortfolio } from "../hooks/usePortfolio";
import { usePanicSell } from "../hooks/usePanicSell";
import { useMarketStatus } from "../hooks/useMarketStatus";
import { usePolling } from "../hooks/usePolling";
import type { Holding, PortfolioSummary } from "../types";

type ConfirmMode = { type: "selected" } | { type: "broker"; broker: string } | { type: "all" } | null;

function computeSummary(list: Holding[]): PortfolioSummary {
  const totalInvested = list.reduce((s, h) => s + h.average_price * h.total_quantity, 0);
  const totalCurrent = list.reduce((s, h) => s + h.last_price * h.total_quantity, 0);
  const totalPnl = totalCurrent - totalInvested;
  return {
    total_invested: totalInvested,
    total_current: totalCurrent,
    total_pnl: totalPnl,
    total_pnl_percentage: totalInvested > 0 ? Math.round((totalPnl / totalInvested) * 10000) / 100 : 0,
    stock_count: list.length,
  };
}

export default function DashboardPage() {
  const { brokers, loading: authLoading, anyConnected, login, refresh: refreshAuth } = useAuth();
  const { holdings, summary, loading: portfolioLoading, error: portfolioError, fetchHoldings } = usePortfolio();
  const { selling, result, error: sellError, executeSell, reset: resetSell } = usePanicSell();
  const marketStatus = useMarketStatus();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [brokerFilter, setBrokerFilter] = useState<string>("all");

  const filteredHoldings = useMemo(
    () => brokerFilter === "all" ? holdings : holdings.filter((h) => h.broker === brokerFilter),
    [holdings, brokerFilter],
  );

  const filteredSummary = useMemo(
    () => brokerFilter === "all" ? summary : computeSummary(filteredHoldings),
    [brokerFilter, summary, filteredHoldings],
  );

  const refreshAll = useCallback(() => { fetchHoldings(); }, [fetchHoldings]);

  usePolling(marketStatus, anyConnected, refreshAll);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    if (connected) {
      window.history.replaceState({}, "", "/dashboard");
      refreshAuth();
    }
  }, [refreshAuth]);

  useEffect(() => {
    if (anyConnected) fetchHoldings();
  }, [anyConnected, fetchHoldings]);

  const toggleStock = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === filteredHoldings.length) return new Set();
      return new Set(filteredHoldings.map((h) => holdingKey(h)));
    });
  }, [filteredHoldings]);

  const isAmo = marketStatus ? !marketStatus.is_open : false;

  const handleConfirm = async () => {
    const variety = isAmo ? "amo" : "regular";
    let symbols: string[] | undefined;
    let broker: string | undefined;

    if (confirmMode?.type === "selected") {
      symbols = filteredHoldings
        .filter((h) => selected.has(holdingKey(h)))
        .map((h) => h.tradingsymbol);
      if (brokerFilter !== "all") broker = brokerFilter;
    } else if (confirmMode?.type === "broker") {
      broker = confirmMode.broker;
    }

    setConfirmMode(null);
    const res = await executeSell(symbols, broker, variety);
    if (res) {
      setSelected(new Set());
      fetchHoldings();
    }
  };

  const getConfirmHoldings = (): Holding[] => {
    if (!confirmMode) return [];
    if (confirmMode.type === "selected") {
      return filteredHoldings.filter((h) => selected.has(holdingKey(h)));
    }
    if (confirmMode.type === "broker") {
      return holdings.filter((h) => h.broker === confirmMode.broker);
    }
    return holdings;
  };

  const connectedBrokers = brokers.filter((b) => b.connected);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-accent-red to-accent-orange rounded-2xl opacity-20 blur-xl animate-pulse" />
          <div className="relative font-mono text-lg font-bold text-gray-500 animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {!anyConnected ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-red/[0.04] rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-accent-orange/[0.03] rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
          </div>

          <div className="relative group animate-fade-in-up mb-8" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
            <div className="absolute -inset-3 bg-gradient-to-r from-accent-red to-accent-orange rounded-3xl opacity-30 blur-xl group-hover:opacity-50 transition-opacity duration-500" />
            <div className="relative w-24 h-24 bg-surface-1 rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl">
              <span className="font-mono text-4xl font-extrabold gradient-text">PS</span>
            </div>
          </div>

          <h2 className="text-4xl font-extrabold mb-4 animate-fade-in-up" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
            Welcome to <span className="gradient-text">PanicSell</span>
          </h2>
          <p className="text-gray-500 max-w-lg mb-10 text-lg leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
            Connect your broker accounts to view your portfolio and sell stocks instantly when markets move against you.
          </p>
          <div className="flex gap-4 animate-fade-in-up" style={{ animationDelay: "0.4s", animationFillMode: "both" }}>
            {brokers.map((b) =>
              b.coming_soon ? (
                <div key={b.broker} className="flex flex-col items-center gap-2">
                  <button disabled className="glass-card px-6 py-3.5 rounded-xl text-gray-600 font-medium cursor-not-allowed">
                    {b.display_name}
                  </button>
                  <span className="text-[10px] text-gray-700 font-medium">Coming Soon</span>
                </div>
              ) : (
                <button
                  key={b.broker}
                  onClick={() => login(b.broker)}
                  className={`relative group px-8 py-3.5 rounded-xl font-semibold text-white transition-all duration-300 ${
                    b.broker === "zerodha"
                      ? "bg-zerodha hover:bg-zerodha-light shadow-lg shadow-zerodha/20 hover:shadow-zerodha/40"
                      : "bg-groww hover:bg-groww-light shadow-lg shadow-groww/20 hover:shadow-groww/40"
                  }`}
                >
                  Connect {b.display_name}
                </button>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Your Portfolio</h2>
              <p className="text-sm text-gray-500 mt-1">
                {portfolioLoading ? "Fetching latest data..." : `${filteredHoldings.length} holding${filteredHoldings.length !== 1 ? "s" : ""}${brokerFilter === "all" ? ` across ${connectedBrokers.length} broker${connectedBrokers.length !== 1 ? "s" : ""}` : ""}`}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={refreshAll} disabled={portfolioLoading} className="text-sm px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50">
                {portfolioLoading ? "Refreshing..." : "Refresh"}
              </button>
              <Link to="/orders" className="text-sm px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors text-center">
                Orders
              </Link>
              <Link to="/alerts" className="text-sm px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors text-center">
                Alerts
              </Link>
            </div>
          </div>

          {connectedBrokers.length > 1 && (
            <BrokerTabs
              connectedBrokers={connectedBrokers}
              active={brokerFilter}
              holdings={holdings}
              onChange={(tab) => { setBrokerFilter(tab); setSelected(new Set()); }}
            />
          )}

          {portfolioError && (
            <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 text-sm text-red-300">{portfolioError}</div>
          )}
          {sellError && (
            <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 text-sm text-red-300">Sell error: {sellError}</div>
          )}

          <FundsBar broker={brokerFilter === "all" ? undefined : brokerFilter} />

          {filteredSummary && <PortfolioSummaryBar summary={filteredSummary} />}

          <HoldingsTable holdings={filteredHoldings} selected={selected} onToggle={toggleStock} onToggleAll={toggleAll} />

          {filteredHoldings.length > 0 && (
            <SellButtons
              selectedCount={selected.size}
              connectedBrokers={brokerFilter === "all" ? connectedBrokers : connectedBrokers.filter((b) => b.broker === brokerFilter)}
              marketStatus={marketStatus}
              selling={selling}
              onSellSelected={() => setConfirmMode({ type: "selected" })}
              onSellBroker={(b) => setConfirmMode({ type: "broker", broker: b })}
              onSellAll={() => setConfirmMode({ type: "all" })}
            />
          )}

          <OrderHistory broker={brokerFilter === "all" ? undefined : brokerFilter} />
        </div>
      )}

      {confirmMode && (
        <ConfirmModal
          mode={confirmMode.type === "broker" ? "broker" : confirmMode.type}
          brokerName={confirmMode.type === "broker" ? confirmMode.broker : undefined}
          holdings={getConfirmHoldings()}
          isAmo={isAmo}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmMode(null)}
        />
      )}

      {result && <OrderResults result={result} onDismiss={resetSell} />}
    </div>
  );
}
