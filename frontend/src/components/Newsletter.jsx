import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { subscribe } from "@/lib/api";

export const NewsletterInline = ({ variant = "dark" }) => {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const dark = variant === "dark";

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      const res = await subscribe({ email });
      setDone(true);
      toast.success(res.message || "You're subscribed.");
    } catch (err) {
      toast.error("Something went wrong. Try again.");
    }
  };

  if (done) {
    return (
      <p
        data-testid="newsletter-success"
        className={`flex items-center gap-2 text-sm ${dark ? "text-primary-foreground/80" : "text-foreground"}`}
      >
        <Check className="h-4 w-4 text-accent" /> You're on the list.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} data-testid="newsletter-inline-form" className="flex">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        data-testid="newsletter-inline-email"
        className={`min-w-0 flex-1 border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-accent ${
          dark
            ? "border-primary-foreground/25 bg-transparent text-primary-foreground placeholder:text-primary-foreground/40"
            : "border-border bg-card text-foreground placeholder:text-muted-foreground"
        }`}
      />
      <button
        type="submit"
        data-testid="newsletter-inline-submit"
        aria-label="Subscribe"
        className="flex items-center justify-center bg-accent px-3 text-accent-foreground transition-colors hover:opacity-90"
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
};

export const NewsletterBand = () => {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      const res = await subscribe({ email });
      setDone(true);
      toast.success(res.message || "You're subscribed.");
    } catch {
      toast.error("Something went wrong.");
    }
  };

  return (
    <section className="border-y border-border bg-muted" data-testid="newsletter-band">
      <div className="mx-auto grid max-w-container items-center gap-10 px-6 py-20 md:grid-cols-2 md:px-12">
        <div>
          <p className="overline text-accent">The Brief</p>
          <h2 className="mt-4 font-heading text-4xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            News that leaves you energized, not exhausted.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Each week we send the reporting algorithms bury: solutions, accountability,
            and the cold cases that deserve your attention. No noise. No doomscroll.
          </p>
        </div>
        <div className="md:pl-10">
          {done ? (
            <div data-testid="newsletter-band-success" className="flex items-center gap-3 border border-border bg-card p-6">
              <Check className="h-5 w-5 text-accent" />
              <span className="text-foreground">You're subscribed. Welcome to the work.</span>
            </div>
          ) : (
            <form onSubmit={onSubmit} data-testid="newsletter-band-form" className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                data-testid="newsletter-band-email"
                className="flex-1 border border-border bg-card px-4 py-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-accent"
              />
              <button
                type="submit"
                data-testid="newsletter-band-submit"
                className="bg-primary px-7 py-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent"
              >
                Subscribe
              </button>
            </form>
          )}
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            We honor PIPEDA &amp; CCPA. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
};
