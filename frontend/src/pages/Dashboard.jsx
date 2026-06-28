import React from "react";
import { VerticalTicker } from "@/components/VerticalTicker";

export default function Dashboard() {
  return (
    <main className="mx-auto max-w-[940px] px-4 pb-20 pt-8">
      {/* All stat sections + news headlines flow through the vertical ticker */}
      <VerticalTicker />

      <p className="wm mt-16 border-t border-border pt-6 text-center text-[12px] leading-relaxed text-muted-foreground">
        Counters are mathematical extrapolations from official baselines (Census,
        Federal Reserve, CDC, USDA, BJS, FBI). They run entirely in your browser
        and estimate — not measure — second-by-second change.
      </p>
    </main>
  );
}
