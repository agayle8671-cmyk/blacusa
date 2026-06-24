import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Search, User, LogOut } from "lucide-react";
import { BreakingTicker } from "@/components/BreakingTicker";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useAuth } from "@/lib/auth";

const NAV = [
  { to: "/category/politics", label: "Politics" },
  { to: "/category/health-equity", label: "Health Equity" },
  { to: "/category/criminal-justice", label: "Justice" },
  { to: "/category/environmental-racism", label: "Environment" },
  { to: "/category/solutions", label: "Solutions" },
  { to: "/cold-cases", label: "Cold Cases", accent: true },
];

export const Header = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40">
      <BreakingTicker />
      <div className="border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-container items-center justify-between gap-6 px-6 py-4 md:px-12">
          <div className="flex items-center gap-4">
            <Link to="/" data-testid="logo-link" className="group flex items-baseline gap-1">
              <span className="font-heading text-3xl font-semibold leading-none tracking-tight text-foreground">
                Blac
              </span>
              <span className="font-heading text-3xl font-semibold leading-none tracking-tight text-accent">
                USA
              </span>
            </Link>
            <span className="hidden border-l border-border pl-4 font-mono text-[0.6rem] uppercase leading-tight tracking-[0.18em] text-muted-foreground xl:block">
              Algorithm-proof news<br />for Black America
            </span>
          </div>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={`nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={({ isActive }) =>
                  `relative text-sm font-medium transition-colors hover:text-accent ${
                    isActive ? "text-accent" : n.accent ? "text-foreground" : "text-foreground/80"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              data-testid="header-search-button"
              onClick={() => navigate("/cold-cases")}
              aria-label="Search the record"
              className="hidden h-9 w-9 items-center justify-center border border-border transition-colors hover:bg-muted sm:flex"
            >
              <Search className="h-4 w-4" />
            </button>
            <ThemeSwitcher />
            {user && user.role ? (
              <div className="hidden items-center gap-2 sm:flex">
                <span data-testid="header-account-name" className="flex items-center gap-1.5 border border-border px-3 py-2 text-sm font-medium text-foreground">
                  <User className="h-4 w-4 text-accent" /> {user.name?.split(" ")[0] || "Account"}
                </span>
                <button
                  data-testid="header-signout"
                  onClick={() => { logout(); navigate("/"); }}
                  aria-label="Sign out"
                  className="flex h-9 w-9 items-center justify-center border border-border transition-colors hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/account"
                data-testid="header-signin"
                className="hidden border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:inline-block"
              >
                Sign in
              </Link>
            )}
            <Link
              to="/membership"
              data-testid="header-join-button"
              className="hidden bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent sm:inline-block"
            >
              Become a Member
            </Link>
            <button
              data-testid="mobile-menu-button"
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
              className="flex h-9 w-9 items-center justify-center border border-border lg:hidden"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-border bg-background lg:hidden" data-testid="mobile-menu">
            <nav className="mx-auto flex max-w-container flex-col px-6 py-2">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="border-b border-border py-3 text-sm font-medium text-foreground"
                >
                  {n.label}
                </Link>
              ))}
              <Link
                to="/membership"
                onClick={() => setOpen(false)}
                className="mt-3 bg-primary px-5 py-3 text-center text-sm font-medium text-primary-foreground"
              >
                Become a Member
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
