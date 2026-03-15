import { Navigate } from "react-router-dom";
import { useAppAuth } from "../lib/AuthContext";
import LoginPage from "../components/LoginPage";

export default function LoginPageRoute() {
  const { isAuthenticated, checking, login } = useAppAuth();

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center noise-bg">
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-accent-red to-accent-orange rounded-2xl opacity-20 blur-xl animate-pulse" />
          <div className="relative font-mono text-lg font-bold text-gray-500 animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage onLogin={login} />;
}
