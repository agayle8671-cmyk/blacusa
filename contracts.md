# BlacUSA — API Contracts & Integration

## Goal
Move counter baselines from hardcoded frontend mock (`src/mock/data.js`) to the
backend so the server is the single source of truth (per the document's
"client-side extrapolation" model: the server stays passive, the browser does
the per-frame math).

## Endpoint
`GET /api/counters` → returns the full dashboard config:
```json
{
  "hero": { "slug","caption","baselineValue","baselineTimestamp","annualRate","source" },
  "sections": [
    { "key":"demographics", "title":"Demographics & Population",
      "rows": [
        { "slug","label":{"pre","link","post"},"detail","source",
          // live row:
          "baselineValue","baselineTimestamp","annualRate","prefix","suffix","decimals"
          // OR static row:
          "static":"$44,100"
        }
      ]
    }
  ],
  "ticker": ["...", "..."]
}
```

## Server-side baseline resolution
Each stored counter has `baseline_kind`:
- `fixed`     → use stored `baseline_timestamp` + `baseline_value`
- `year_start`→ baseline = Jan 1 of current year, value = 0 (resets annually)
- `day_start` → baseline = local midnight today, value = 0 (resets daily)
The endpoint resolves these to concrete ISO timestamps + values at request time,
so the frontend math `V = Vbase + Rsec*(now-Tbase)` is always correct.

## Mongo collections
- `live_counters` : one doc per metric (`metric_slug` unique) + category/order/label/value fields.
- `counter_meta`  : single doc `{id:"meta", hero, ticker}`.
Both auto-seeded on startup from `seed_counters.py` if empty.

## Frontend integration
- `src/lib/api.js` — `getCounters()` calls `${REACT_APP_BACKEND_URL}/api/counters`.
- `src/context/CountersContext.jsx` — fetches once, provides `{hero, sections, ticker}`.
  Initializes from `mock/data.js` so the UI renders instantly, then swaps in
  server data. Falls back to mock on error.
- `Hero`, `Section`, `Header`, `Ticker`, `Footer`, `Dashboard` consume `useCounters()`.

## Mocked / stub
- The ETL ingestion (FRED/Census/CDC government APIs) described in the document is
  NOT implemented (needs real API keys). Baselines are seeded constants from the
  data matrix. A `GET /api/counters/meta` status echoes this clearly.
