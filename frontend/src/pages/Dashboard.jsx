import React from "react";
import { Section } from "@/components/Section";
import { useCounters } from "@/context/CountersContext";

export default function Dashboard() {
  const { sections } = useCounters();
  return (
    <main className="mx-auto max-w-[940px] px-4 pb-20 pt-8">
      <div>
        {sections.map((section) => (
          <Section key={section.key} section={section} />
        ))}
      </div>

      <p className="wm mt-16 border-t border-border pt-6 text-center text-[12px] leading-relaxed text-muted-foreground">
        Counters are mathematical extrapolations from official baselines (Census,
        Federal Reserve, CDC, USDA, BJS, FBI). They run entirely in your browser
        and estimate — not measure — second-by-second change.
      </p>
    </main>
  );
}
