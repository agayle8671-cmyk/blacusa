import { Link } from "react-router-dom";
import { NewsletterInline } from "@/components/Newsletter";

const COLS = [
  {
    title: "Sections",
    links: [
      { to: "/category/politics", label: "Politics" },
      { to: "/category/health-equity", label: "Health Equity" },
      { to: "/category/criminal-justice", label: "Criminal Justice" },
      { to: "/category/environmental-racism", label: "Environmental Racism" },
      { to: "/category/solutions", label: "Solutions Journalism" },
      { to: "/category/rural", label: "Rural & The Black Belt" },
    ],
  },
  {
    title: "Civic Tools",
    links: [
      { to: "/cold-cases", label: "Cold Case Database" },
      { to: "/submit-tip", label: "Submit a Tip" },
      { to: "/about", label: "Editorial Standards" },
    ],
  },
  {
    title: "The Co-op",
    links: [
      { to: "/membership", label: "Become a Member" },
      { to: "/membership", label: "Become a Co-Owner" },
      { to: "/about", label: "Our Mission" },
    ],
  },
];

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground" data-testid="footer">
      <div className="mx-auto max-w-container px-6 py-16 md:px-12 md:py-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Link to="/" className="font-heading text-4xl font-semibold tracking-tight">
              Blac<span className="text-accent">USA</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
              Journalism with context, community, and consequence — built for and with
              Black America. Algorithm-proof by design.
            </p>
            <p className="mt-6 font-mono text-xs uppercase tracking-widest text-primary-foreground/50">
              Ajax, Ontario &middot; Reporting on the United States
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-5">
            {COLS.map((col) => (
              <div key={col.title}>
                <h4 className="overline mb-4 text-primary-foreground/50">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((l, i) => (
                    <li key={i}>
                      <Link
                        to={l.to}
                        className="text-sm text-primary-foreground/80 transition-colors hover:text-accent"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="md:col-span-3">
            <h4 className="overline mb-4 text-primary-foreground/50">The Brief</h4>
            <p className="mb-4 text-sm text-primary-foreground/70">
              Solutions, not doomscroll. Once a week.
            </p>
            <NewsletterInline variant="dark" />
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-primary-foreground/15 pt-8 text-xs text-primary-foreground/50 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} BlacUSA. A digital news co-operative.</p>
          <div className="flex flex-wrap gap-6">
            <span>Privacy (PIPEDA / CCPA)</span>
            <span>Do Not Sell or Share My Personal Information</span>
            <span>Terms of Use</span>
            <Link to="/admin/login" className="transition-colors hover:text-accent">Newsroom Console</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
