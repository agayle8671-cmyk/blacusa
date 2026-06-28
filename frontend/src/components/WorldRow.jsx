import React from "react";
import { TrendingUp } from "lucide-react";
import { useOdometer } from "@/hooks/useOdometer";
import { hasInsight } from "@/mock/insights";
import { SpotlightDialog } from "@/components/SpotlightDialog";

/* A single live-ticking number. Bypasses React render via direct DOM mutation. */
function LiveNumber({ row }) {
  const ref = useOdometer({
    baselineValue: row.baselineValue,
    baselineTimestamp: row.baselineTimestamp,
    annualRate: row.annualRate,
    decimals: row.decimals || 0,
    prefix: row.prefix || "",
    suffix: row.suffix || "",
  });
  return <span ref={ref} className="tnums" />;
}

/*
  WorldRow — mirrors a Worldometer dashboard line:
  [ bold number | underline ]   label (with blue link words)   [trend] [+]
*/
export const WorldRow = ({ row, onExpandChange }) => {
  const [open, setOpen] = React.useState(false);
  const [spotOpen, setSpotOpen] = React.useState(false);
  const hasDetail = Boolean(row.detail);
  const showSpotlight = hasInsight(row.slug);

  return (
    <div className="wm" data-testid={`row-${row.slug}`}>
      <div className="flex items-start">
        {/* number cell */}
        <div className="w-[44%] shrink-0 border-b border-border pr-5 pb-2 pt-2 text-right text-[16px] font-bold leading-tight text-foreground">
          {row.static ? (
            <span className="tnums">{row.static}</span>
          ) : (
            <LiveNumber row={row} />
          )}
        </div>

        {/* label cell */}
        <div className="flex flex-1 items-start justify-between pl-5 pt-2">
          <p className="text-[16px] leading-snug text-foreground">
            {row.label.pre}
            {row.label.link && (
              <>
                {" "}
                {row.sourceUrl ? (
                  <a
                    href={row.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wm-link underline hover:text-accent font-bold"
                  >
                    {row.label.link}
                  </a>
                ) : (
                  <span className="wm-link">{row.label.link}</span>
                )}
              </>
            )}
            {row.label.post && (
              <span className="text-muted-foreground text-xs italic"> {row.label.post}</span>
            )}
          </p>

          <div className="ml-3 mt-0.5 flex shrink-0 items-center gap-2">
            {showSpotlight && (
              <button
                type="button"
                onClick={() => setSpotOpen(true)}
                aria-label="Open disparity spotlight"
                title="Disparity Spotlight — trend & comparison"
                data-testid={`spotlight-btn-${row.slug}`}
                className="text-accent/70 transition-colors hover:text-accent"
              >
                <TrendingUp size={15} strokeWidth={2.25} />
              </button>
            )}
            {hasDetail && (
              <button
                type="button"
                onClick={() =>
                  setOpen((prev) => {
                    const next = !prev;
                    onExpandChange?.(next);
                    return next;
                  })
                }
                aria-label="Toggle details"
                data-testid={`expand-${row.slug}`}
                className="font-mono text-[13px] leading-5 text-[#bdbdbd] transition-colors hover:text-foreground"
              >
                {open ? "[–]" : "[+]"}
              </button>
            )}
          </div>
        </div>
      </div>

      {hasDetail && open && (
        <div className="ml-[44%] animate-fade-in pl-5">
          <p className="border-l-2 border-accent bg-muted/60 px-4 py-2 text-[13px] leading-relaxed text-muted-foreground">
            {row.detail}
          </p>
        </div>
      )}

      {showSpotlight && (
        <SpotlightDialog
          open={spotOpen}
          onOpenChange={setSpotOpen}
          slug={row.slug}
          fallbackTitle={row.label.pre}
        />
      )}
    </div>
  );
};
