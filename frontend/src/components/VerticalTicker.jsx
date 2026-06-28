/**
 * VerticalTicker — GPU-accelerated, continuously scrolling stats feed.
 *
 * Architecture:
 * - All stat sections + news headlines are flattened into a sequential stream.
 * - The content is rendered twice (original "a" + clone "b") in a tall inner track.
 * - A requestAnimationFrame loop moves the track upward at SPEED px/sec via
 *   transform: translate3d(0, -Ypx, 0) — fully GPU-composited.
 * - When the offset reaches the height of the original content ("a"), it snaps
 *   back to 0 seamlessly (the clone "b" is visually identical).
 * - CSS mask-image provides the top/bottom fade into the page background.
 * - Pauses on hover/touch and whenever any [+] detail panel is open.
 * - On each loop cycle, open [+] panels are auto-closed via resetKey to prevent
 *   permanently paused states from off-screen expanded rows.
 */

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { WorldRow } from "@/components/WorldRow";
import { useCounters } from "@/context/CountersContext";
import { useHeadlines } from "@/hooks/useHeadlines";

/** Pixels per second — matches user spec of 30px/sec */
const SPEED = 30;

/** The 25 local news outlets in display order (mirrors NewsSection.jsx) */
const OUTLETS = [
  { slug: "wabc-ny",  name: "WABC-TV (New York)" },
  { slug: "ktla-ca",  name: "KTLA (California)" },
  { slug: "wfaa-tx",  name: "WFAA (Texas)" },
  { slug: "wsb-ga",   name: "WSB-TV (Georgia)" },
  { slug: "wgn-il",   name: "WGN-TV (Illinois)" },
  { slug: "wpvi-pa",  name: "WPVI (Pennsylvania)" },
  { slug: "wxyz-mi",  name: "WXYZ (Michigan)" },
  { slug: "wral-nc",  name: "WRAL (North Carolina)" },
  { slug: "wplg-fl",  name: "WPLG (Florida)" },
  { slug: "wews-oh",  name: "WEWS (Ohio)" },
  { slug: "king-wa",  name: "KING 5 (Washington)" },
  { slug: "wcvb-ma",  name: "WCVB (Massachusetts)" },
  { slug: "kpnx-az",  name: "KPNX (Arizona)" },
  { slug: "wthr-in",  name: "WTHR (Indiana)" },
  { slug: "wmc-tn",   name: "WMC-TV (Tennessee)" },
  { slug: "ksdk-mo",  name: "KSDK (Missouri)" },
  { slug: "wbal-md",  name: "WBAL-TV (Maryland)" },
  { slug: "kusa-co",  name: "KUSA (Colorado)" },
  { slug: "wcco-mn",  name: "WCCO (Minnesota)" },
  { slug: "wtmj-wi",  name: "WTMJ-TV (Wisconsin)" },
  { slug: "wwl-la",   name: "WWL-TV (Louisiana)" },
  { slug: "wbrc-al",  name: "WBRC (Alabama)" },
  { slug: "wavy-va",  name: "WAVY-TV (Virginia)" },
  { slug: "wis-sc",   name: "WIS-TV (South Carolina)" },
  { slug: "wlbt-ms",  name: "WLBT (Mississippi)" },
];

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function TickerSectionHeader({ title }) {
  return (
    <div className="ticker-section-header py-5 border-t border-border mt-4 first:mt-0 first:border-t-0 first:pt-2">
      <h2 className="wm wm-section text-[19px] font-normal uppercase tracking-[0.02em]">
        {title}
      </h2>
    </div>
  );
}

function HeadlineTickerRow({ outlet, headlineData }) {
  return (
    <div className="wm flex items-start border-b border-border">
      {/* Source name — same layout as WorldRow number cell */}
      <div className="w-[44%] shrink-0 border-b border-transparent pr-5 pb-2 pt-2 text-right">
        <span className="text-[15px] font-bold leading-tight text-foreground">
          {outlet.name}
        </span>
      </div>

      {/* Headline text */}
      <div className="flex-1 pl-5 pt-2 pb-2">
        {headlineData?.headline ? (
          <a
            href={headlineData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[15px] leading-snug text-foreground transition-colors hover:text-accent"
          >
            {headlineData.headline}
          </a>
        ) : (
          <span className="text-[14px] italic text-muted-foreground">
            Loading headline…
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */

export function VerticalTicker() {
  const { sections } = useCounters();
  const { headlines } = useHeadlines();

  /**
   * resetKey — incremented once per loop cycle to remount WorldRow instances.
   * This clears any [+] panels that scrolled off-screen while still expanded,
   * preventing the ticker from staying permanently paused.
   */
  const [resetKey, setResetKey] = useState(0);

  /* Refs — avoids stale closures inside the RAF callback */
  const trackRef         = useRef(null);
  const rafRef           = useRef(null);
  const offsetRef        = useRef(0);        // current scroll offset in px
  const lastTimeRef      = useRef(null);     // timestamp of last RAF frame
  const contentHeightRef = useRef(0);        // height of one content copy
  const hoverRef         = useRef(false);    // is the user hovering?
  const expandedRef      = useRef(0);        // count of open [+] detail panels
  const pausedRef        = useRef(false);    // composite pause state

  const statSections = sections.filter((s) => s.key !== "news-outlets");

  /* Update composite pause state from hover + expand refs */
  const updatePause = useCallback(() => {
    pausedRef.current = hoverRef.current || expandedRef.current > 0;
  }, []);

  /* Measure content height whenever data changes */
  useLayoutEffect(() => {
    const measure = () => {
      if (trackRef.current) {
        // Track = original + clone, so one copy = half of total scrollHeight
        contentHeightRef.current = trackRef.current.scrollHeight / 2;
      }
    };
    measure();
    // Secondary measure after fonts / async headlines settle
    const t = setTimeout(measure, 700);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statSections.length, Object.keys(headlines).length]); // length values are primitives — safe

  /* The animation loop */
  const animate = useCallback(
    (timestamp) => {
      if (!pausedRef.current) {
        if (lastTimeRef.current !== null) {
          const delta = timestamp - lastTimeRef.current;
          offsetRef.current += (SPEED * delta) / 1000;

          /* Seamless loop: snap back when we've scrolled one full content height */
          if (
            contentHeightRef.current > 0 &&
            offsetRef.current >= contentHeightRef.current
          ) {
            offsetRef.current -= contentHeightRef.current;
            // Clear any stale expand state from the cycle that just completed
            expandedRef.current = 0;
            updatePause();
            setResetKey((k) => k + 1);
          }

          if (trackRef.current) {
            trackRef.current.style.transform = `translate3d(0, -${offsetRef.current}px, 0)`;
          }
        }
        lastTimeRef.current = timestamp;
      } else {
        // Reset last-time reference while paused so there's no time-jump on resume
        lastTimeRef.current = null;
      }

      rafRef.current = requestAnimationFrame(animate);
    },
    [updatePause]
  );

  /* Start / stop the RAF loop */
  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animate]);

  /* Called by WorldRow when its [+] panel opens or closes */
  const handleExpandChange = useCallback(
    (isOpen) => {
      expandedRef.current = Math.max(0, expandedRef.current + (isOpen ? 1 : -1));
      updatePause();
    },
    [updatePause]
  );

  /**
   * Render one full copy of all content.
   * Called twice (prefix "a" and "b") to produce the seamless clone loop.
   * The "b" copy is aria-hidden so screen readers don't read duplicate content.
   */
  const renderContent = (prefix) => (
    <div aria-hidden={prefix === "b" ? "true" : undefined}>
      {statSections.map((section) => (
        <div key={`${prefix}-${section.key}`}>
          <TickerSectionHeader title={section.title} />
          {section.rows.map((row) => (
            <WorldRow
              /* resetKey in the key forces remount on loop cycle */
              key={`${prefix}-${resetKey}-${row.slug}`}
              row={row}
              onExpandChange={handleExpandChange}
            />
          ))}
        </div>
      ))}

      {/* News Outlets — rendered as headline rows */}
      <div key={`${prefix}-news-outlets`}>
        <TickerSectionHeader title="News Outlets" />
        {OUTLETS.map((outlet) => (
          <HeadlineTickerRow
            key={`${prefix}-${outlet.slug}`}
            outlet={outlet}
            headlineData={headlines[outlet.slug] || null}
          />
        ))}
      </div>
    </div>
  );

  /* Mouse / touch event handlers — write directly to refs, no React re-render */
  const handleMouseEnter = () => { hoverRef.current = true;  updatePause(); };
  const handleMouseLeave = () => { hoverRef.current = false; updatePause(); };
  const handleTouchStart = () => { hoverRef.current = true;  updatePause(); };
  const handleTouchEnd   = () => { hoverRef.current = false; updatePause(); };

  return (
    <>
      {/* Inline SVG definitions for the tornado masking geometry */}
      <svg style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}>
        <defs>
          <linearGradient id="tornado-fade" x1="0" y1="0" x2="0" y2="1">
            {/* Gases out / dissolves completely at the top cloud area */}
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="12%" stopColor="white" stopOpacity="0.4" />
            <stop offset="35%" stopColor="white" stopOpacity="0.9" />
            <stop offset="85%" stopColor="white" stopOpacity="1" />
            {/* Fades to a tip at the very bottom funnel point */}
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="tornado-mask" maskContentUnits="objectBoundingBox">
            {/* 
              Tornado Funnel Path (0 to 1 bounding coordinates):
              - Wide top opening (full width)
              - Quadratic curves narrowing down to a 10% wide base in the center (45% to 55%)
            */}
            <path
              d="M 0 0 Q 0.25 0.35, 0.45 1 L 0.55 1 Q 0.75 0.35, 1 0 Z"
              fill="url(#tornado-fade)"
            />
          </mask>
        </defs>
      </svg>

      <div
        className="vertical-ticker-viewport"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div ref={trackRef} className="vertical-ticker-track">
          {renderContent("a")}
          {renderContent("b")}
        </div>
      </div>
    </>
  );
}
