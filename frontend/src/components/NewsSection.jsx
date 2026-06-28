/**
 * NewsSection — renders the "News Outlets" section of the dashboard.
 *
 * Uses useHeadlines() to fetch live, scraped headlines from the backend
 * independently of the counters context. Each row shows:
 *
 *   [ Source Name ]   Headline text…   [time]  [↗]  [+]
 *
 * Fallback rows show the outlet name while headlines are loading.
 * A "Refresh" button lets the user manually re-fetch at any time.
 */

import React, { useState } from "react";
import { TrendingUp } from "lucide-react";
import { useHeadlines } from "@/hooks/useHeadlines";
import { hasInsight } from "@/mock/insights";
import { SpotlightDialog } from "@/components/SpotlightDialog";

// The 25 news outlets in display order — static config, no network needed
const OUTLETS = [
  { slug: "nyt-subs",          name: "The New York Times" },
  { slug: "fox-news-prime",    name: "Fox News Channel" },
  { slug: "cnn-visits-today",  name: "CNN" },
  { slug: "msnbc-prime",       name: "MSNBC" },
  { slug: "abc-evening-news",  name: "ABC News" },
  { slug: "nbc-nightly-news",  name: "NBC News" },
  { slug: "cbs-evening-news",  name: "CBS News" },
  { slug: "wsj-subs",          name: "The Wall Street Journal" },
  { slug: "wapo-subs",         name: "The Washington Post" },
  { slug: "usa-today-visits",  name: "USA Today" },
  { slug: "yahoo-news-visits", name: "Yahoo News" },
  { slug: "msn-news-visits",   name: "MSN News" },
  { slug: "pbs-trust",         name: "PBS NewsHour" },
  { slug: "npr-listeners",     name: "NPR" },
  { slug: "univision-viewers", name: "Univision" },
  { slug: "telemundo-viewers", name: "Telemundo" },
  { slug: "bbc-news-visits",   name: "BBC News" },
  { slug: "guardian-us-visits",name: "The Guardian" },
  { slug: "reuters-visits",    name: "Reuters" },
  { slug: "ap-visits",         name: "Associated Press" },
  { slug: "ny-post-visits",    name: "New York Post" },
  { slug: "huffpost-visits",   name: "HuffPost" },
  { slug: "bloomberg-visits",  name: "Bloomberg" },
  { slug: "cnbc-visits",       name: "CNBC" },
  { slug: "newsweek-visits",   name: "Newsweek" },
];

function HeadlineRow({ outlet, headlineData }) {
  const [open, setOpen] = useState(false);
  const [spotOpen, setSpotOpen] = useState(false);
  const showSpotlight = hasInsight(outlet.slug);
  const hasHeadline = headlineData && headlineData.headline;

  return (
    <div className="wm" data-testid={`row-${outlet.slug}`}>
      <div className="flex items-start">
        {/* Source name cell — left 44 %, bold, right-aligned */}
        <div className="w-[44%] shrink-0 border-b border-border pr-5 pb-2 pt-2 text-right text-[15px] font-bold leading-tight text-foreground">
          <span className="tnums">{outlet.name}</span>
        </div>

        {/* Headline cell — right, flex-1 */}
        <div className="flex flex-1 items-start justify-between pl-5 pt-2">
          <p className="text-[15px] leading-snug text-foreground">
            {hasHeadline ? (
              <>
                {/* Headline text */}
                <span className={headlineData.keyword_matched ? "" : "opacity-80"}>
                  {headlineData.headline}
                </span>

                {/* Clickable "Read" link */}
                {headlineData.url && (
                  <>
                    {" "}
                    <a
                      href={headlineData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="wm-link font-bold underline hover:text-accent"
                      aria-label={`Read article from ${outlet.name}`}
                    >
                      Read ↗
                    </a>
                  </>
                )}

                {/* Relative timestamp */}
                {headlineData.relative_time && (
                  <span className="ml-2 text-xs italic text-muted-foreground">
                    {headlineData.relative_time}
                  </span>
                )}
              </>
            ) : (
              // Loading skeleton placeholder
              <span className="inline-block animate-pulse rounded bg-muted/40 text-transparent select-none">
                Loading latest headline…
              </span>
            )}
          </p>

          <div className="ml-3 mt-0.5 flex shrink-0 items-center gap-2">
            {showSpotlight && (
              <button
                type="button"
                onClick={() => setSpotOpen(true)}
                aria-label="Open disparity spotlight"
                title="Disparity Spotlight — trend & comparison"
                data-testid={`spotlight-btn-${outlet.slug}`}
                className="text-accent/70 transition-colors hover:text-accent"
              >
                <TrendingUp size={15} strokeWidth={2.25} />
              </button>
            )}
            {hasHeadline && headlineData.url && (
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label="Toggle source details"
                data-testid={`expand-${outlet.slug}`}
                className="font-mono text-[13px] leading-5 text-[#bdbdbd] transition-colors hover:text-foreground"
              >
                {open ? "[–]" : "[+]"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded detail panel */}
      {open && hasHeadline && (
        <div className="ml-[44%] animate-fade-in pl-5">
          <p className="border-l-2 border-accent bg-muted/60 px-4 py-2 text-[13px] leading-relaxed text-muted-foreground">
            <strong>{outlet.name}</strong>
            {headlineData.pub_date && (
              <span className="ml-2 text-xs opacity-70">
                · Published: {headlineData.pub_date}
              </span>
            )}
          </p>
        </div>
      )}

      {showSpotlight && (
        <SpotlightDialog
          open={spotOpen}
          onOpenChange={setSpotOpen}
          slug={outlet.slug}
          fallbackTitle={outlet.name}
        />
      )}
    </div>
  );
}

export function NewsSection() {
  const { headlines, loading, lastUpdated } = useHeadlines();

  return (
    <section
      className="mt-12"
      data-testid="section-news-outlets"
      id="news-outlets"
    >
      {/* Section header */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="wm wm-section text-[19px] font-normal uppercase tracking-[0.02em]">
          News Outlets
        </h2>
      </div>

      {/* Rows */}
      <div>
        {OUTLETS.map((outlet) => (
          <HeadlineRow
            key={outlet.slug}
            outlet={outlet}
            headlineData={headlines[outlet.slug] || null}
          />
        ))}
      </div>
    </section>
  );
}

