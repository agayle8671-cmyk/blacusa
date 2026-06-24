import { NavLink, Outlet, Navigate, useNavigate, Link } from "react-router-dom";
import { LayoutDashboard, Newspaper, MapPin, Inbox, Users, LogOut, ExternalLink, MessageSquare, Layout as LayoutIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";

const LINKS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/homepage", label: "Front Page", icon: LayoutIcon },
  { to: "/admin/articles", label: "Articles", icon: Newspaper },
  { to: "/admin/cases", label: "Cold Cases", icon: MapPin },
  { to: "/admin/tips", label: "Tip Queue", icon: Inbox },
  { to: "/admin/comments", label: "Comments", icon: MessageSquare },
  { to: "/admin/audience", label: "Audience", icon: Users },
];

export default function AdminLayout() {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center bg-background font-mono text-sm text-muted-foreground">Loading console…</div>;
  }
  if (!user || user.role !== "admin") return <Navigate to="/admin/login" replace />;

  return (
    <div className="flex min-h-screen bg-background" data-testid="admin-layout">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-primary text-primary-foreground">
        <div className="border-b border-primary-foreground/15 px-6 py-6">
          <Link to="/admin" className="font-heading text-2xl font-semibold tracking-tight">
            Blac<span className="text-accent">USA</span>
          </Link>
          <p className="overline mt-1 text-primary-foreground/40">Console</p>
        </div>
        <nav className="flex-1 px-3 py-4">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              data-testid={`admin-nav-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                  isActive ? "bg-accent text-accent-foreground" : "text-primary-foreground/75 hover:bg-primary-foreground/10"
                }`
              }
            >
              <l.icon className="h-4 w-4" /> {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-primary-foreground/15 p-3">
          <a href="/" target="_blank" rel="noreferrer" className="mb-1 flex items-center gap-3 px-3 py-2.5 text-sm text-primary-foreground/60 hover:text-primary-foreground">
            <ExternalLink className="h-4 w-4" /> View site
          </a>
          <button
            data-testid="admin-logout"
            onClick={() => { logout(); navigate("/admin/login"); }}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-primary-foreground/75 hover:bg-primary-foreground/10"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
          <p className="px-3 pt-3 font-mono text-[0.65rem] text-primary-foreground/40">{user.email}</p>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
