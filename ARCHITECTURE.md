# BlacUSA — Real-Time Demographic & Civic Tracker
## Architectural Report ("Project DNA")

> **Purpose.** This is the single, complete source of truth for the BlacUSA web
> application. It is written so that **any AI agent or human developer** can
> understand exactly what the product is, how every part works, and **rebuild it
> from scratch** without reading the code first. If behavior changes, update this
> file and add a dated entry to the **Changelog** (§19).
>
> **Last updated:** 2026-06-28 (Iteration 5: News Outlets category + Live Headlines Scraper)

---

## 1. What BlacUSA Is

BlacUSA is a **real-time statistical tracker for Black America** — conceptually a
"Worldometer for Black America." It deprecates traditional news/article layouts in
favor of a **brutalist, data-first dashboard** that mirrors the look and behavior of
[worldometers.info](https://www.worldometers.info): rows of large, **live-ticking
numbers** organized into themed sections, each anchored to an authoritative
government data source.

It improves on Worldometer with two signature features:

1. **Disparity Spotlight** — any key metric can be expanded into a panel showing a
   historical trend chart and/or a side-by-side comparison (e.g., Black vs White),
   plus a plain-language "why this matters" and the source.

2. **News Outlets** — a live, autonomously scraped news feed embedded directly in
   the dashboard. 25 major U.S. news organizations are each represented by their
   most recent headline related to Black America, pulled from Google News RSS, refreshed
   automatically every 30 minutes, and displayed inline alongside the statistical data.

### Editorial / data pillars (the six dashboard sections)
1. **Demographics & Population**
2. **Economic Equity & Wealth**
3. **Public Health & Equity**
4. **Environmental Justice**
5. **Criminal Legal System**
6. **News Outlets** ← *added Iteration 5; live-scraped headlines, not ticking numbers*

### Personas
- **General public / readers** — scan the live dashboard, click news headlines to
  read source articles, open Spotlights for context.
- **Journalists / researchers** — cite the figures and sources.
- **Operators / data team** — update the seeded baselines as new official data lands.

### Design ethos
- **Algorithm-proof**: a direct, owned data utility (no feed dependency for statistics).
- **Trauma-informed**: systemic framing, dignified language, no sensationalism.
- **Source-anchored**: every number names its authority (Census, Fed, CDC, USDA, BJS, FBI).
- **Media-critical**: the News Outlets section foregrounds coverage disparities by
  surfacing live headlines next to Disparity Spotlight panels on newsroom diversity
  deficits and media distrust among Black Americans.

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

> **News Outlets exception:** the News Outlets section does NOT use the ticking
> extrapolation engine. It displays live scraped text (headlines), not numbers.
> See §13 for the separate data pipeline.

---

## 3. Tech Stack & Runtime

| Layer | Technology |
|---|---|
| Frontend | React 19 (CRA via `react-scripts` 5 + CRACO 7), React Router 7, Tailwind CSS 3, shadcn/ui (Radix), lucide-react icons, **recharts** (Spotlight charts), **react-fast-marquee** (ticker) |
| Backend | FastAPI 0.110, Motor 3.3 (async MongoDB driver), **httpx** (async HTTP for headline scraping), Pydantic 2, Uvicorn |
| Database | MongoDB (single database, name from `DB_NAME`); three collections: `live_counters`, `counter_meta`, **`news_headlines`** |
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
│   ├── server.py            # FastAPI app: models, seeding, /api routes, baseline
│   │                        # resolution, Google News RSS scraper + /api/headlines
│   ├── seed_counters.py     # THE DATA MATRIX: 57 counters + hero + ticker + section meta
│   │                        # (32 original + 25 news outlet placeholders)
│   ├── requirements.txt     # includes httpx>=0.27.0 for async headline scraping
│   └── .env                 # MONGO_URL, DB_NAME, CORS_ORIGINS
├── frontend/
│   ├── src/
│   │   ├── App.js           # Router + CountersProvider; mounts Header, Ticker, Dashboard, Footer
│   │   ├── index.js         # ReactDOM root
│   │   ├── index.css        # THEME TOKENS (CSS vars) + fonts + .wm/.tnums/.wm-link utilities
│   │   ├── App.css
│   │   ├── hooks/
│   │   │   ├── useOdometer.js        # rAF extrapolation engine (direct DOM mutation)
│   │   │   └── useHeadlines.js       # fetches /api/headlines fresh on every page load
│   │   ├── lib/
│   │   │   ├── api.js                # getCounters() -> GET /api/counters
│   │   │   └── utils.js              # cn() classname helper (shadcn)
│   │   ├── context/
│   │   │   └── CountersContext.jsx   # fetch once, provide {hero, sections, ticker}; mock fallback
│   │   ├── mock/
│   │   │   ├── data.js               # frontend mock mirror of the data matrix (fallback + instant render)
│   │   │   │                         # includes all 6 sections (5 stats + news-outlets placeholder rows)
│   │   │   └── insights.js           # Disparity Spotlight content (history/comparison/summary) by slug
│   │   │                             # includes newsroom-diversity + media-distrust insights
│   │   ├── components/
│   │   │   ├── Header.jsx            # logo + Population + More dropdown (left), English (right), mobile menu
│   │   │   ├── Ticker.jsx            # slim "LIVE" marquee of secondary data points
│   │   │   ├── Section.jsx           # grey uppercase title + stack of WorldRows (statistics sections only)
│   │   │   ├── WorldRow.jsx          # one dashboard line: number | label(+blue link) | ↗ spotlight | [+]
│   │   │   │                         # supports sourceUrl for clickable "Read article" anchor tags
│   │   │   ├── NewsSection.jsx       # dedicated News Outlets section — own data pipeline via useHeadlines
│   │   │   │                         # 25 HeadlineRow components: [Source Name] | [Headline] [Read↗] [time]
│   │   │   ├── SpotlightDialog.jsx   # Radix Dialog + recharts (trend line / comparison bars)
│   │   │   ├── Footer.jsx            # wordmark, section links, data sources
│   │   │   └── Hero.jsx             # DEPRECATED/unused
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

No third-party API keys are required to run. Headlines are scraped from Google News
RSS (a public, no-key endpoint). The optional ETL ingestion for stat baselines
would need FRED/Census/CDC keys — not implemented.

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
- `.wm-link` — Worldometer link blue `#2f6fb0` (the "this year"/"today" words and
  "Read ↗" article links), hover → accent crimson + underline.
- `.wm-section` — light grey `#adadad` for the uppercase section titles.
- `.overline`, `.editorial-rule`, `.grain` — editorial accents.

### Layout
- Centered content column, `max-w-[940px]` (`max-w-[1080px]` for the header bar).
- **Row anatomy** (the Worldometer line): a left **number cell** (`44%` width,
  right-aligned, bold 16px, 1px bottom border) + a right **label cell** (16px, with
  blue link word) + trailing controls (`↗` Spotlight icon when data exists, then a
  plain grey `[+]` expander when a detail note exists).
- **News Outlets rows** reuse the same two-column layout but semantically differently:
  left cell = **source name** (bold), right cell = **headline text** + **"Read ↗"**
  clickable anchor + italic relative timestamp.
- **Section title**: light-grey uppercase, ~19px (`.wm .wm-section`).
- Sticky translucent header with bottom border; slim LIVE marquee below it.

---

## 7. Data Model (MongoDB)

IDs/keys are application-defined; Mongo `_id` is always excluded from API responses
(`{"_id": 0}`). Three collections, all **auto-managed on startup**.

### `live_counters` — one document per statistical metric (57 total)
| Field | Type | Notes |
|---|---|---|
| `metric_slug` | str (unique) | e.g., `black-population`, `births-year`, `nyt-subs` |
| `category` | str | one of: demographics, economics, health, environment, justice, **news-outlets** |
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
| `source` | str\|null | optional source attribution string |
| `source_url` | str\|null | optional direct URL (exposed as `sourceUrl` in API; enables clickable links) |

> **Note on news-outlets rows in `live_counters`:** The 25 news outlet slugs ARE
> seeded into `live_counters` as placeholder static records. However, their live
> headline data is **not read from this collection** — it is read from the dedicated
> `news_headlines` collection instead. The `live_counters` entries serve only to
> register the slugs for nav/counter-meta purposes.

### `counter_meta` — single document `{ id: "meta", … }`
- `hero` — flagship counter config (slug, caption, baseline_*, annual_rate, source).
- `ticker` — array of strings for the LIVE marquee.
- `sections` — `[{ key, title, order }]` in display order (drives nav + grouping).
  Now includes `{ key: "news-outlets", title: "News Outlets" }`.

### `news_headlines` — one document per news outlet (25 total) ← **NEW in Iteration 5**
| Field | Type | Notes |
|---|---|---|
| `slug` | str (unique) | matches `metric_slug` in `live_counters` (e.g., `cnn-visits-today`) |
| `outlet` | str | human-readable outlet name (e.g., `"CNN"`) |
| `headline` | str | the scraped article title, stripped of trailing " - Source Name" |
| `pub_date` | str | raw RSS pubDate string (e.g., `"Sat, 28 Jun 2026 10:00:00 GMT"`) |
| `relative_time` | str | human-readable age (e.g., `"2h ago"`, `"1d ago"`) |
| `url` | str | Google News RSS article redirect URL (clickable) |
| `keyword_matched` | bool | `true` if a Black America keyword matched; `false` if general fallback |
| `scraped_at` | str | ISO timestamp of when this headline was last scraped |

---

## 8. The Seed Data Matrix (`backend/seed_counters.py`)

**57 counters** (20 live stats + 12 static stats + 25 news outlet placeholders) across
6 sections, plus the hero and 8 ticker lines. Built with two helpers:
`_live(slug, category, order, pre, value, kind, rate, **kw)` and
`_static(slug, category, order, pre, static_value, **kw)`.

### Statistical sections (32 counters — unchanged from Iteration 4)

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

### News Outlets section (25 placeholder records)

The 25 slugs below are seeded into `live_counters` as static placeholder records so
the `news-outlets` category registers in `counter_meta`. Their display values are
overridden at runtime by the live headlines system (§13).

| # | Slug | Outlet Name | Metric Type |
|---|---|---|---|
| 1 | `nyt-subs` | The New York Times | 12.8M digital subscribers (static placeholder) |
| 2 | `fox-news-prime` | Fox News Channel | 2.9M prime-time viewers (static placeholder) |
| 3 | `cnn-visits-today` | CNN | day_start live visits (overridden by headlines) |
| 4 | `msnbc-prime` | MSNBC | 940k prime-time viewers (static placeholder) |
| 5 | `abc-evening-news` | ABC News | 8.1M evening viewers (static placeholder) |
| 6 | `nbc-nightly-news` | NBC News | 8.3M nightly viewers (static placeholder) |
| 7 | `cbs-evening-news` | CBS News | 4.8M evening viewers (static placeholder) |
| 8 | `wsj-subs` | The Wall Street Journal | 4.29M digital subscribers (static placeholder) |
| 9 | `wapo-subs` | The Washington Post | 2.5M digital subscribers (static placeholder) |
| 10 | `usa-today-visits` | USA Today | day_start live visits (overridden by headlines) |
| 11 | `yahoo-news-visits` | Yahoo News | day_start live visits (overridden by headlines) |
| 12 | `msn-news-visits` | MSN News | day_start live visits (overridden by headlines) |
| 13 | `pbs-trust` | PBS NewsHour | +26 net trust score (static placeholder) |
| 14 | `npr-listeners` | NPR | 51.5M weekly listeners (static placeholder) |
| 15 | `univision-viewers` | Univision | 33.7M monthly reach (static placeholder) |
| 16 | `telemundo-viewers` | Telemundo | 548k afternoon viewers (static placeholder) |
| 17 | `bbc-news-visits` | BBC News | day_start live visits (overridden by headlines) |
| 18 | `guardian-us-visits` | The Guardian | day_start live visits (overridden by headlines) |
| 19 | `reuters-visits` | Reuters | day_start live visits (overridden by headlines) |
| 20 | `ap-visits` | Associated Press | day_start live visits (overridden by headlines) |
| 21 | `ny-post-visits` | New York Post | day_start live visits (overridden by headlines) |
| 22 | `huffpost-visits` | HuffPost | day_start live visits (overridden by headlines) |
| 23 | `bloomberg-visits` | Bloomberg | day_start live visits (overridden by headlines) |
| 24 | `cnbc-visits` | CNBC | day_start live visits (overridden by headlines) |
| 25 | `newsweek-visits` | Newsweek | day_start live visits (overridden by headlines) |

---

## 9. Backend API Reference (all under `/api`)

| Method | Route | Purpose |
|---|---|---|
| GET | `/` | Health/info — `{ "message": "BlacUSA Real-Time Tracker API" }` |
| GET | `/counters` | **Primary endpoint.** Assembled dashboard config (hero, sections, ticker). |
| GET | `/counters/meta` | Status echo — `{ counters: N, etl_ingestion: "stub", note, generated_at }`. |
| **GET** | **`/headlines`** | **Returns all 25 scraped headlines keyed by slug. Called fresh on every page load. Auto-triggers re-scrape if cache > 35 min old.** |
| **POST** | **`/headlines/refresh`** | **Admin: manually trigger a full headline re-scrape now.** |
| POST | `/status` | Demo: create a status check `{ client_name }`. |
| GET | `/status` | Demo: list status checks. |

### `GET /api/counters` response shape (unchanged)
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
          "sourceUrl": null,
          "baselineValue": 0,
          "baselineTimestamp": "2026-01-01T00:00:00",
          "annualRate": 620000,
          "prefix": "", "suffix": "", "decimals": 0
        }
      ]
    }
  ],
  "ticker": ["Black population reached 49.2M in 2024 — a 36% increase since 2000.", "…"]
}
```
- Row objects now include **`sourceUrl`** (string | null) — populated by the
  headlines scraper for news outlet rows; enables clickable anchor tags in `WorldRow`.

### `GET /api/headlines` response shape ← **NEW**
```json
{
  "headlines": {
    "nyt-subs": {
      "slug": "nyt-subs",
      "outlet": "The New York Times",
      "headline": "Justice Dept.'s Civil Rights Division Is Investigating…",
      "pub_date": "Tue, 07 Apr 2026 07:00:00 GMT",
      "relative_time": "2h ago",
      "url": "https://news.google.com/rss/articles/…",
      "keyword_matched": true,
      "scraped_at": "2026-06-28T11:00:00.000000"
    },
    "cnn-visits-today": { "…": "…" }
  },
  "total": 25,
  "last_updated": "2026-06-28T11:34:21.123456"
}
```

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
from `label_pre/link/post`, includes `sourceUrl` from `source_url`, returns `static`
for static rows, otherwise resolves the baseline and attaches the live fields.

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
        └──► Dashboard.jsx
               │
               ├── Section.jsx × 5        (demographics, economics, health, environment, justice)
               │   └── WorldRow.jsx        (useOdometer / static / SpotlightDialog)
               │
               └── NewsSection.jsx        (news-outlets — SEPARATE pipeline, never via CountersContext)
                   └── useHeadlines.js ──► GET /api/headlines (fresh on every page load)

MongoDB news_headlines
        │  (populated by headline_scraper_loop running in the background)
        ▼
GET /api/headlines  ──►  { headlines: { slug: { headline, url, relative_time, … } }, total, last_updated }
        │
        ▼
useHeadlines() hook  ──►  NewsSection.jsx  ──►  25 × HeadlineRow
```

### Key modules
- **`CountersContext.jsx`** — `CountersProvider` fetches `/api/counters` once on
  mount. Initializes from `mock/data.js` for instant paint; replaces with server
  data on success; keeps mock on error. `useCounters()` returns `{ hero, sections,
  ticker }`. **Does not handle news headlines.**
- **`Dashboard.jsx`** — filters `news-outlets` out of `sections` (so it never
  renders through `WorldRow`), maps remaining sections → `<Section>`, then renders
  `<NewsSection />` at the bottom. Appends methodology footnote.
- **`Section.jsx`** — renders the light-grey uppercase `title` and maps `rows` →
  `<WorldRow>`. Used only for the 5 statistical sections.
- **`WorldRow.jsx`** — renders the number cell (`<LiveNumber>` via `useOdometer`, or
  the `static` string), the label with optional blue link word, a `↗` **Spotlight**
  button when `hasInsight(slug)`, and a `[+]` expander when `detail` exists. When
  `row.sourceUrl` is present, the link word renders as a real `<a>` anchor tag
  (target `_blank`) rather than a `<span>`.
- **`NewsSection.jsx`** — self-contained news feed component. Calls `useHeadlines()`
  independently. Renders 25 `HeadlineRow` sub-components. Shows a live count badge
  (`X/25 live`), a last-updated timestamp, and a manual **Refresh** button. During
  loading shows animated skeleton placeholders.
- **`useHeadlines.js`** — custom hook. On mount, fetches `GET /api/headlines` with a
  `?_t=<timestamp>` cache-busting param (forces fresh data on every page load). Sets
  up a `setInterval` to re-fetch every 30 minutes (matching the backend scraper
  cycle). Returns `{ headlines, loading, error, lastUpdated, refresh }`.
- **`Header.jsx`** — left cluster: two-tone `blacusa` wordmark + `Population`
  (scrolls to demographics) + `More ▾` dropdown (lists all sections, smooth-scroll,
  including News Outlets); right: `English`. Mobile: hamburger → section list.
- **`Ticker.jsx`** — `react-fast-marquee`, a crimson `LIVE` chip + scrolling ticker
  strings.
- **`Footer.jsx`** — wordmark, section quick-links, consolidated source list.

### Test IDs (stable hooks for automated testing)
`section-<key>`, `section-news-outlets`, `row-<slug>`, `expand-<slug>`,
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

---

## 13. The News Outlets System — Comprehensive Architecture ← **NEW in Iteration 5**

This is a fully autonomous, self-refreshing live news feed embedded in the dashboard.
It runs on a completely separate data pipeline from the statistical counters.

### 13a. The Problem Being Solved
The News Outlets section exists to hold a mirror to mainstream media's relationship
with Black America. Instead of displaying raw visitor counts or subscription numbers
for each outlet, the dashboard shows the most recent article from that outlet that
mentions Black people, civil rights, racial equity, or related topics. This turns the
section into a live index of what major outlets are (and aren't) covering.

Key data: 88% of Black adults report encountering inaccurate news about their
communities; 83.7% of newsroom supervisory positions are held by White journalists
while only 6% are Black. The Disparity Spotlight panels attached to each outlet row
surface these disparities.

### 13b. Backend: Google News RSS Scraper (`server.py`)

**Data source:** Google News RSS search API (public, no key required):
```
https://news.google.com/rss/search?q=source:"CNN" ("Black America" OR "African American")&hl=en-US&gl=US&ceid=US:en
```

**Scraping strategy — progressive keyword narrowing:**
For each of the 25 outlets the scraper tries keyword variants in order, stopping at
the first non-empty result:
1. `"Black America" OR "Black Americans"`
2. `"African American" OR "Black people"`
3. `"racial" OR "civil rights"`
4. `"diversity" OR "segregation" OR "voting rights"`
5. **Fallback:** no keyword filter — returns the outlet's latest story regardless of topic

This ensures every outlet always has a headline even if they haven't covered a
Black America topic recently; the `keyword_matched` field records which path was used.

**Parser (`_parse_rss_items`):**
- Parses RSS XML with `xml.etree.ElementTree` (stdlib, no external dep)
- Strips the trailing ` - Source Name` that Google News appends to all titles
- Returns `[{ title, pub_date, link }]`

**Relative time (`_relative_time`):**
- Tries three common RSS `pubDate` format patterns
- Returns human-readable string: `"5m ago"`, `"3h ago"`, `"2d ago"`

**Scraper loop (`headline_scraper_loop`):**
- Launches immediately on FastAPI `startup` event via `asyncio.create_task()`
- Scrapes all 25 outlets sequentially (0.5s delay between requests)
- Upserts each result into `news_headlines` collection by slug
- Sleeps 30 minutes, then repeats indefinitely
- Never blocks the main event loop (fully async with `httpx.AsyncClient`)

**Staleness auto-refresh in `/api/headlines`:**
- When the endpoint is called, it checks the `scraped_at` timestamp of the oldest
  cached headline
- If older than 35 minutes, it launches a background re-scrape
  (`asyncio.create_task(run_headline_scraper())`) without delaying the response
- This means a page load can trigger a scrape if the server restarted recently

### 13c. Frontend: `NewsSection.jsx` + `useHeadlines.js`

**`useHeadlines` hook:**
```
mount → GET /api/headlines?_t={Date.now()}  (cache-busting)
       → setHeadlines(data.headlines)
       → setInterval(re-fetch, 30 minutes)
       → returns { headlines, loading, error, lastUpdated, refresh }
```

**`NewsSection` component layout:**
```
┌─ Section Header ──────────────────────────────────────────────────────┐
│  NEWS OUTLETS              [Wifi] 25/25 live    [↺ Refresh]           │
│  Headlines last refreshed: 11:34 AM — scraped from Google News RSS    │
├─ HeadlineRow × 25 ────────────────────────────────────────────────────┤
│  [ The New York Times ]  Justice Dept.'s Civil Rights Division…       │
│                           Read ↗   2h ago            [↗] [+]          │
│  [ Fox News Channel ]    Supreme Court rules on key Voting Rights…    │
│                           Read ↗   5h ago            [↗] [+]          │
│  [ CNN ]                 Loading latest headline…  (animated pulse)   │
│  …                                                                    │
└───────────────────────────────────────────────────────────────────────┘
```

**HeadlineRow behavior:**
- Left column (44%): outlet name in bold (`<span className="tnums">`)
- Right column (flex-1): headline text + `Read ↗` anchor (opens source in new tab)
  + relative timestamp in muted italic
- Animated skeleton placeholder while `loading && !headlineData`
- `[+]` expander shows raw `pub_date` + whether keyword matched
- `↗` Spotlight icon when `hasInsight(slug)` — launches Disparity Spotlight panel

**Per-page-load freshness:** `useHeadlines` uses `?_t=Date.now()` to bypass any
browser or CDN cache. Every page load triggers a fresh network request to
`/api/headlines`. The backend then decides whether to serve cached data or kick off
a new scrape.

---

## 14. The Disparity Spotlight (signature feature)

**Files:** `components/SpotlightDialog.jsx` + `mock/insights.js`.

- `mock/insights.js` exports `getInsight(slug)` and `hasInsight(slug)`. It holds an
  `INSIGHTS` map keyed by slug and an `ALIASES` map so related rows share one
  insight.
- An insight may contain:
  - `summary` — plain-language "why this matters".
  - `history` — `{ label, unit, data:[{name,value}] }` → rendered as a **recharts
    line chart**.
  - `comparison` — `{ label, unit, rows:[{label,value,accent}] }` → rendered as a
    **horizontal bar chart**; `accent:true` bars use crimson, others muted grey.
  - `source`.

### News Outlets Spotlights (added Iteration 5)

Two new insights were added to cover all 25 news outlet slugs:

**`"newsroom-diversity"`** — mapped to: all print/broadcast/digital outlets (nyt-subs,
wapo-subs, wsj-subs, abc-evening-news, nbc-nightly-news, cbs-evening-news,
usa-today-visits, ny-post-visits, huffpost-visits, bloomberg-visits, cnbc-visits,
newsweek-visits, univision-viewers, telemundo-viewers, bbc-news-visits,
guardian-us-visits, reuters-visits, ap-visits).
- Comparison: White Supervisors 83.7% · Black Journalists 6.0% · Black Population 13.6%
- Source: CAJ Diversity Survey / Pew Research (2022-2024)

**`"media-distrust"`** — mapped to: cable/digital aggregators (fox-news-prime,
cnn-visits-today, msnbc-prime, yahoo-news-visits, msn-news-visits, pbs-trust,
npr-listeners).
- Comparison: Encounter inaccurate news 88% · Believe inaccuracies intentional 73%
  · Coverage disproportionately negative 63% · Media designed to hold Black people back 52%
- Source: Pew Research Center / Center for Media Engagement (2023-2024)

---

## 15. Build From Scratch — Step by Step

1. **Scaffold** a React (CRA + CRACO, `@`→`src` alias) + FastAPI + MongoDB project.
   Set `REACT_APP_BACKEND_URL` (frontend) and `MONGO_URL`/`DB_NAME`/`CORS_ORIGINS`
   (backend). Backend binds `0.0.0.0:8001`; all routes under `/api`.
2. **Backend data matrix** — create `seed_counters.py` with `_live`/`_static`
   helpers, the 57 counters (32 statistical + 25 news outlet placeholders), `HERO`,
   `TICKER_ITEMS`, `SECTION_META` (§8).
3. **Backend app** — in `server.py`: connect Motor; on `startup` seed
   `live_counters` + `counter_meta` if empty; implement `_resolve_baseline` (§10)
   and `_row_to_public` (includes `sourceUrl`); expose `GET /api/counters`;
   implement the headline scraper system and `GET /api/headlines` (§13); add
   permissive CORS; launch `headline_scraper_loop()` in background on startup.
4. **Frontend theme** — put the color tokens + fonts + `.wm/.tnums/.wm-link/
   .wm-section` utilities into `index.css`; wire fonts in `tailwind.config.js`.
5. **Engine** — implement `useOdometer` (rAF + ref + tabular-nums) (§12).
6. **Data layer** — `lib/api.js#getCounters()`; `context/CountersContext.jsx`
   (mock-initialized provider + `useCounters`); `mock/data.js` mirror for fallback
   (includes all 6 sections).
7. **UI** — `WorldRow` (number/label/`↗`/`[+]`, sourceUrl → anchor), `Section`,
   `Header`, `Ticker` (marquee), `Footer`.
8. **News Outlets pipeline** — `useHeadlines.js` hook + `NewsSection.jsx` component
   (§13c). Wire into `Dashboard.jsx` — filter `news-outlets` from `sections`, render
   `<NewsSection />` separately.
9. **Spotlight** — `mock/insights.js` (insights + aliases including news outlet
   entries) and `SpotlightDialog` (Radix Dialog + recharts). Show `↗` only when
   `hasInsight(slug)`.
10. **Compose** — `App.js`: `CountersProvider` → `BrowserRouter` → `Header`,
    `Ticker`, `Routes(/ → Dashboard)`, `Footer`.
11. **Verify** — counters tick; news headlines load fresh on each page load; "Read ↗"
    links open source articles; Refresh button works; Spotlights open correctly.

---

## 16. What Is Mocked / Not Built

- **MOCKED / STUB — ETL ingestion.** A scheduled pipeline pulling fresh stat
  baselines from **FRED / Census / CDC WONDER** APIs is **not implemented** (needs
  real API keys). Baselines are seeded constants; `GET /api/counters/meta` returns
  `etl_ingestion: "stub"`.
- **Projected metrics.** Some health/justice "today/this year" rates (asthma ER
  visits, maternal deaths) are reasonable projections from published rates, labeled
  "Projected" in their `detail`/`source`.
- **Spotlight insights** live on the frontend as static reference data (not yet a
  backend collection).
- No auth, no write-API for editing counters via UI, no persistence beyond the seed.
- **Headlines are scraped, not API-sourced.** Google News RSS returns publicly
  available article titles with redirect URLs. The scraper does not access full
  article content.

---

## 17. Run, Test & Deploy

- **Local dev:** services run under supervisor (`backend :8001`, `frontend :3000`).
  Restart only after `.env`/dependency changes:
  `sudo supervisorctl restart all`.
- **Smoke test the API:**
  ```bash
  API=$(grep REACT_APP_BACKEND_URL frontend/.env | cut -d= -f2)
  curl -s "$API/api/counters"     | head -c 400
  curl -s "$API/api/headlines"    | python3 -m json.tool | head -c 800
  curl -s -X POST "$API/api/headlines/refresh"
  ```
- **Backend deps:** `pip install <pkg> && pip freeze > backend/requirements.txt`.
  **Frontend deps:** `yarn add <pkg>` (never npm).
- **Deploy:** backend → Railway (set the three env vars; Mongo via managed URL).
  On first boot, `seed_counters()` runs, then `headline_scraper_loop()` launches
  immediately in the background — first headlines appear within ~30-60 seconds.
  Frontend → Vercel (root `frontend/`, set `REACT_APP_BACKEND_URL` to the Railway
  URL without trailing slash).
- **Yarn lock:** `frontend/yarn.lock` is committed and tracked. Vercel uses Yarn
  (not npm) to install. This resolves the `date-fns` peer dependency conflict with
  `react-day-picker`.

---

## 18. Extending the System

- **Add a statistical metric:** append a `_live`/`_static` entry to `seed_counters.py`
  (unique `metric_slug`, correct `category`/`order`/`baseline_kind`). Mirror it in
  `mock/data.js` for fallback. On an existing DB, the new doc upserts automatically
  on restart via `$setOnInsert`.
- **Add a section:** add to `SECTION_META` (backend) + ensure rows reference its
  `category`. Nav/footer pick it up automatically. Mirror in `mock/data.js`.
- **Add a news outlet:** add slug → name to `OUTLET_MAPPING` in `server.py` + a
  placeholder row to `seed_counters.py` + an entry in `OUTLETS` array in
  `NewsSection.jsx`.
- **Add a Spotlight:** add an entry to `INSIGHTS` (or an `ALIASES` mapping) in
  `mock/insights.js`; the `↗` appears automatically via `hasInsight(slug)`.
- **Re-theme:** edit the CSS variables in `index.css` only.
- **Change scrape frequency:** adjust `SCRAPE_INTERVAL_SECS` in `server.py`
  (currently 1800 = 30 min). The staleness threshold in `get_headlines()` should
  be set to ~`SCRAPE_INTERVAL_SECS / 60 + 5` minutes.
- **Enable live stat data:** implement the ETL pipeline to refresh `live_counters`
  baselines on a schedule; the frontend math needs no changes.

---

## 19. Component / Route Map (quick reference)

| Route | Component | Summary |
|---|---|---|
| `/` | `Dashboard` | Worldometer-style sections of live + static rows + news headlines feed. |

| Mount order in `App.js` | Component |
|---|---|
| 1 | `CountersProvider` (data context) |
| 2 | `Header` |
| 3 | `Ticker` |
| 4 | `Dashboard` (the only route) |
| 5 | `Footer` |

| `Dashboard` render order | Component |
|---|---|
| 1–5 | `Section` × 5 (demographics, economics, health, environment, justice) |
| 6 | `NewsSection` (news-outlets — own pipeline) |

---

## 20. Changelog

- **2026-06 — Iteration 1 (Frontend MVP):** Worldometer-style dashboard with 5
  custom sections, `useOdometer` rAF engine, `tabular-nums`, mock data, hero +
  marquee ticker.
- **2026-06 — Iteration 2 (Backend + integration):** `seed_counters.py` data matrix
  (32 counters); `GET /api/counters` + `/counters/meta`; MongoDB `live_counters` +
  `counter_meta` auto-seed; server-side `year_start`/`day_start`/`fixed` baseline
  resolution; `CountersContext` fetch-with-mock-fallback.
- **2026-06 — Iteration 3 (Worldometer-fidelity pass):** removed the giant hero
  (population is now the first row); switched to `Noto Sans`; borderless grey `[+]`;
  lighter grey section titles; header re-clustered (logo + Population + More left,
  English right).
- **2026-06 — Iteration 4 (Disparity Spotlight):** added `recharts`; `↗` per row →
  Radix Dialog with historical trend line and/or comparison bars + "why this
  matters" + source. All 32 rows resolve to an insight.
- **2026-06-28 — Iteration 5 (News Outlets + Live Headlines Scraper):**
  - Added **6th dashboard section** — "News Outlets" — tracking the Top 25 U.S.
    news organizations.
  - Added 25 outlet placeholder records to `seed_counters.py` + `mock/data.js`.
  - Added `("news-outlets", "News Outlets")` to `SECTION_META`; `counter_meta`
    auto-merges on restart.
  - Built **Google News RSS headline scraper** in `server.py`: `OUTLET_MAPPING`,
    `KEYWORD_VARIANTS` (4 progressive keyword tiers + fallback), `_parse_rss_items`,
    `_relative_time`, `_google_news_rss`, `scrape_outlet`, `run_headline_scraper`,
    `headline_scraper_loop` (starts immediately on startup, repeats every 30 min).
  - Added `news_headlines` MongoDB collection; scraper upserts by slug.
  - Added `GET /api/headlines` endpoint (returns all 25 cached headlines; triggers
    auto-refresh if cache > 35 min old) and `POST /api/headlines/refresh` (admin).
  - Added `httpx>=0.27.0` to `requirements.txt`.
  - Added `sourceUrl` field to `_row_to_public` output.
  - Built `useHeadlines.js` hook: fetches `/api/headlines` fresh on every page load
    with cache-busting param; re-polls every 30 min via `setInterval`.
  - Built `NewsSection.jsx`: self-contained component with own data pipeline; 25
    `HeadlineRow` sub-components (source name | headline | `Read ↗` anchor |
    relative time); animated loading skeleton; live count badge; manual Refresh
    button; last-updated timestamp.
  - Updated `Dashboard.jsx` to filter `news-outlets` from `sections` and render
    `<NewsSection />` separately.
  - Updated `WorldRow.jsx` to render a real `<a>` anchor when `row.sourceUrl` is
    present.
  - Added `"newsroom-diversity"` and `"media-distrust"` Spotlight insights to
    `mock/insights.js` covering all 25 outlet slugs via ALIASES.

> **Reminder:** update §7–§14 and add a Changelog entry whenever behavior changes.
