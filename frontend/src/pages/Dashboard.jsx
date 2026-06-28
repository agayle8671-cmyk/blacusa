import React from "react";
import { Section } from "@/components/Section";
import { NewsSection } from "@/components/NewsSection";
import { useCounters } from "@/context/CountersContext";

export default function Dashboard() {
  const { sections } = useCounters();

  // Separate news-outlets out so it renders through the dedicated
  // headline pipeline (NewsSection) instead of the generic counters path.
  const otherSections = sections.filter((s) => s.key !== "news-outlets");

  return (
    <main className="mx-auto max-w-[940px] px-4 pb-20 pt-8">
      <div>
        {otherSections.map((section) => (
          <Section key={section.key} section={section} />
        ))}

        {/* News Outlets — self-contained, fetches /api/headlines directly */}
        <NewsSection />
      </div>

      <p className="wm mt-16 border-t border-border pt-6 text-center text-[12px] leading-relaxed text-muted-foreground">
        Counters are mathematical extrapolations from official baselines (Census,
        Federal Reserve, CDC, USDA, BJS, FBI). They run entirely in your browser
        and estimate — not measure — second-by-second change.
      </p>
    </main>
  );
}
