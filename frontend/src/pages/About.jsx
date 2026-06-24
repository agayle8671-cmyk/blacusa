import { Link } from "react-router-dom";
import { Heart, ShieldCheck, Scale, Eye } from "lucide-react";

const STANDARDS = [
  { icon: Heart, title: "Solutions, not despair", body: "We report rigorously on how communities respond to problems — journalism that energizes civic action instead of fueling fatigue." },
  { icon: ShieldCheck, title: "Trauma-informed always", body: "Survivors and families get true informed consent and agency over how they're represented. No mugshot sensationalism. No clichés like 'closure.'" },
  { icon: Scale, title: "Person-first language", body: "We describe people as people. Stigmatizing labels have no place in our reporting, and content warnings precede difficult material." },
  { icon: Eye, title: "Accountable moderation", body: "Community tips and comments are reviewed before publication. We act quickly to remove harmful content — there is no safe harbor for defamation." },
];

const BEATS = ["Politics", "Health Equity", "Criminal Justice", "Environmental Racism", "Solutions", "Rural & The Black Belt"];

export default function About() {
  return (
    <div className="bg-background" data-testid="about-page">
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-container px-6 py-20 md:px-12 md:py-28">
          <p className="overline text-accent">Our Mission</p>
          <h1 className="mt-4 max-w-4xl font-heading text-5xl font-medium leading-[1.0] tracking-tight text-foreground sm:text-7xl">
            Black America deserves a newsroom that listens first, and answers to its readers.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Black Americans own barely two to three percent of commercial broadcast stations
            while making up thirteen percent of the country. BlacUSA exists to close that gap —
            not by chasing scale, but by building deep trust, civic utility, and shared
            ownership with the communities we cover.
          </p>
        </div>
      </section>

      {/* Two columns intro */}
      <section className="mx-auto max-w-container px-6 py-20 md:px-12">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              A hybrid model, built to last
            </h2>
            <div className="mt-6 space-y-5 text-lg leading-[1.8] text-foreground">
              <p>
                We combine the monetization sophistication of commercial media with the
                community trust and solutions focus of the best nonprofit newsrooms. We report
                from Ajax, Ontario, with our lens fixed firmly on the United States.
              </p>
              <p>
                Our newsgathering begins with reciprocal community listening: we co-construct
                stories with the people they affect, surfacing the systemic accountability they
                seek and the practical guidance they need to navigate daily life.
              </p>
            </div>
          </div>
          <div className="lg:col-span-5 lg:border-l lg:border-border lg:pl-10">
            <p className="overline text-muted-foreground">The beats we cover</p>
            <ul className="mt-5 divide-y divide-border">
              {BEATS.map((b) => (
                <li key={b} className="flex items-center justify-between py-3.5">
                  <span className="font-heading text-2xl font-medium text-foreground">{b}</span>
                  <span className="font-mono text-xs text-muted-foreground">→</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Standards */}
      <section className="grain border-y border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-container px-6 py-20 md:px-12 md:py-28">
          <div className="mb-12 max-w-2xl">
            <p className="overline text-accent">Editorial Standards</p>
            <h2 className="mt-4 font-heading text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl">
              The ethics that govern every story we publish.
            </h2>
          </div>
          <div className="grid gap-10 md:grid-cols-2">
            {STANDARDS.map((s) => (
              <div key={s.title} className="flex gap-5 border-t border-primary-foreground/20 pt-6">
                <s.icon className="h-7 w-7 shrink-0 text-accent" />
                <div>
                  <h3 className="font-heading text-2xl font-medium">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-primary-foreground/70">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-container px-6 py-24 text-center md:px-12">
        <h2 className="mx-auto max-w-3xl font-heading text-4xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          This newsroom belongs to the community it serves.
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/membership" data-testid="about-join-cta" className="bg-primary px-7 py-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent">
            Become a co-owner
          </Link>
          <Link to="/cold-cases" data-testid="about-cases-cta" className="border border-border px-7 py-4 text-sm font-medium text-foreground transition-colors hover:bg-muted">
            Explore the Cold Case database
          </Link>
        </div>
      </section>
    </div>
  );
}
