import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, List, Map as MapIcon, MapPin, X } from "lucide-react";
import { getColdCases, getColdCaseStats } from "@/lib/api";
import { CaseRow, TYPE_COLOR } from "@/components/CaseRow";
import { CaseMap } from "@/components/CaseMap";

const TYPES = ["Missing Person", "Homicide", "Civil Rights"];
const STATUSES = ["Open", "Cold", "Solved"];
const RADII = [25, 50, 100, 250, 500];

const CITY_CENTERS = [
  { label: "Atlanta, GA", lat: 33.749, lng: -84.388 },
  { label: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
  { label: "Detroit, MI", lat: 42.3314, lng: -83.0458 },
  { label: "Houston, TX", lat: 29.7604, lng: -95.3698 },
  { label: "Memphis, TN", lat: 35.1495, lng: -90.049 },
  { label: "Minneapolis, MN", lat: 44.9778, lng: -93.265 },
  { label: "New Orleans, LA", lat: 29.9511, lng: -90.0715 },
  { label: "Oakland, CA", lat: 37.8044, lng: -122.2712 },
  { label: "Philadelphia, PA", lat: 39.9526, lng: -75.1652 },
  { label: "Birmingham, AL", lat: 33.5186, lng: -86.8104 },
];

export default function ColdCases() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [view, setView] = useState("list");
  const [nearIdx, setNearIdx] = useState("");
  const [radius, setRadius] = useState(100);
  const [bounds, setBounds] = useState(null);

  const near = nearIdx !== "" ? CITY_CENTERS[Number(nearIdx)] : null;
  const useBounds = bounds && !near;

  const { data: stats } = useQuery({ queryKey: ["case-stats"], queryFn: getColdCaseStats });
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["cold-cases", q, type, status, nearIdx, radius, JSON.stringify(useBounds ? bounds : null)],
    queryFn: () =>
      getColdCases({
        q: q || undefined,
        case_type: type || undefined,
        status: status || undefined,
        lat: near ? near.lat : undefined,
        lng: near ? near.lng : undefined,
        radius_miles: near ? radius : undefined,
        ...(useBounds ? bounds : {}),
      }),
  });

  const pickCity = (v) => { setNearIdx(v); setBounds(null); };
  const onSearchArea = (b) => { setBounds(b); setNearIdx(""); };

  const Chip = ({ active, onClick, children, testid }) => (
    <button
      data-testid={testid}
      onClick={onClick}
      className={`border px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "border-accent bg-accent text-accent-foreground" : "border-border text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-background" data-testid="cold-cases-page">
      {/* Header */}
      <section className="grain border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-container px-6 py-16 md:px-12 md:py-24">
          <p className="overline text-accent">A Public Record</p>
          <h1 className="mt-3 max-w-3xl font-heading text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
            Cold Cases &amp; Missing Persons
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-primary-foreground/70">
            A dignified, searchable archive of cases that too often go uncovered. Every entry
            is published responsibly, with family consent where possible, to keep names and
            stories from being forgotten.
          </p>
          {stats && (
            <div className="mt-10 flex flex-wrap gap-8">
              {[
                { k: "Cases Tracked", v: stats.total },
                { k: "Open", v: stats.open },
                { k: "Cold", v: stats.cold },
                { k: "Resolved", v: stats.solved },
              ].map((s) => (
                <div key={s.k}>
                  <p className="font-heading text-4xl font-medium">{s.v}</p>
                  <p className="overline mt-1 text-primary-foreground/50">{s.k}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Controls */}
      <section className="sticky top-[112px] z-30 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-container px-6 py-4 md:px-12">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 border border-border bg-card px-3 lg:w-80">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                data-testid="case-search-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, city, or case #"
                className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Chip testid="filter-type-all" active={!type} onClick={() => setType("")}>All Types</Chip>
              {TYPES.map((t) => (
                <Chip key={t} testid={`filter-type-${t.replace(/\s+/g, "-").toLowerCase()}`} active={type === t} onClick={() => setType(t)}>
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: TYPE_COLOR[t] }} />
                  {t}
                </Chip>
              ))}
              <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
              <Chip testid="filter-status-all" active={!status} onClick={() => setStatus("")}>Any Status</Chip>
              {STATUSES.map((s) => (
                <Chip key={s} testid={`filter-status-${s.toLowerCase()}`} active={status === s} onClick={() => setStatus(s)}>{s}</Chip>
              ))}
            </div>

            <div className="flex border border-border">
              <button
                data-testid="view-list-button"
                onClick={() => setView("list")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium ${view === "list" ? "bg-foreground text-background" : "text-foreground"}`}
              >
                <List className="h-4 w-4" /> List
              </button>
              <button
                data-testid="view-map-button"
                onClick={() => setView("map")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium ${view === "map" ? "bg-foreground text-background" : "text-foreground"}`}
              >
                <MapIcon className="h-4 w-4" /> Map
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4" data-testid="radius-controls">
            <span className="overline text-muted-foreground">Search near</span>
            <select
              data-testid="radius-city-select"
              value={nearIdx}
              onChange={(e) => pickCity(e.target.value)}
              className="border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Anywhere in the U.S.</option>
              {CITY_CENTERS.map((c, i) => (
                <option key={c.label} value={i}>{c.label}</option>
              ))}
            </select>
            {near && (
              <>
                <span className="text-sm text-muted-foreground">within</span>
                <select
                  data-testid="radius-miles-select"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent"
                >
                  {RADII.map((r) => (
                    <option key={r} value={r}>{r} miles</option>
                  ))}
                </select>
                <button
                  data-testid="radius-clear"
                  onClick={() => setNearIdx("")}
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                >
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              </>
            )}
            {useBounds && (
              <span data-testid="bounds-active" className="inline-flex items-center gap-2 border border-accent px-3 py-1.5 text-xs font-medium text-accent">
                <MapPin className="h-3.5 w-3.5" /> Showing cases in map area
                <button data-testid="bounds-clear" onClick={() => setBounds(null)} className="hover:underline">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
          </div>
        </div>
      </section>

      {view === "map" && (
        <div className="mx-auto max-w-container px-6 pt-6 md:px-12">
          <div className="flex flex-wrap items-center gap-5 border border-border bg-muted px-5 py-3" data-testid="map-legend">
            <span className="overline text-muted-foreground">Legend</span>
            {TYPES.map((t) => (
              <span key={t} className="flex items-center gap-2 text-xs text-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: TYPE_COLOR[t] }} /> {t}
              </span>
            ))}
            <span className="flex items-center gap-2 text-xs text-foreground">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[8px] text-background">3</span> Clustered
            </span>
          </div>
        </div>
      )}

      {/* Body */}
      <section className="mx-auto max-w-container px-6 py-12 md:px-12">
        <div className="mb-6 flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground" data-testid="case-count">
            {isLoading ? "Loading…" : `${cases.length} ${cases.length === 1 ? "case" : "cases"}`}
          </p>
          <Link to="/submit-tip" data-testid="cases-submit-tip" className="text-sm font-medium text-accent hover:underline">
            Have information? Submit a tip →
          </Link>
        </div>

        {view === "map" ? (
          <CaseMap
            cases={cases}
            cluster
            center={near ? [near.lat, near.lng] : null}
            radiusMiles={near ? radius : null}
            onSearchArea={onSearchArea}
          />
        ) : (
          <div>
            <div className="hidden grid-cols-12 gap-4 border-b border-foreground px-2 pb-3 md:grid">
              {["Name", "Type", "Location", "Reported", ""].map((h, i) => (
                <span key={i} className={`overline text-muted-foreground ${i === 0 ? "col-span-4" : i === 1 ? "col-span-2" : i === 2 ? "col-span-3" : i === 3 ? "col-span-2" : "col-span-1 text-right"}`}>{h}</span>
              ))}
            </div>
            {(Array.isArray(cases) ? cases : []).map((c) => (
              <CaseRow key={c.case_number} c={c} />
            ))}
            {!isLoading && cases.length === 0 && (
              <p className="py-16 text-center font-mono text-sm text-muted-foreground">No cases match these filters.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
