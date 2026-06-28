import React from "react";
import { Hero } from "@/components/Hero";
import { Section } from "@/components/Section";
import { SECTIONS } from "@/mock/data";

export default function Dashboard() {
  return (
    <main className="mx-auto max-w-[980px] px-4 pb-20">
      <Hero />
      <div className="pt-10">
        {SECTIONS.map((section) => (
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
