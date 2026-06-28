# BlacUSA — Real-Time Demographic & Civic Tracker
## Architectural Report ("Project DNA")

> **Purpose.** This is the single, complete source of truth for the BlacUSA web
> application. It is written so that **any AI agent or human developer** can
> understand exactly what the product is, how every part works, and **rebuild it
> from scratch** without reading the code first. If behavior changes, update this
> file and add a dated entry to the **Changelog** (§16).
>
> **Last updated:** 2026-06 (Iteration: Worldometer-faithful clone + Disparity Spotlight)

---

## 1. What BlacUSA Is

BlacUSA is a **real-time statistical tracker for Black America** — conceptually a
"Worldometer for Black America." It deprecates traditional news/article layouts in
favor of a **brutalist, data-first dashboard** that mirrors the look and behavior of
[worldometers.info](https://www.worldometers.info): rows of large, **live-ticking
numbers** organized into themed sections, each anchored to an authoritative
government data source.

It improves on Worldometer with one signature feature it lacks — the **Disparity
Spotlight**: any key metric can be expanded into a panel showing a **historical
trend chart** and/or a **side-by-side comparison** (e.g., Black vs White), plus a
plain-language "why this matters" and the source. This turns raw numbers into
**context and understanding**, presented with dignity.

### Editorial / data pillars (the five dashboard sections)
1. **Demographics & Population**
2. **Economic Equity & Wealth**
3. **Public Health & Equity**
4. **Environmental Justice**
5. **Criminal Legal System**

### Personas
- **General public / readers** — scan the live dashboard, open Spotlights for context.
- **Journalists / researchers** — cite the figures and sources.
- **Operators / data team** — update the seeded baselines as new official data lands.

### Design ethos
- **Algorithm-proof**: a direct, owned data utility (no feed dependency).
- **Trauma-informed**: systemic framing, dignified language, no sensationalism.
- **Source-anchored**: every number names its authority (Census, Fed, CDC, USDA, BJS, FBI).

---

## 2. The Core Concept — Client-Side Extrapolation

**The numbers do NOT stream from the server.** Official statistics (population,
revenue, mortality, arrests) are published annually/quarterly, not per-second. So
the ticking is a **convincing illusion produced by math in the browser**, exactly
like Worldometer. This keeps the backend passive and costs near-zero regardless of
concurrent users.

The server delivers, **once on page load**, three variables per metric:
- `baselineValue` — `V_base`, the value at a baseline moment
- `baselineTimestamp` — `T_base`, ISO 8601 timestamp of that baseline
- `annualRate` — `R_year`, the raw yearly change

The browser then computes the displayed value every animation frame:

```
R_sec      = annualRate / 31,536,000           // seconds in a 365-day year
V_current  = V_base + R_sec * ( (T_now - T_base) / 1000 )   // T in ms
```

Counters can **increase** (population, revenue) or **decrease** (`annualRate < 0`,
e.g., Black-owned farms remaining). "This year" and "today" counters reset because
their baseline is resolved server-side to the start of the current year / current
day with `V_base = 0` (see §10).

**Rendering performance:** updates bypass React's reconciler entirely. A custom
`useOdometer` hook uses `requestAnimationFrame` + a `useRef` to mutate the DOM
node's `textContent` directly (§12). Combined with the CSS `tabular-nums`
(monospaced digits) utility, dozens of counters tick at 60fps with **no layout
jitter**.

---

## 3. Tech Stack & Runtime

| Layer | Technology |
|---|---|
| Frontend | React 19 (CRA via `react-scripts` 5 + CRACO 7), React Router 7, Tailwind CSS 3, shadcn/ui (Radix), lucide-react icons, **recharts** (Spotlight charts), **react-fast-marquee** (ticker) |
| Backend | FastAPI 0.110, Motor 3.3 (async MongoDB driver), Pydantic 2, Uvicorn |
| Database | MongoDB (single database, name from `DB_NAME`) |
| Fonts | `Noto Sans` (UI/numbers — Worldometer-faithful), `JetBrains Mono` (labels/overlines), `Cormorant Garamond` (available, brand serif), `Satoshi` (available) |

### Process / hosting model
- **Backend** runs on `0.0.0.0:8001`, supervisor-managed. **All API routes are
  prefixed with `/api`** and exposed externally via ingress. Production target:
  **Railway**.
- **Frontend** runs on port `3000`, supervisor-managed locally. Production target:
  **Vercel** (root dir = `frontend/`). It calls the backend **only** through
  `REACT_APP_BACKEND_URL`.
- Hot reload is enabled for both; restart only after dependency or `.env` changes:
  `sudo supervisorctl restart backend|frontend|all`.

### Hard rules (environment integrity)
- Never hardcode URLs/ports. Frontend → `process.env.REACT_APP_BACKEND_URL`.
  Backend DB → `os.environ['MONGO_URL']`.
- Backend binds `0.0.0.0:8001`. All routes under `/api`.
- Update deps via `yarn add` (frontend) and `pip install … && pip freeze >
  requirements.txt` (backend). Never `npm`.

---

## 4. Repository Layout

```
/app
├── backend/
│   ├── server.py            # FastAPI app: models, seeding, /api routes, baseline resolution
│   ├── seed_counters.py     # THE DATA MATRIX: 32 counters + hero + ticker + section meta
│   ├── requirements.txt
│   └── .env                 # MONGO_URL, DB_NAME, CORS_ORIGINS
├── frontend/
│   ├── src/
│   │   ├── App.js           # Router + CountersProvider; mounts Header, Ticker, Dashboard, Footer
│   │   ├── index.js         # ReactDOM root
│   │   ├── index.css        # THEME TOKENS (CSS vars) + fonts + .wm/.tnums/.wm-link utilities
│   │   ├── App.css
│   │   ├── hooks/
│   │   │   └── useOdometer.js        # rAF extrapolation engine (direct DOM mutation)
│   │   ├── lib/
│   │   │   ├── api.js                # getCounters() -> GET /api/counters
│   │   │   └── utils.js              # cn() classname helper (shadcn)
│   │   ├── context/
│   │   │   └── CountersContext.jsx   # fetch once, provide {hero, sections, ticker}; mock fallback
│   │   ├── mock/
│   │   │   ├── data.js               # frontend mock mirror of the data matrix (fallback + instant render)
│   │   │   └── insights.js           # Disparity Spotlight content (history/comparison/summary) by slug
│   │   ├── components/
│   │   │   ├── Header.jsx            # logo + Population + More dropdown (left), English (right), mobile menu
│   │   │   ├── Ticker.jsx            # slim "LIVE" marquee of secondary data points
│   │   │   ├── Section.jsx           # grey uppercase title + stack of WorldRows
│   │   │   ├── WorldRow.jsx          # one dashboard line: number | label(+blue link) | ↗ spotlight | [+]
│   │   │   ├── SpotlightDialog.jsx   # Radix Dialog + recharts (trend line / comparison bars)
│   │   │   ├── Footer.jsx            # wordmark, section links, data sources
│   │   │   └── Hero.jsx             # DEPRECATED/unused (giant hero removed for Worldometer fidelity)
│   │   └── components/ui/            # shadcn primitives (dialog, button, etc.)
│   ├── package.json, tailwind.config.js, craco.config.js, jsconfig.json (@ alias -> src), .env
├── contracts.md             # API contract + integration notes
├── ARCHITECTURE.md          # (this file)
└── test_result.md           # testing protocol + agent communication log
```

> `@/...` import alias resolves to `frontend/src` (configured in `craco.config.js`
> webpack alias and `jsconfig.json`).

---

## 5. Environment Variables

**`backend/.env`** (do not rename keys; values are environment-provided):
- `MONGO_URL` — Mongo connection string (local in dev; managed in prod).
- `DB_NAME` — database name.
- `CORS_ORIGINS` — `*` in dev (CORS middleware allows all origins). In production
  with credentials, prefer an explicit list / regex.

**`frontend/.env`**:
- `REACT_APP_BACKEND_URL` — external base URL of the backend (no trailing slash).
  All API calls are `${REACT_APP_BACKEND_URL}/api/...`.
- `WDS_SOCKET_PORT`, `ENABLE_HEALTH_CHECK` — dev tooling (leave as provided).

No third-party API keys are required to run. (The optional ETL ingestion described
in §15 would need FRED/Census/CDC keys — not implemented.)

---

## 6. Design System (look & feel)

A faithful Worldometer skin over a tokenized, re-themeable color system.

### Color tokens — `frontend/src/index.css` (HSL triplets via `hsl(var(--token))`)
```
--background        48 20% 97%    off-white linen (reduces reading fatigue)
--foreground         0  0%  7%    near-black text / numbers
--card               0  0% 100%
--primary            0  0% 10%    authority black
--secondary         43 16% 90%
--muted             43 21% 94%
--muted-foreground   0  0% 40%
--accent             5 65% 33%    dignified crimson  (#8C271E) — crisis metrics, links-on-hover, charts
--destructive        5 67% 28%
--border            45 16% 84%
--ring               5 65% 33%
--radius            0px           hard edges (brutalist / archival)
```
To re-theme the entire site, edit these variables. Tailwind consumes them as
semantic classes (`bg-background`, `text-foreground`, `text-accent`, …). **Never
hardcode hex in components** (the chart files intentionally use the brand hex
`#8C271E` / `#9a948c` inside recharts, which cannot read CSS vars directly).

### Typography
- **Body / numbers:** `Noto Sans` (matches Worldometer). Applied to `body` and the
  `.wm` utility used across all dashboard text.
- **Labels / overlines:** `JetBrains Mono` via `.font-mono` / `.overline`
  (uppercase, letter-spaced).
- **Available but secondary:** `Cormorant Garamond` (`.font-heading`), `Satoshi`.
- Loaded via Google Fonts + Fontshare `@import` at the top of `index.css`.

### Key utilities (`index.css`)
- `.wm` — Noto Sans font stack (Worldometer text).
- `.tnums` — `font-variant-numeric: tabular-nums` (locks digit width → no jitter).
- `.wm-link` — Worldometer link blue `#2f6fb0` (the "this year"/"today" words),
  hover → accent crimson + underline.
- `.wm-section` — light grey `#adadad` for the uppercase section titles.
- `.overline`, `.editorial-rule`, `.grain` — editorial accents.

### Layout
- Centered content column, `max-w-[940px]` (`max-w-[1080px]` for the header bar).
- **Row anatomy** (the Worldometer line): a left **number cell** (`44%` width,
  right-aligned, bold 16px, 1px bottom border) + a right **label cell** (16px, with
  blue link word) + trailing controls (`↗` Spotlight icon when data exists, then a
  plain grey `[+]` expander when a detail note exists).
- **Section title**: light-grey uppercase, ~19px (`.wm .wm-section`).
- Sticky translucent header with bottom border; slim LIVE marquee below it.

---

## 7. Data Model (MongoDB)

IDs/keys are application-defined; Mongo `_id` is always excluded from API responses
(`{"_id": 0}`). Two collections, both **auto-seeded on startup if empty** from
`seed_counters.py`.

### `live_counters` — one document per metric
| Field | Type | Notes |
|---|---|---|
| `metric_slug` | str (unique) | e.g., `black-population`, `births-year` |
| `category` | str | one of: demographics, economics, health, environment, justice |
| `order` | int | sort order within its section |
| `value_type` | str | `"live"` or `"static"` |
| `baseline_kind` | str | `"fixed"` \| `"year_start"` \| `"day_start"` (see §10) |
| `baseline_value` | number\|null | `V_base` (for live) |
| `baseline_timestamp` | str\|null | ISO; used when `fixed` |
| `annual_rate` | number\|null | `R_year` (negative = declining) |
| `prefix` / `suffix` | str | e.g., `"$"` prefix |
| `decimals` | int | display precision |
| `static_value` | str\|null | display string for static rows (e.g., `"37%"`, `"$44,100"`) |
| `label_pre` | str | label text before the blue link |
| `label_link` | str\|null | the blue word ("this year"/"today") |
| `label_post` | str\|null | trailing label text (units) |
| `detail` | str\|null | text shown by the `[+]` expander |
| `source` | str\|null | optional source string |

### `counter_meta` — single document `{ id: "meta", … }`
- `hero` — flagship counter config (slug, caption, baseline_*, annual_rate, source).
- `ticker` — array of strings for the LIVE marquee.
- `sections` — `[{ key, title }]` in display order (drives nav + grouping).

---

## 8. The Seed Data Matrix (`backend/seed_counters.py`)

**32 counters** (20 live + 12 static) across 5 sections, plus the hero and 8 ticker
lines. Built with two helpers: `_live(slug, category, order, pre, value, kind,
rate, **kw)` and `_static(slug, category, order, pre, static_value, **kw)`.

Representative baselines (figures are 2022–2024 official baselines; some health/
justice rows are explicitly **projected**):

**Demographics** — `black-population` 49,200,000 fixed @2024-07-01, +540,000/yr ·
`births-year`/`births-today` 620,000/yr · `deaths-year`/`deaths-today` 445,000/yr ·
`net-growth-year`/`net-growth-today` 175,000/yr · `eligible-voters` 34,400,000,
+410,000/yr.

**Economics** — `buying-power-year` $1.98T/yr · `biz-revenue-year`/`-today`
$249.0B/yr (~$7,895/sec) · `employer-firms` 200,885, +22,000/yr · `biz-employees`
1,600,000, +75,000/yr · `median-wealth-black` static `$44,100` ·
`median-wealth-white` static `$284,310`.

**Health** — `asthma-er-year`/`-today` 165,000/yr (projected) · `maternal-deaths-year`
278/yr · `maternal-rate` static `44.8` · `life-expectancy` static `74.0` ·
`life-gap` static `4.4`.

**Environment** — `black-farms` 28,723 fixed, **−800/yr** · `farmland-acres`
4,700,000, **−30,000/yr** · `lost-land-value` static `$326B` · `farm-share` static
`1.5%` · `septic-failing` static `40–90%`.

**Justice** — `arrests-year`/`-today` 1,990,000/yr · `incarcerated` static `735,000`
· `incarc-share` static `37%` · `pop-share` static `13.5%` · `arrest-rate` static
`4,223`.

**Sources cited across rows:** U.S. Census Bureau (incl. Annual Business Survey),
Federal Reserve Survey of Consumer Finances, CDC NCHS, USDA Census of Agriculture,
Bureau of Justice Statistics, FBI UCR, Pew Research, Selig Center.

---

## 9. Backend API Reference (all under `/api`)

| Method | Route | Purpose |
|---|---|---|
| GET | `/` | Health/info — `{ "message": "BlacUSA Real-Time Tracker API" }` |
| GET | `/counters` | **Primary endpoint.** Assembled dashboard config (below). |
| GET | `/counters/meta` | Status echo — `{ counters: 32, etl_ingestion: "stub", note, generated_at }`. Makes the mock/stub state explicit. |
| POST | `/status` | Demo: create a status check `{ client_name }`. |
| GET | `/status` | Demo: list status checks. |

### `GET /api/counters` response shape
```json
{
  "hero": {
    "slug": "black-population",
    "caption": "Current Black Population (U.S.)",
    "baselineValue": 49200000,
    "baselineTimestamp": "2024-07-01T00:00:00",
    "annualRate": 540000,
    "source": "U.S. Census Bureau — 49.2M in 2024, a 36% increase since 2000."
  },
  "sections": [
    {
      "key": "demographics",
      "title": "Demographics & Population",
      "rows": [
        {
          "slug": "births-year",
          "label": { "pre": "Black births", "link": "this year" },
          "detail": "Projected from CDC NCHS natality baselines.",
          "source": null,
          "baselineValue": 0,
          "baselineTimestamp": "2026-01-01T00:00:00",
          "annualRate": 620000,
          "prefix": "", "suffix": "", "decimals": 0
        },
        {
          "slug": "median-wealth-black",
          "label": { "pre": "Median Black household net worth" },
          "detail": "Federal Reserve SCF (2022)…",
          "static": "$44,100"
        }
      ]
    }
  ],
  "ticker": ["Black population reached 49.2M in 2024 — a 36% increase since 2000.", "…"]
}
```
- **Live rows** carry `baselineValue / baselineTimestamp / annualRate / prefix /
  suffix / decimals`. **Static rows** carry a `static` string instead.
- Sections are emitted in `counter_meta.sections` order; rows are sorted by
  `(category, order)`.

---

## 10. Baseline Resolution Logic (server-side)

`server.py :: _resolve_baseline(kind, stored_ts, stored_value)` runs at **request
time** so resetting counters are always correct:

- `fixed` → returns the stored `baseline_timestamp` and `baseline_value` unchanged
  (cumulative metrics like total population).
- `year_start` → returns `(Jan 1 of current year, 0)` → "this year" counters that
  reset every January 1.
- `day_start` → returns `(midnight today, 0)` → "today" counters that reset daily.

`_row_to_public(doc)` maps a stored doc to the frontend row shape: builds `label`
from `label_pre/link/post`, returns `static` for static rows, otherwise resolves the
baseline and attaches the live fields. The hero is resolved the same way.

---

## 11. Frontend Architecture

### Data flow (end to end)
```
MongoDB live_counters + counter_meta
        │  (seeded from seed_counters.py on startup)
        ▼
GET /api/counters  ──►  _resolve_baseline + _row_to_public  ──►  {hero, sections, ticker}
        │
        ▼
lib/api.js getCounters()
        │
        ▼
context/CountersContext.jsx  ──(initial = mock/data.js for instant paint)──►  swaps in server data
        │
        ├──► Header.jsx     (sections → Population link + More dropdown + mobile menu)
        ├──► Ticker.jsx     (ticker → marquee)
        ├──► Footer.jsx     (sections → footer links)
        └──► Dashboard.jsx  (sections → Section → WorldRow → useOdometer / SpotlightDialog)
```

### Key modules
- **`CountersContext.jsx`** — `CountersProvider` fetches `/api/counters` once on
  mount. It **initializes from `mock/data.js`** so the UI renders instantly, then
  replaces state with server data on success; on error it keeps the mock (the app is
  never empty). `useCounters()` returns `{ hero, sections, ticker }`.
- **`Dashboard.jsx`** — maps `sections` → `<Section>`; appends a methodology
  footnote. (No giant hero — "Current Black Population" is simply the first row of
  Demographics, matching Worldometer.)
- **`Section.jsx`** — renders the light-grey uppercase `title` and maps `rows` →
  `<WorldRow>`. Section `id={key}` enables smooth-scroll nav.
- **`WorldRow.jsx`** — the heart of the UI. Renders the number cell (`<LiveNumber>`
  for live via `useOdometer`, or the `static` string), the label with optional blue
  link word, a `↗` **Spotlight** button when `hasInsight(slug)`, and a `[+]`
  expander when `detail` exists. Holds local `open` (detail) and `spotOpen`
  (dialog) state and renders `<SpotlightDialog>`.
- **`Header.jsx`** — left cluster: two-tone `blacusa` wordmark + `Population`
  (scrolls to demographics) + `More ▾` dropdown (lists all sections, smooth-scroll);
  right: `English`. Mobile: hamburger → section list. `data-testid`s:
  `logo`, `nav-population`, `nav-more`, `more-<key>`, `mobile-toggle`.
- **`Ticker.jsx`** — `react-fast-marquee`, a crimson `LIVE` chip + scrolling
  `ticker` strings. (This is an addition Worldometer does not have, kept by request.)
- **`Footer.jsx`** — wordmark, section quick-links, consolidated source list.

### Test IDs (stable hooks for automated testing)
`hero` (legacy), `section-<key>`, `row-<slug>`, `expand-<slug>`,
`spotlight-btn-<slug>`, `spotlight-<slug>`, plus the header IDs above.

---

## 12. The Counter Engine — `hooks/useOdometer.js`

```js
useOdometer({ baselineValue, baselineTimestamp, annualRate, decimals, prefix, suffix }) -> ref
```
- Computes `ratePerSec = annualRate / 31,536,000`.
- In a `requestAnimationFrame` loop, computes
  `current = baselineValue + ratePerSec * ((Date.now() - baseTime) / 1000)`.
- Formats with thousands separators (and fixed decimals), prepends `prefix`,
  appends `suffix`, and writes it to `ref.current.textContent` — **never** calling
  `setState`, so React's reconciler is bypassed.
- Cleans up the rAF on unmount / dependency change.
- Consumers wrap the ref node in `className="tnums"` so digits are monospaced.

`<LiveNumber>` (inside `WorldRow.jsx`) is the thin component that always calls the
hook (hooks can't be conditional); static rows render a plain string instead.

---

## 13. The Disparity Spotlight (signature feature)

**Files:** `components/SpotlightDialog.jsx` + `mock/insights.js`.

- `mock/insights.js` exports `getInsight(slug)` and `hasInsight(slug)`. It holds an
  `INSIGHTS` map keyed by slug and an `ALIASES` map so related rows share one
  insight (e.g., all births/deaths/net-growth rows → one "Natural Increase"
  insight; `pop-share` → the incarceration comparison). **All 32 rows resolve to an
  insight.**
- An insight may contain:
  - `summary` — plain-language "why this matters".
  - `history` — `{ label, unit, data:[{name,value}] }` → rendered as a **recharts
    line chart** (e.g., population 1790–2024; Black-owned farms 1910–2022).
  - `comparison` — `{ label, unit, rows:[{label,value,accent}] }` → rendered as a
    **horizontal bar chart**; `accent:true` bars use crimson, others muted grey
    (e.g., wealth gap, life expectancy, maternal mortality, asthma risk ×, arrest
    rate, incarceration share).
  - `source`.
- `SpotlightDialog.jsx` is a controlled Radix **Dialog** (`open`, `onOpenChange`)
  that renders an "DISPARITY SPOTLIGHT" overline, title, summary, the chart(s) it
  has, and the source. Summary-only insights (e.g., the Black Belt sanitation
  crisis) render with no chart.

> This content is **static editorial reference data** kept on the frontend by
> design (it does not tick). It can be migrated into the backend later (e.g., an
> `insights` collection joined into `/api/counters`).

---

## 14. Build From Scratch — Step by Step

1. **Scaffold** a React (CRA + CRACO, `@`→`src` alias) + FastAPI + MongoDB project.
   Set `REACT_APP_BACKEND_URL` (frontend) and `MONGO_URL`/`DB_NAME`/`CORS_ORIGINS`
   (backend). Backend binds `0.0.0.0:8001`; all routes under `/api`.
2. **Backend data matrix** — create `seed_counters.py` with `_live`/`_static`
   helpers, the 32 counters, `HERO`, `TICKER_ITEMS`, `SECTION_META` (§8).
3. **Backend app** — in `server.py`: connect Motor; on `startup` seed
   `live_counters` + `counter_meta` if empty; implement `_resolve_baseline` (§10)
   and `_row_to_public`; expose `GET /api/counters`, `GET /api/counters/meta`,
   plus the demo `/status` routes; add permissive CORS.
4. **Frontend theme** — put the color tokens + fonts + `.wm/.tnums/.wm-link/
   .wm-section` utilities into `index.css`; wire fonts in `tailwind.config.js`.
5. **Engine** — implement `useOdometer` (rAF + ref + tabular-nums) (§12).
6. **Data layer** — `lib/api.js#getCounters()`; `context/CountersContext.jsx`
   (mock-initialized provider + `useCounters`); `mock/data.js` mirror for fallback.
7. **UI** — `WorldRow` (number/label/`↗`/`[+]`), `Section`, `Header` (logo +
   Population + More + English + mobile), `Ticker` (marquee), `Footer`, and
   `Dashboard` (maps sections). Add stable `data-testid`s.
8. **Spotlight** — `mock/insights.js` (insights + aliases) and `SpotlightDialog`
   (Radix Dialog + recharts line/bar). Show the `↗` only when `hasInsight(slug)`.
9. **Compose** — `App.js`: `CountersProvider` → `BrowserRouter` → `Header`,
   `Ticker`, `Routes(/ → Dashboard)`, `Footer`.
10. **Verify** — counters tick without jitter; sections/nav/Spotlights work; data
    comes from `/api/counters` with mock fallback.

---

## 15. What Is Mocked / Not Built

- **MOCKED / STUB — ETL ingestion.** The document envisions a scheduled pipeline
  pulling fresh baselines from **FRED / Census / CDC WONDER** APIs and overwriting
  `live_counters`. This is **not implemented** (needs real API keys). Baselines are
  seeded constants; `GET /api/counters/meta` returns `etl_ingestion: "stub"`.
- **Projected metrics.** Some health/justice "today/this year" rates (asthma ER
  visits, maternal deaths) are reasonable projections from published rates, labeled
  "Projected" in their `detail`/`source`.
- **Spotlight insights** live on the frontend as static reference data (not yet a
  backend collection).
- No auth, no write-API for editing counters via UI, no persistence beyond the seed.

---

## 16. Run, Test & Deploy

- **Local dev:** services run under supervisor (`backend :8001`, `frontend :3000`).
  Restart only after `.env`/dependency changes:
  `sudo supervisorctl restart all`.
- **Smoke test the API:**
  ```bash
  API=$(grep REACT_APP_BACKEND_URL frontend/.env | cut -d= -f2)
  curl -s "$API/api/counters"      | head -c 400
  curl -s "$API/api/counters/meta"
  ```
- **Backend deps:** `pip install <pkg> && pip freeze > backend/requirements.txt`.
  **Frontend deps:** `yarn add <pkg>` (never npm).
- **Deploy:** backend → Railway (set the three env vars; Mongo via managed URL);
  frontend → Vercel (root `frontend/`, set `REACT_APP_BACKEND_URL` to the Railway
  URL without trailing slash). Counters self-seed on first backend boot.

---

## 17. Extending the System

- **Add a metric:** append a `_live`/`_static` entry to `seed_counters.py`
  (unique `metric_slug`, correct `category`/`order`/`baseline_kind`). On a fresh DB
  it seeds automatically; on an existing DB, insert the doc into `live_counters` (or
  clear the collection to re-seed). Mirror it in `mock/data.js` for fallback.
- **Add a section:** add to `SECTION_META` (backend) + ensure rows reference its
  `category`. Nav/footer pick it up automatically from `counter_meta.sections`.
- **Add a Spotlight:** add an entry to `INSIGHTS` (or an `ALIASES` mapping) in
  `mock/insights.js`; the `↗` appears automatically via `hasInsight(slug)`.
- **Re-theme:** edit the CSS variables in `index.css` only.
- **Enable live data:** implement the ETL pipeline to refresh `live_counters`
  baselines on a schedule; the frontend math needs no changes.

---

## 18. Component / Route Map (quick reference)

| Route | Component | Summary |
|---|---|---|
| `/` | `Dashboard` | Worldometer-style sections of live + static rows; per-row Spotlight & detail. |

| Mount order in `App.js` | Component |
|---|---|
| 1 | `CountersProvider` (data context) |
| 2 | `Header` |
| 3 | `Ticker` |
| 4 | `Dashboard` (the only route) |
| 5 | `Footer` |

---

## 19. Changelog

- **2026-06 — Iteration 1 (Frontend MVP):** Worldometer-style dashboard with 5
  custom sections, `useOdometer` rAF engine, `tabular-nums`, mock data, hero +
  marquee ticker.
- **2026-06 — Iteration 2 (Backend + integration):** `seed_counters.py` data matrix
  (32 counters); `GET /api/counters` + `/counters/meta`; MongoDB `live_counters` +
  `counter_meta` auto-seed; server-side `year_start`/`day_start`/`fixed` baseline
  resolution; `CountersContext` fetch-with-mock-fallback. Backend verified 325/325
  assertions; full frontend UI test passed.
- **2026-06 — Iteration 3 (Worldometer-fidelity pass):** removed the giant hero
  (population is now the first row); switched to `Noto Sans`; borderless grey `[+]`;
  lighter grey section titles; header re-clustered (logo + Population + More left,
  English right).
- **2026-06 — Iteration 4 (Disparity Spotlight):** added `recharts`; `↗` per row →
  Radix Dialog with historical trend line and/or comparison bars + "why this
  matters" + source. Coverage extended so **all 32 rows** resolve to an insight via
  `INSIGHTS` + `ALIASES`.

> **Reminder:** update §7–§13 and add a Changelog entry whenever behavior changes.
