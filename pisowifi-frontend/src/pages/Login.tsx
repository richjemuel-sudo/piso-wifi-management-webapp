import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in — send them where they were headed, or to the dashboard.
  if (user) {
    const from = (location.state as any)?.from?.pathname ?? "/";
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      await login(username.trim(), password);
      navigate((location.state as any)?.from?.pathname ?? "/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-navy-800 px-8 py-10">
        <div className="flex flex-col items-center">
            <img 
            src="/logo.png" alt="Richly Connected" className="h-25 w-auto rounded-lg bg-navy p-2" 
            />
          <h1 className="mt-4 text-lg font-size:2px font-semibold">Please Login</h1>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
          <label className="relative block">
            <span className="sr-only">Username</span>
            <User
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-600"
              aria-hidden="true"
            />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              placeholder="Username"
              className="w-full rounded-full bg-white py-3 pl-11 pr-4 text-sm text-navy-900 placeholder:text-navy-600 outline-none focus:ring-2 focus:ring-accent-cyan"
            />
          </label>

          <label className="relative block">
            <span className="sr-only">Password</span>
            <Lock
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-600"
              aria-hidden="true"
            />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="Password"
              className="w-full rounded-full bg-white py-3 pl-11 pr-12 text-sm text-navy-900 placeholder:text-navy-600 outline-none focus:ring-2 focus:ring-accent-cyan"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-600 transition hover:text-navy-900"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </label>

          {error && (
            <p role="alert" className="px-1 text-xs text-accent-red">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 flex items-center justify-center gap-2 rounded-full bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {busy ? "Signing in…" : "Login"}
          </button>

          <button
            type="button"
            className="self-start px-1 pt-1 text-xs font-medium text-content-secondary transition hover:text-content-primary"
          >
            Forgot Password?
          </button>
        </form>
      </div>
    </div>
  );
}
