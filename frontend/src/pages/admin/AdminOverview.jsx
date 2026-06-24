import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Newspaper, MapPin, Inbox, Mail, Users, FileCheck, MessageSquare } from "lucide-react";
import { adminOverview } from "@/lib/adminApi";

const CARDS = [
  { key: "articles", label: "Articles", icon: Newspaper, to: "/admin/articles" },
  { key: "published", label: "Published", icon: FileCheck, to: "/admin/articles" },
  { key: "cold_cases", label: "Cold Cases", icon: MapPin, to: "/admin/cases" },
  { key: "tips_pending", label: "Tips Awaiting Review", icon: Inbox, to: "/admin/tips", alert: true },
  { key: "comments_pending", label: "Comments Awaiting Review", icon: MessageSquare, to: "/admin/comments", alert: true },
  { key: "subscribers", label: "Subscribers", icon: Mail, to: "/admin/audience" },
  { key: "memberships", label: "Members", icon: Users, to: "/admin/audience" },
];

export default function AdminOverview() {
  const { data = {} } = useQuery({ queryKey: ["admin-overview"], queryFn: adminOverview });

  return (
    <div className="p-8 md:p-12" data-testid="admin-overview">
      <p className="overline text-accent">Newsroom</p>
      <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight text-foreground">Overview</h1>
      <p className="mt-2 text-sm text-muted-foreground">A live snapshot of everything in your newsroom.</p>

      <div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            data-testid={`overview-card-${c.key}`}
            className="group bg-card p-7 transition-colors hover:bg-muted"
          >
            <div className="flex items-center justify-between">
              <c.icon className="h-5 w-5 text-accent" />
              {c.alert && data[c.key] > 0 && (
                <span className="bg-accent px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-accent-foreground">Action needed</span>
              )}
            </div>
            <p className="mt-5 font-heading text-5xl font-medium text-foreground">{data[c.key] ?? "—"}</p>
            <p className="overline mt-2 text-muted-foreground">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/admin/articles/new" data-testid="overview-new-article" className="bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent">
          + New article
        </Link>
        <Link to="/admin/cases/new" data-testid="overview-new-case" className="border border-border px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
          + New cold case
        </Link>
      </div>
    </div>
  );
}
