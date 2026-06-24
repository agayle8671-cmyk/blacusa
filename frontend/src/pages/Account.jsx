import { useState } from "react";
import { useNavigate, useSearchParams, Link, Navigate } from "react-router-dom";
import { useAuth, formatApiError } from "@/lib/auth";

export default function Account() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const from = params.get("from") || "/";
  const [mode, setMode] = useState(params.get("mode") === "join" ? "register" : "signin");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate(from);
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent";

  return (
    <div className="bg-background" data-testid="account-page">
      <div className="mx-auto grid max-w-container gap-16 px-6 py-16 md:grid-cols-2 md:px-12 md:py-24">
        <div className="hidden md:block">
          <p className="overline text-accent">Join the community</p>
          <h1 className="mt-4 font-heading text-5xl font-medium leading-[1.0] tracking-tight text-foreground">
            Your name carries weight here.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            BlacUSA readers comment under verified identities. It keeps our conversations
            honest, accountable, and worthy of the stories they respond to.
          </p>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <div className="mb-6 flex border border-border">
            <button data-testid="account-tab-signin" onClick={() => setMode("signin")} className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === "signin" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}>
              Sign in
            </button>
            <button data-testid="account-tab-register" onClick={() => setMode("register")} className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === "register" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}>
              Create account
            </button>
          </div>

          <form onSubmit={onSubmit} data-testid="account-form" className="border border-border bg-card p-8">
            {error && <p data-testid="account-error" className="mb-4 border-l-2 border-accent bg-muted px-3 py-2 text-sm text-foreground">{error}</p>}
            {mode === "register" && (
              <>
                <label className="overline mb-2 block text-muted-foreground">Name</label>
                <input data-testid="account-name" required className={field} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="How you'll appear in comments" />
              </>
            )}
            <label className="overline mb-2 mt-4 block text-muted-foreground first:mt-0">Email</label>
            <input data-testid="account-email" type="email" required className={field} value={form.email} onChange={(e) => set("email", e.target.value)} />
            <label className="overline mb-2 mt-4 block text-muted-foreground">Password</label>
            <input data-testid="account-password" type="password" required className={field} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder={mode === "register" ? "At least 8 characters" : "••••••••"} />
            <button type="submit" disabled={busy} data-testid="account-submit" className="mt-6 w-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent disabled:opacity-60">
              {busy ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}
            </button>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              {mode === "register" ? "Already a member? " : "New here? "}
              <button type="button" onClick={() => setMode(mode === "register" ? "signin" : "register")} className="font-medium text-accent hover:underline">
                {mode === "register" ? "Sign in" : "Create an account"}
              </button>
            </p>
          </form>
          <p className="mt-4 text-center"><Link to="/" className="text-xs text-muted-foreground hover:text-accent">← Back to BlacUSA</Link></p>
        </div>
      </div>
    </div>
  );
}
