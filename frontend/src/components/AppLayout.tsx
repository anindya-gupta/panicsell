import { Outlet } from "react-router-dom";
import { useAppAuth } from "../lib/AuthContext";
import { useAuth } from "../hooks/useAuth";
import { useMarketStatus } from "../hooks/useMarketStatus";
import Header from "./Header";

export default function AppLayout() {
  const { logout: appLogout } = useAppAuth();
  const { brokers, loading, login, logout } = useAuth();
  const marketStatus = useMarketStatus();

  return (
    <div className="min-h-screen flex flex-col noise-bg relative">
      <Header
        brokers={brokers}
        loading={loading}
        marketStatus={marketStatus}
        onLogin={login}
        onLogout={logout}
        onAppLogout={appLogout}
      />
      <main className="relative flex-1 z-10">
        <Outlet />
      </main>
    </div>
  );
}
