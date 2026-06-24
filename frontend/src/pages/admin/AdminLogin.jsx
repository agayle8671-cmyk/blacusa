import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAuth, formatApiError } from "@/lib/auth";

export default function AdminLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@blacusa.com");
  const [password, setPassword] = useState("BlacUSA2026!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user?.role === "admin") return <Navigate to="/admin" replace />;

  const doLogin = async (em, pw) => {
    setError("");
    setBusy(true);
    try {
      const u = await login(em, pw);
      if (u.role !== "admin") {
        setError("This account doesn't have newsroom console access.");
        return;
      }
      navigate("/admin");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    doLogin(email, password);
  };

  const field = "w-full border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent";

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-6" data-testid="admin-login-page">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-heading text-4xl font-semibold tracking-tight text-primary-foreground">
            Blac<span className="text-accent">USA</span>
          </p>
          <p className="overline mt-2 text-primary-foreground/50">Newsroom Console</p>
        </div>
        <form onSubmit={onSubmit} data-testid="admin-login-form" className="border border-primary-foreground/15 bg-background p-8">
          <div className="mb-6 flex items-center gap-2">
            <Lock className="h-4 w-4 text-accent" />
            <h1 className="font-heading text-2xl font-medium text-foreground">Sign in</h1>
          </div>
          {error && (
            <p data-testid="admin-login-error" className="mb-4 border-l-2 border-accent bg-muted px-3 py-2 text-sm text-foreground">{error}</p>
          )}
          <label className="overline mb-2 block text-muted-foreground">Email</label>
          <input data-testid="admin-email" type="email" required className={field} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@blacusa.com" />
          <label className="overline mb-2 mt-4 block text-muted-foreground">Password</label>
          <input data-testid="admin-password" type="password" required className={field} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          <button data-testid="admin-login-submit" type="submit" disabled={busy} className="mt-6 w-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent disabled:opacity-60">
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <button
            type="button"
            data-testid="admin-dev-login"
            disabled={busy}
            onClick={() => doLogin("admin@blacusa.com", "BlacUSA2026!")}
            className="mt-3 w-full border border-dashed border-accent px-6 py-3 text-xs font-medium text-accent transition-colors hover:bg-muted disabled:opacity-60"
          >
            ⚡ Dev quick login (one click)
          </button>
          <p className="mt-3 text-center font-mono text-[0.6rem] text-muted-foreground">
            Development only — credentials are pre-filled. Remove before launch.
          </p>
        </form>
      </div>
    </div>
  );
}
