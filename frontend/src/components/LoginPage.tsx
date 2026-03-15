import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  onLogin: (username: string, password: string) => Promise<string | null>;
}

export default function LoginPage({ onLogin }: Props) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = await onLogin(username, password);
    if (err) {
      setError(err);
    } else {
      navigate("/dashboard", { replace: true });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center noise-bg relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-accent-red/[0.04] rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-accent-orange/[0.03] rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
      </div>

      <div className="relative w-full max-w-sm mx-4 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="relative group inline-block mb-6">
            <div className="absolute -inset-3 bg-gradient-to-r from-accent-red to-accent-orange rounded-3xl opacity-30 blur-xl group-hover:opacity-50 transition-opacity duration-500" />
            <div className="relative w-20 h-20 bg-surface-1 rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl">
              <span className="font-mono text-3xl font-extrabold gradient-text">PS</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold mb-2">
            PANIC<span className="gradient-text">SELL</span>
          </h1>
          <p className="text-sm text-gray-500">Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-strong rounded-2xl border border-white/[0.06] p-6 space-y-5">
          {error && (
            <div className="bg-accent-red/10 border border-accent-red/20 rounded-xl px-4 py-3 text-sm text-accent-red animate-scale-in">
              {error}
            </div>
          )}

          <div>
            <label className="text-[11px] text-gray-500 uppercase tracking-wider block mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
              className="w-full bg-surface-3 border border-white/[0.06] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-red/50 focus:ring-1 focus:ring-accent-red/30 placeholder:text-gray-700 transition-all"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="text-[11px] text-gray-500 uppercase tracking-wider block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full bg-surface-3 border border-white/[0.06] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-red/50 focus:ring-1 focus:ring-accent-red/30 placeholder:text-gray-700 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-accent-red to-accent-orange shadow-lg shadow-accent-red/20 hover:shadow-accent-red/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-gray-700 mt-6">
          Multi-broker stock liquidation tool
        </p>
      </div>
    </div>
  );
}
