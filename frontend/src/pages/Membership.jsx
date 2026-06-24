import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Vote, Users, Sprout, X } from "lucide-react";
import { toast } from "sonner";
import { getMembershipTiers, joinMembership } from "@/lib/api";

const PILLARS = [
  { icon: Sprout, title: "Equity, not just access", body: "Co-owners hold a real micro-share in BlacUSA — capital that funds investigations no advertiser will." },
  { icon: Vote, title: "A vote that counts", body: "Members shape coverage priorities. Co-owners vote in newsroom governance at the annual assembly." },
  { icon: Users, title: "Algorithm-proof loyalty", body: "A community that returns by choice — not because a platform decided to show them our work." },
];

function JoinModal({ tier, onClose }) {
  const [form, setForm] = useState({ name: "", email: "" });
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await joinMembership({ tier: tier.name, name: form.name, email: form.email });
      setDone(true);
      toast.success(res.message || "Welcome to BlacUSA.");
    } catch {
      toast.error("Something went wrong.");
    }
  };

  const field = "w-full border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-accent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" data-testid="join-modal" onClick={onClose}>
      <div className="w-full max-w-md border border-border bg-background p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="overline text-accent">{tier.name}</p>
            <h3 className="mt-2 font-heading text-3xl font-medium text-foreground">
              {tier.price === 0 ? "Join free" : `$${tier.price} / ${tier.cadence}`}
            </h3>
          </div>
          <button data-testid="join-modal-close" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        {done ? (
          <div data-testid="join-success" className="mt-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent"><Check className="h-5 w-5 text-accent-foreground" /></div>
            <p className="mt-4 font-heading text-2xl text-foreground">You're in.</p>
            <p className="mt-2 text-sm text-muted-foreground">Welcome to the co-op. We'll be in touch at {form.email}.</p>
            <button onClick={onClose} className="mt-6 w-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-accent">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <input data-testid="join-name" required className={field} placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input data-testid="join-email" required type="email" className={field} placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <button type="submit" data-testid="join-submit" className="w-full bg-primary px-6 py-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent">
              {tier.price === 0 ? "Create free account" : `Continue — $${tier.price}`}
            </button>
            <p className="text-center font-mono text-[0.65rem] text-muted-foreground">Payment is illustrative in this preview.</p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Membership() {
  const { data: tiers = [] } = useQuery({ queryKey: ["tiers"], queryFn: getMembershipTiers });
  const [selected, setSelected] = useState(null);

  return (
    <div className="bg-background" data-testid="membership-page">
      {/* Hero */}
      <section className="grain border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-container px-6 py-20 md:px-12 md:py-28">
          <p className="overline text-accent">The Digital News Co-op</p>
          <h1 className="mt-4 max-w-3xl font-heading text-5xl font-medium leading-[1.0] tracking-tight sm:text-7xl">
            Own the newsroom you've been waiting for.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/70">
            BlacUSA is built as a co-operative. Instead of chasing viral pageviews, we build
            equity with the people we serve. Members fund the work; co-owners hold a share
            and a vote. Together, we build journalism that no algorithm can erase.
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-container px-6 py-20 md:px-12">
        <div className="grid gap-10 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="border-t border-foreground pt-6">
              <p.icon className="h-6 w-6 text-accent" />
              <h3 className="mt-4 font-heading text-2xl font-medium text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tiers */}
      <section className="mx-auto max-w-container px-6 pb-24 md:px-12">
        <div className="mb-12 border-b border-foreground pb-4">
          <p className="overline text-accent">Choose your stake</p>
          <h2 className="mt-2 font-heading text-4xl font-medium tracking-tight text-foreground">Membership</h2>
        </div>
        <div className="grid gap-px border border-border bg-border md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.key}
              data-testid={`tier-${t.key}`}
              className={`flex flex-col bg-card p-8 ${t.highlight ? "ring-2 ring-inset ring-accent" : ""}`}
            >
              {t.highlight && <span className="mb-4 inline-block w-fit bg-accent px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-accent-foreground">Most popular</span>}
              <h3 className="font-heading text-3xl font-medium text-foreground">{t.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-heading text-5xl font-medium text-foreground">${t.price}</span>
                <span className="text-sm text-muted-foreground">/ {t.cadence}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {f}
                  </li>
                ))}
              </ul>
              <button
                data-testid={`tier-join-${t.key}`}
                onClick={() => setSelected(t)}
                className={`mt-8 px-6 py-3.5 text-sm font-medium transition-colors ${
                  t.highlight ? "bg-accent text-accent-foreground hover:opacity-90" : "bg-primary text-primary-foreground hover:bg-accent"
                }`}
              >
                {t.price === 0 ? "Join free" : `Join as ${t.name}`}
              </button>
            </div>
          ))}
        </div>
      </section>

      {selected && <JoinModal tier={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
