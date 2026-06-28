import React from "react";
import Marquee from "react-fast-marquee";
import { TICKER_ITEMS } from "@/mock/data";

/* Thin masthead ticker streaming slower-moving secondary data points. */
export const Ticker = () => {
  return (
    <div className="flex items-stretch border-b border-border bg-foreground text-background">
      <div className="wm flex shrink-0 items-center bg-accent px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-accent-foreground">
        Live
      </div>
      <Marquee speed={45} gradient={false} pauseOnHover className="py-1.5">
        {TICKER_ITEMS.map((t, i) => (
          <span key={i} className="wm mx-8 text-[13px]">
            <span className="mr-2 text-accent">▪</span>
            {t}
          </span>
        ))}
      </Marquee>
    </div>
  );
};
