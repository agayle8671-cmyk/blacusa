import React, { useState } from "react";
import { ChevronDown, Languages, Menu, X } from "lucide-react";
import { SECTIONS } from "@/mock/data";

/* Worldometer-style clean white header with two-tone wordmark. */
export const Header = () => {
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (key) => {
    setMoreOpen(false);
    setMobileOpen(false);
    const el = document.getElementById(key);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-[60px] max-w-[980px] items-center justify-between px-4">
        {/* Wordmark */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="wm flex items-baseline text-[26px] font-light tracking-tight"
          data-testid="logo"
        >
          <span className="text-foreground">blac</span>
          <span className="font-semibold text-accent">usa</span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <button
            onClick={() => go("demographics")}
            className="wm text-[15px] text-foreground transition-colors hover:text-accent"
            data-testid="nav-population"
          >
            Population
          </button>

          <div className="relative">
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className="wm flex items-center gap-1 border border-border px-3 py-1.5 text-[15px] text-foreground transition-colors hover:bg-muted"
              data-testid="nav-more"
            >
              More <ChevronDown size={15} />
            </button>
            {moreOpen && (
              <div className="absolute right-0 mt-1 w-64 border border-border bg-card shadow-lg">
                {SECTIONS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => go(s.key)}
                    className="wm block w-full px-4 py-2.5 text-left text-[14px] text-foreground transition-colors hover:bg-muted"
                    data-testid={`more-${s.key}`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="wm flex items-center gap-1.5 text-[15px] text-foreground">
            <Languages size={16} /> English
          </div>
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
          data-testid="mobile-toggle"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-card md:hidden">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => go(s.key)}
              className="wm block w-full border-b border-border px-4 py-3 text-left text-[15px] text-foreground"
            >
              {s.title}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
