import React from "react";
import { useOdometer } from "@/hooks/useOdometer";
import { useCounters } from "@/context/CountersContext";

/* Hero — the flagship giant ticking counter (mirrors Worldometer's masthead). */
export const Hero = () => {
  const { hero } = useCounters();
  const ref = useOdometer({
    baselineValue: hero.baselineValue,
    baselineTimestamp: hero.baselineTimestamp,
    annualRate: hero.annualRate,
  });

  return (
    <div className="wm border-b border-border py-10 text-center" data-testid="hero">
      <p className="text-[15px] text-muted-foreground">{hero.caption}</p>
      <div
        ref={ref}
        className="tnums mt-2 text-[44px] font-bold leading-none text-foreground sm:text-[64px]"
      >
        0
      </div>
      <p className="mx-auto mt-3 max-w-2xl px-4 text-[13px] leading-relaxed text-muted-foreground">
        {hero.source}
      </p>
    </div>
  );
};
