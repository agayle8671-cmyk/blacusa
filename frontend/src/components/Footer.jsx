import React from "react";
import { useCounters } from "@/context/CountersContext";

export const Footer = () => {
  const { sections: SECTIONS } = useCounters();
  const go = (key) => {
    const el = document.getElementById(key);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="border-t border-border bg-foreground text-background">
      <div className="mx-auto max-w-[980px] px-4 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="wm flex items-baseline text-[24px] font-light">
              <span>blac</span>
              <span className="font-semibold text-accent">usa</span>
            </div>
            <p className="wm mt-3 text-[13px] leading-relaxed text-background/70">
              A real-time demographic and civic tracker for Black America —
              raw data, surfaced with dignity. Algorithm-proof, source-anchored.
            </p>
          </div>

          <div>
            <p className="overline mb-3 text-background/50">Sections</p>
            <ul className="wm space-y-2">
              {SECTIONS.map((s) => (
                <li key={s.key}>
                  <button
                    onClick={() => go(s.key)}
                    className="text-[14px] text-background/80 transition-colors hover:text-accent"
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="max-w-xs">
            <p className="overline mb-3 text-background/50">Data Sources</p>
            <p className="wm text-[13px] leading-relaxed text-background/70">
              U.S. Census Bureau · Federal Reserve (SCF) · CDC NCHS · USDA Census
              of Agriculture · Bureau of Justice Statistics · FBI UCR · Pew
              Research · Selig Center.
            </p>
          </div>
        </div>

        <div className="wm mt-10 border-t border-background/20 pt-6 text-[12px] text-background/50">
          © {new Date().getFullYear()} BlacUSA. Figures are 2022–2024 baselines,
          extrapolated client-side. For illustration and awareness.
        </div>
      </div>
    </footer>
  );
};
