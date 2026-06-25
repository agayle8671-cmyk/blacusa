import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin } from "lucide-react";
import { getArticles, getColdCases, getColdCaseStats } from "@/lib/api";
import axios from "axios";
import { API } from "@/lib/api";
import { ArticleCard } from "@/components/ArticleCard";
import { NewsletterBand } from "@/components/Newsletter";
import { StatusBadge } from "@/components/CaseRow";

const SectionHead = ({ overline, title, to, cta }) => (
  <div className="mb-10 flex items-end justify-between gap-6 border-b border-foreground pb-4">
    <div>
      {overline && <p className="overline text-accent">{overline}</p>}
      <h2 className="mt-2 font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
    </div>
    {to && (
      <Link to={to} className="group hidden shrink-0 items-center gap-1.5 text-sm font-medium text-foreground hover:text-accent sm:flex">
        {cta} <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
    )}
  </div>
);

export default function Home() {
  const { data: homepage } = useQuery({ queryKey: ["homepage"], queryFn: () => axios.get(`${API}/homepage`).then((r) => r.data) });
  const { data: solutions } = useQuery({ queryKey: ["solutions-home"], queryFn: () => getArticles({ solutions: true }) });
  const { data: cases } = useQuery({ queryKey: ["cases-home"], queryFn: () => getColdCases() });
  const { data: stats } = useQuery({ queryKey: ["case-stats"], queryFn: getColdCaseStats });

  const isHomepageObj = homepage && typeof homepage === "object";
  const lead = isHomepageObj ? homepage.lead : null;
  const secondary = isHomepageObj && Array.isArray(homepage.also_leading) ? homepage.also_leading : [];
  const latestRest = isHomepageObj && Array.isArray(homepage.latest) ? homepage.latest : [];
  const spotlightCases = Array.isArray(cases) ? cases.filter((c) => c.status !== "Solved").slice(0, 4) : [];

  return (
    <div className="bg-background">
      {/* Masthead statement */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-container px-6 py-10 md:px-12">
          <p className="overline mb-4 text-accent">Algorithm-proof journalism &middot; Built for loyal change-seekers</p>
          <p className="max-w-4xl font-heading text-2xl italic leading-snug text-muted-foreground sm:text-3xl">
            “The stories that shape Black America — reported with context, owned by
            community, and built to outlast the algorithm.”
          </p>
        </div>
      </section>

      {/* Lead bento */}
      <section className="mx-auto max-w-container px-6 py-14 md:px-12 md:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">{lead && <ArticleCard article={lead} variant="feature" />}</div>
          <div className="flex flex-col gap-6 lg:col-span-4 lg:border-l lg:border-border lg:pl-8">
            <p className="overline text-muted-foreground">Also Leading</p>
            {secondary.map((a) => (
              <ArticleCard key={a.slug} article={a} variant="compact" />
            ))}
          </div>
        </div>
      </section>

      {/* Latest grid */}
      <section className="mx-auto max-w-container px-6 pb-20 md:px-12">
        <SectionHead overline="The Desk" title="Latest Reporting" to="/category/politics" cta="All stories" />
        <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {latestRest.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      </section>

      {/* Solutions band */}
      <section className="grain border-y border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-container px-6 py-20 md:px-12 md:py-28">
          <div className="mb-12 max-w-2xl">
            <p className="overline text-accent">Solutions Journalism</p>
            <h2 className="mt-4 font-heading text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl">
              We don't just report the problem. We report who's solving it.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-primary-foreground/70">
              Rigorous reporting on how communities and institutions respond to systemic
              challenges — the kind of journalism that energizes rather than exhausts.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {(Array.isArray(solutions) ? solutions : []).slice(0, 3).map((a) => (
              <Link
                key={a.slug}
                to={`/article/${a.slug}`}
                data-testid={`solutions-card-${a.slug}`}
                className="group flex flex-col border-t border-primary-foreground/25 pt-6"
              >
                <span className="overline text-accent">{(a.category || "").replace("-", " ")}</span>
                <h3 className="mt-3 font-heading text-2xl font-medium leading-tight tracking-tight transition-colors group-hover:text-accent">
                  {a.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-primary-foreground/65 line-clamp-3">{a.dek}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary-foreground/90 group-hover:text-accent">
                  Read <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cold case spotlight */}
      <section className="mx-auto max-w-container px-6 py-20 md:px-12 md:py-28">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="overline text-accent">A Public Service</p>
            <h2 className="mt-4 font-heading text-4xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-5xl">
              The Cold Case &amp; Missing Persons Database
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              Homicides involving Black victims are solved far less often, and missing
              persons of color receive a fraction of the coverage. This is our standing
              correction — a dignified, searchable public record.
            </p>
            {stats && (
              <div className="mt-8 grid grid-cols-3 gap-px border border-border bg-border">
                {[
                  { k: "Tracked", v: stats.total },
                  { k: "Open", v: stats.open },
                  { k: "Cold", v: stats.cold },
                ].map((s) => (
                  <div key={s.k} className="bg-card px-4 py-6 text-center">
                    <p className="font-heading text-4xl font-medium text-foreground">{s.v}</p>
                    <p className="overline mt-1 text-muted-foreground">{s.k}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/cold-cases"
                data-testid="home-explore-cases"
                className="bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent"
              >
                Explore the database
              </Link>
              <Link
                to="/submit-tip"
                data-testid="home-submit-tip"
                className="border border-border px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Submit a tip
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="border border-border bg-muted">
              {spotlightCases.map((c) => (
                <Link
                  key={c.case_number}
                  to={`/cold-cases/${c.case_number}`}
                  data-testid={`spotlight-case-${c.case_number}`}
                  className="group flex items-center justify-between gap-4 border-b border-border px-5 py-5 transition-colors last:border-b-0 hover:bg-card"
                >
                  <div className="flex items-center gap-4">
                    <MapPin className="h-4 w-4 shrink-0 text-accent" />
                    <div>
                      <p className="font-heading text-xl font-medium leading-tight tracking-tight text-foreground group-hover:text-accent">
                        {c.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {c.case_type} &middot; {c.city}, {c.state}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              ))}
            </div>
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              Cases are published with family consent and reported under trauma-informed guidelines.
            </p>
          </div>
        </div>
      </section>

      {/* Membership CTA */}
      <section className="grain border-y border-border bg-accent text-accent-foreground">
        <div className="mx-auto flex max-w-container flex-col items-start gap-8 px-6 py-20 md:flex-row md:items-center md:justify-between md:px-12">
          <div className="max-w-2xl">
            <p className="overline text-accent-foreground/70">The Digital News Co-op</p>
            <h2 className="mt-4 font-heading text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl">
              Don't just read the newsroom. Own a piece of it.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-accent-foreground/80">
              Members and co-owners fund reporting that no algorithm can erase — and get a
              real vote in how this newsroom is run.
            </p>
          </div>
          <Link
            to="/membership"
            data-testid="home-membership-cta"
            className="shrink-0 bg-accent-foreground px-8 py-4 text-sm font-medium text-accent transition-transform hover:-translate-y-0.5"
          >
            See membership
          </Link>
        </div>
      </section>

      <NewsletterBand />
    </div>
  );
}
