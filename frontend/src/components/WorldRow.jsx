import React from "react";
import { useOdometer } from "@/hooks/useOdometer";

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
  [ bold number | underline ]   label (with blue link words)   [+]
*/
export const WorldRow = ({ row }) => {
  const [open, setOpen] = React.useState(false);
  const hasDetail = Boolean(row.detail);

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
                <span className="wm-link">{row.label.link}</span>
              </>
            )}
            {row.label.post && (
              <span className="text-muted-foreground"> {row.label.post}</span>
            )}
          </p>

          {hasDetail && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle details"
              data-testid={`expand-${row.slug}`}
              className="ml-3 mt-0.5 shrink-0 font-mono text-[13px] leading-5 text-[#bdbdbd] transition-colors hover:text-foreground"
            >
              {open ? "[–]" : "[+]"}
            </button>
          )}
        </div>
      </div>

      {hasDetail && open && (
        <div className="ml-[44%] animate-fade-in pl-5">
          <p className="border-l-2 border-accent bg-muted/60 px-4 py-2 text-[13px] leading-relaxed text-muted-foreground">
            {row.detail}
          </p>
        </div>
      )}
    </div>
  );
};
