import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { submitTip } from "@/lib/api";

export default function SubmitTip() {
  const [params] = useSearchParams();
  const presetCase = params.get("case") || "";
  const presetName = params.get("name") || "";

  const [form, setForm] = useState({
    case_number: presetCase,
    case_name: presetName,
    name: "",
    contact: "",
    message: "",
    anonymous: false,
  });
  const [done, setDone] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) {
      toast.error("Please describe what you know.");
      return;
    }
    try {
      const res = await submitTip(form);
      setDone(true);
      toast.success(res.message || "Tip received.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const field = "w-full border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-accent";

  return (
    <div className="bg-background" data-testid="submit-tip-page">
      <div className="mx-auto grid max-w-container gap-16 px-6 py-16 md:grid-cols-12 md:px-12 md:py-24">
        <div className="md:col-span-5">
          <p className="overline text-accent">Confidential</p>
          <h1 className="mt-3 font-heading text-5xl font-medium leading-[1.02] tracking-tight text-foreground sm:text-6xl">
            Submit a Tip
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            Information from the community is what keeps these cases alive. Share what you
            know — anonymously if you prefer. Every tip is reviewed by our editorial team
            before any action is taken.
          </p>
          <div className="mt-8 space-y-4">
            {[
              "We never publish a tip without verification and editorial review.",
              "You may submit completely anonymously.",
              "Defamatory or unverified claims are never published.",
            ].map((t) => (
              <div key={t} className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p className="text-sm text-muted-foreground">{t}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 font-mono text-xs text-muted-foreground">
            In immediate danger? Call 911. This form is not monitored in real time.
          </p>
        </div>

        <div className="md:col-span-7">
          {done ? (
            <div data-testid="tip-success" className="border border-border bg-muted p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                <Check className="h-6 w-6 text-accent-foreground" />
              </div>
              <h2 className="mt-6 font-heading text-3xl font-medium text-foreground">Tip received</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Thank you. Our editorial team will review your submission carefully and
                responsibly. Your contribution helps make sure these stories are not forgotten.
              </p>
              <Link to="/cold-cases" className="mt-8 inline-block bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent">
                Return to the database
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} data-testid="tip-form" className="border border-border bg-card p-6 md:p-10">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="overline mb-2 block text-muted-foreground">Case Number</label>
                  <input data-testid="tip-case-number" className={field} value={form.case_number} onChange={(e) => set("case_number", e.target.value)} placeholder="e.g. BUS-2019-0412" />
                </div>
                <div>
                  <label className="overline mb-2 block text-muted-foreground">Case / Person</label>
                  <input data-testid="tip-case-name" className={field} value={form.case_name} onChange={(e) => set("case_name", e.target.value)} placeholder="Name (optional)" />
                </div>
              </div>

              <div className="mt-5">
                <label className="overline mb-2 block text-muted-foreground">What do you know?</label>
                <textarea
                  data-testid="tip-message"
                  required
                  rows={6}
                  className={field + " resize-none"}
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  placeholder="Describe what you saw or know. Include dates, places, and details where you can."
                />
              </div>

              <label className="mt-5 flex items-center gap-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  data-testid="tip-anonymous"
                  checked={form.anonymous}
                  onChange={(e) => set("anonymous", e.target.checked)}
                  className="h-4 w-4 accent-[hsl(var(--accent))]"
                />
                Submit this tip anonymously
              </label>

              {!form.anonymous && (
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="overline mb-2 block text-muted-foreground">Your Name</label>
                    <input data-testid="tip-name" className={field} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Optional" />
                  </div>
                  <div>
                    <label className="overline mb-2 block text-muted-foreground">Contact</label>
                    <input data-testid="tip-contact" className={field} value={form.contact} onChange={(e) => set("contact", e.target.value)} placeholder="Email or phone (optional)" />
                  </div>
                </div>
              )}

              <button type="submit" data-testid="tip-submit-button" className="mt-8 w-full bg-primary px-6 py-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent">
                Submit confidential tip
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
