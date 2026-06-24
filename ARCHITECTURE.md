# BlacUSA — Architecture Report

> **Purpose of this document.** A single, detailed source of truth describing exactly what the BlacUSA website is, what it contains, and how every part functions — written so that any human developer or AI agent can understand and safely extend the system without reading all the code first.
>
> **This file must be kept up to date.** Whenever a feature, route, model, page, or behavior changes, update the relevant section here and add a dated line to the **Changelog** at the bottom. Treat it as part of "definition of done."
>
> **Last updated:** 2026-06 (Iteration 4)

---

## 1. What BlacUSA Is

BlacUSA (intended domain `blacusa.com`) is a **next-generation digital news + civic-utility platform for and about Black Americans.** It is not a generic blog — it is a serious journalism product with a civic database and a community-ownership model. It pairs editorial reporting with two flagship civic features: a dignified **Cold Case & Missing Persons database** and a **digital news co-operative** membership model.

Editorial pillars: Politics, Health Equity, Criminal Justice, Environmental Racism, Solutions Journalism, and Rural (the Black Belt). The product is explicitly built to be **"algorithm-proof"** (loyal direct audience), **solutions-oriented** (energizing, not doom-scroll), and **trauma-informed** (dignified treatment of victims/families, content warnings, person-first language, moderation before publication).

### Audience / personas
- **Readers** — consume reporting, browse the cold-case database, subscribe to the newsletter, and (with a free verified account) comment.
- **Community tipsters & families** — submit confidential tips on cold cases.
- **Members / Co-owners** — financially support and (in the co-op model) co-own the newsroom.
- **Editorial staff (admin)** — author content, manage the cold-case record, moderate tips and comments, curate the homepage, and view audience data via the Newsroom Console.

---

## 2. Tech Stack & Runtime

| Layer | Technology |
|---|---|
| Frontend | React 19 (CRA / react-scripts 5), React Router 7, TanStack React Query 5, Tailwind CSS + shadcn/ui (Radix), framer-motion, lucide-react icons, sonner toasts |
| Maps | react-leaflet 5 + leaflet 1.9 + leaflet.markercluster (CARTO light tiles, no API key) |
| Ticker | react-fast-marquee |
| Backend | FastAPI 0.110, Motor 3.3 (async MongoDB), Pydantic 2 |
| Auth | JWT (PyJWT) Bearer tokens, bcrypt password hashing |
| Images | Pillow (resize/compress) + Emergent object storage (via `requests`, offloaded with `asyncio.to_thread`) |
| Database | MongoDB (single database, name from `DB_NAME`) |

### Process / hosting model (this environment)
- **Backend** runs on `0.0.0.0:8001` (supervisor-managed). **All API routes are prefixed with `/api`** and exposed externally through Kubernetes ingress.
- **Frontend** runs on port `3000` (supervisor-managed) with hot reload.
- The frontend calls the backend **only** via `process.env.REACT_APP_BACKEND_URL` + `/api/...`. Never hardcode URLs.
- The owner deploys to **Railway (backend) + Vercel (frontend)** in production.
- Supervisor restart: `sudo supervisorctl restart backend|frontend` (only needed after `.env` or dependency changes; code changes hot-reload).

### Environment variables
- `backend/.env`: `MONGO_URL`, `DB_NAME` (do not change keys), `CORS_ORIGINS`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `EMERGENT_LLM_KEY` (used to init object storage), `GROQ_API_KEY` (Groq API key — required for AI features and the news scraper).
- `frontend/.env`: `REACT_APP_BACKEND_URL` (production external URL — do not change).

---

## 3. Repository Layout

```
/app
├── backend/
│   ├── server.py          # FastAPI app: all routes, auth, models, seeding, image opt
│   ├── seed_data.py        # Seed content: ARTICLES, COLD_CASES, MEMBERSHIP_TIERS, CATEGORIES, IMG map
│   ├── storage.py          # Emergent object storage helpers (init/put/get), MIME map
│   ├── requirements.txt
│   ├── .env
│   └── tests/              # pytest suites created by the testing agent
├── frontend/
│   ├── src/
│   │   ├── App.js          # Router + AuthProvider wrapper
│   │   ├── index.js        # ReactDOM root, QueryClientProvider, sonner Toaster
│   │   ├── index.css       # THEME TOKENS (CSS vars) + fonts + utilities (single source of color truth)
│   │   ├── App.css
│   │   ├── lib/
│   │   │   ├── api.js       # Public axios client + endpoint functions; exports API base
│   │   │   ├── auth.jsx     # Unified AuthProvider (readers+admin), adminClient (token interceptor), formatApiError
│   │   │   ├── adminApi.js  # Admin-only endpoint functions (use adminClient)
│   │   │   └── themes.js    # 4 color presets + applyTheme()/getStoredTheme()
│   │   ├── components/
│   │   │   ├── layout/{Header,Footer,Layout}.jsx
│   │   │   ├── BreakingTicker.jsx, ThemeSwitcher.jsx
│   │   │   ├── ArticleCard.jsx, CaseRow.jsx, CaseMap.jsx
│   │   │   ├── Newsletter.jsx (NewsletterInline + NewsletterBand)
│   │   │   ├── CommentSection.jsx, ImageUploadField.jsx
│   │   │   └── ui/          # shadcn components
│   │   └── pages/
│   │       ├── Home.jsx, ArticlePage.jsx, CategoryPage.jsx
│   │       ├── ColdCases.jsx, CaseDetail.jsx, SubmitTip.jsx
│   │       ├── Membership.jsx, About.jsx, Account.jsx
│   │       └── admin/{AdminLogin,AdminLayout,AdminOverview,AdminArticles,
│   │                  AdminArticleEditor,AdminCases,AdminCaseEditor,AdminTips,
│   │                  AdminComments,AdminHomepage,AdminAudience}.jsx
│   ├── package.json, tailwind.config.js, postcss.config.js, .env
├── ARCHITECTURE.md         # (this file)
├── auth_testing.md         # Auth testing playbook
└── memory/{PRD.md, test_credentials.md}
```

---

## 4. Design System (look & feel)

The brand is **bold, editorial, dignified** — deliberately not generic. Key rules:
- **Color is fully tokenized** as CSS variables in `frontend/src/index.css` (HSL triplets consumed via `hsl(var(--token))` in Tailwind). To re-theme the entire site, edit those variables. **`src/lib/themes.js`** defines 4 one-click presets — `heritage` (Heritage Crimson, default), `liberation` (Pan-African green), `gold` (Sovereign Gold), `midnight` (dark). The header palette icon (`ThemeSwitcher`) applies a preset live and persists the choice in `localStorage["blacusa-theme"]`.
- **Typography:** `Cormorant Garamond` (serif headings, `.font-heading`), `Satoshi` (body, default sans), `JetBrains Mono` (overlines/labels, `.font-mono` / `.overline`). Loaded via Google Fonts + Fontshare `@import` in index.css.
- **Motifs:** hard edges (`--radius: 0px`), dotted "editorial-rule", subtle film `grain` overlay on dark bands, image treatment `.img-editorial` (slight grayscale/contrast), drop-cap on article first paragraph, breaking-news ticker.
- **Accessibility/test hooks:** every interactive/important element has a kebab-case `data-testid`.

---

## 5. Data Model (MongoDB collections)

IDs are application-generated UUID strings stored in an `id` field; Mongo `_id` is always excluded from API responses (`{"_id": 0}`). Datetimes are stored as ISO strings (UTC).

| Collection | Key fields | Notes |
|---|---|---|
| `articles` | `id, slug (unique), title, dek, category, author, author_role, read_minutes, is_solutions, is_featured, is_published, publish_at (ISO|null), image, content_warning, tags[], body[] (paragraphs), published_at` | `body` is an array of paragraph strings. Public visibility = `article_is_live()` (see §7). |
| `cold_cases` | `id, case_number (unique), name, age, sex, race, case_type, status, date_reported, city, state, lat, lng, agency, agency_phone, summary, family_note, image (optional)` | `case_type` ∈ {Missing Person, Homicide, Civil Rights}; `status` ∈ {Open, Cold, Solved}. |
| `tips` | `id, case_number, case_name, name, contact, message, anonymous, status, created_at` | `status` ∈ {pending_review, approved, rejected, reviewed}. |
| `comments` | `id, article_slug, article_title, user_id, name, verified, body, status, created_at` | Created only by authenticated users (`verified: true`). `status` ∈ {pending_review, approved, rejected}. Public list shows only `approved`. |
| `users` | `id, email (unique, lowercased), password_hash (bcrypt), name, role, created_at` | `role` ∈ {admin, reader}. Admin seeded from env on startup (idempotent). |
| `subscribers` | `id, email, zip_code, created_at` | Newsletter signups; dedupe by email. |
| `memberships` | `id, tier, name, email, created_at` | Membership "join" records (payment is MOCKED in V1). |
| `files` | `id, storage_path, original_filename, content_type, size, is_deleted, created_at` | Metadata for uploaded images; bytes live in object storage. |
| `site_config` | `id: "homepage", lead, also_leading[], latest[], sections{category:[slugs]}, updated_at` | Single doc holding homepage curation. |

### Seed data (`seed_data.py`)
On startup the backend seeds **8 articles** and **10 cold cases** (only if those collections are empty), plus a backfill that sets `is_published=true` on any legacy article lacking the flag. `MEMBERSHIP_TIERS` (Reader $0, Member $12/mo, Co-Owner $250 one-time) and `CATEGORIES` (6) are served directly from constants (not stored). The admin user is seeded/synced from `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

---

## 6. Authentication & Authorization

- **Scheme:** JWT Bearer tokens (HS256, `JWT_SECRET`), 12-hour expiry. Token carries `sub` (user id) + `email`.
- **Storage (frontend):** `localStorage["blacusa-token"]` — **one unified session for both admins and readers**. `adminClient` (axios) attaches `Authorization: Bearer <token>` to every request via an interceptor.
- **Backend dependencies:**
  - `get_current_user` — resolves any authenticated user (reader or admin); 401 if missing/invalid/expired.
  - `get_current_admin` — builds on `get_current_user` and requires `role == "admin"` (else 403).
- **Frontend context:** `AuthProvider` (`lib/auth.jsx`) exposes `{ user, ready, login, register, logout }`. `user` is `null` (checking) → `false` (anonymous) → object `{email, name, role}`. On mount it calls `GET /api/auth/me`.
- **Role separation:** `AdminLayout` redirects to `/admin/login` unless `user.role === "admin"`. `/admin/login` rejects non-admin accounts with an explicit message. Readers can never reach the console.
- **Password rules:** bcrypt hashing; reader registration requires name + valid email + password ≥ 8 chars; login returns identical 401 for unknown-email vs wrong-password (no enumeration).
- **Default admin:** `admin@blacusa.com` / `BlacUSA2026!` (change via `backend/.env`). Documented in `memory/test_credentials.md` and `auth_testing.md`.

> **Rule for future auth changes:** authentication is an integration — route any auth changes through the integration playbook before editing code.

---

## 7. Backend API Reference (all under `/api`)

### Public — content
- `GET /` — health/info.
- `GET /categories` — 6 editorial categories.
- `GET /articles?category=&solutions=&featured=&limit=` — **live** articles only (see visibility rule). When `category` is set, honors admin section ordering from `site_config`.
- `GET /articles/{slug}` — `{article, related[3]}`; 404 if not found **or not live**.
- `GET /homepage` — resolved `{lead, also_leading[], latest[]}` from curation config, with automatic fallbacks (featured/recent) so the page is always full.

**Article visibility (`article_is_live`)**: an article is public iff `is_published != false` AND (`publish_at` is empty OR `publish_at <= now`). This powers **scheduled publishing** — a future `publish_at` keeps it a draft until that time, then it auto-appears (evaluated at request time, no cron needed).

### Public — cold cases
- `GET /cold-cases?case_type=&status=&state=&q=&lat=&lng=&radius_miles=&min_lat=&max_lat=&min_lng=&max_lng=` — list + filters. `q` matches name/city/case_number. **Radius search** (lat+lng+radius_miles) uses a haversine filter. **Bounds search** (min/max lat/lng) filters to a map viewport.
- `GET /cold-cases/stats` — `{total, open, cold, solved}`.
- `GET /cold-cases/{case_number}` — single case; 404 if missing.

### Public — engagement
- `POST /tips` — submit a tip (no auth); stored as `pending_review`.
- `GET /membership/tiers` — 3 tiers.
- `POST /membership` — join (records name/email/tier; **payment mocked**).
- `POST /subscribe` — newsletter signup (dedupes).
- `GET /articles/{slug}/comments` — **approved** comments only.
- `POST /articles/{slug}/comments` — **requires auth** (`get_current_user`); stores `pending_review`, `verified: true`, with the user's name.
- `GET /files/{path}` — **public** image serving (streams bytes from object storage, 1-day cache). Offloaded via `asyncio.to_thread`.

### Auth
- `POST /auth/register` — reader signup → `{access_token, user}`.
- `POST /auth/login` — → `{access_token, user}`.
- `GET /auth/me` — current user `{email, name, role}` (any role).

### Admin (all require `get_current_admin`)
- `GET /admin/overview` — counts: articles, published, cold_cases, tips_pending, tips_total, comments_pending, subscribers, memberships.
- Articles: `GET /admin/articles` (all, incl. drafts/scheduled), `POST /admin/articles`, `PUT /admin/articles/{id}`, `DELETE /admin/articles/{id}`. Duplicate slug → 400.
- Cold cases: `GET /admin/cold-cases`, `POST`, `PUT /{id}`, `DELETE /{id}`. Duplicate case_number → 400.
- Tips: `GET /admin/tips?status=`, `PATCH /admin/tips/{id}` (status), `DELETE /admin/tips/{id}`.
- Comments: `GET /admin/comments?status=`, `PATCH /admin/comments/{id}` (approved|rejected|pending_review), `DELETE /admin/comments/{id}`.
- Audience: `GET /admin/subscribers`, `GET /admin/memberships`.
- Uploads: `POST /admin/upload` (multipart `file`) — validates type (jpg/jpeg/png/gif/webp) & size (≤15MB), **optimizes** (resize to ≤2000px wide, compress → JPEG, or PNG if alpha), stores in object storage, records metadata, returns `{url, path, size}`. `url` is an absolute-relative `/api/files/...` path; the frontend prefixes `REACT_APP_BACKEND_URL`.
- Homepage curation: `GET /admin/homepage` → `{config, articles[]}`; `PUT /admin/homepage` saves `{lead, also_leading[], latest[], sections{}}` (upsert).

### Admin — AI Writing Assistant (all require `get_current_admin`, all require `GROQ_API_KEY`)
- `POST /admin/ai/draft-from-headline` — body `{title, category}` → full draft `{dek, tags[], body[], internal_refs[], content_warning}`. Queries MongoDB for related published articles (RAG site memory) and injects them into the Groq prompt so the draft references past coverage.
- `POST /admin/ai/generate-dek` — body `{title, body}` → `{dek}`. Writes a 1–2 sentence standfirst.
- `POST /admin/ai/suggest-tags` — body `{body}` → `{tags[]}`. Suggests 4–6 relevant tags.
- `POST /admin/ai/improve-paragraph` — body `{text}` → `{text}`. Rewrites a paragraph in BlacUSA's trauma-informed editorial voice.

### Admin — News Scraper (requires `get_current_admin` + `GROQ_API_KEY`)
- `POST /admin/scraper/run` — manually triggers the 5-phase RSS pipeline across 25 sources. Returns `{ingested, skipped, errors, sources_checked, timestamp}`. A 24h background loop (`asyncio.create_task`) also runs automatically on startup.
- `GET /admin/scraper/status` — `{running, groq_configured, last_run, sources_count}`.

AI-generated articles are stored with `is_published: false`, `is_ai_draft: true`, `scraped_url`, `scraped_source`, `ai_context_slugs[]` (slugs of BlacUSA articles used as RAG context), and `ai_internal_refs[]` (suggested cross-reference slugs). They never auto-publish.

---

## 8. Frontend Pages & Routes

### Public (wrapped in `Layout` = Header + Footer + page fade)
| Route | Page | Summary |
|---|---|---|
| `/` | `Home` | Masthead quote, editorial bento lead (from `/api/homepage`), Latest grid, Solutions band, Cold Case spotlight + live stats, Membership CTA, Newsletter band. |
| `/article/:slug` | `ArticlePage` | Long-form reading (drop-cap), byline, content-warning banner, tags, related stories, and **CommentSection**. |
| `/category/:slug` | `CategoryPage` | Section hero + lead + grid; honors admin section ordering. |
| `/cold-cases` | `ColdCases` | Hero + stats, search, type/status filter chips, **List ↔ Map** toggle, **radius search** (city + miles), **"Search this area"** bounds loading, legend. |
| `/cold-cases/:caseNumber` | `CaseDetail` | Optional family portrait, dignified record panel, family note, mini-map, contextual tip CTA. |
| `/submit-tip` | `SubmitTip` | Confidential tip form (anonymous option, pre-fills case via query params). |
| `/membership` | `Membership` | Co-op pillars + 3 tiers + join modal (payment mocked). |
| `/about` | `About` | Mission, hybrid model, beats, editorial standards (solutions/trauma-informed/person-first/moderation). |
| `/account` | `Account` | Reader **sign in / create account** tabs. Redirects to `?from=` after auth. |

### Admin (`/admin/*`, guarded by `AdminLayout`; login at `/admin/login`)
| Route | Page | Summary |
|---|---|---|
| `/admin` | `AdminOverview` | Stat cards (incl. tips/comments awaiting review) + quick actions. |
| `/admin/homepage` | `AdminHomepage` | **Front-page curation**: pick Lead, order "Also Leading", "Latest", and per-section stories via up/down/remove; Save. |
| `/admin/articles` | `AdminArticles` | List with Live/Draft/Scheduled badges; new/edit/delete. |
| `/admin/articles/:id` | `AdminArticleEditor` | Create/edit (`:id === "new"` for create). Auto-slug, tags, body (blank-line paragraphs), image upload, **schedule publish** datetime, published/featured/solutions flags. |
| `/admin/cases` | `AdminCases` | Cold-case list; new/edit/delete. |
| `/admin/cases/:id` | `AdminCaseEditor` | Full case form incl. coordinates + optional family-approved portrait upload. |
| `/admin/tips` | `AdminTips` | Tip moderation queue (filter, approve/reject/reopen/delete). |
| `/admin/comments` | `AdminComments` | Comment moderation queue (approve/reject/delete). |
| `/admin/audience` | `AdminAudience` | Subscribers & Members tabs with CSV export. |

Header shows **"Sign in"** (anonymous) or the reader's first name + sign-out (logged in). Footer links to the **Newsroom Console** (`/admin/login`).

---

## 9. Key Cross-Cutting Behaviors

- **Data fetching:** React Query (`staleTime 60s`, no refetch on focus). Query keys encode all filter inputs so caches invalidate correctly. Admin mutations call `qc.invalidateQueries` for the affected keys.
- **Map (`CaseMap.jsx`):** CARTO light tiles; `cluster` prop toggles `leaflet.markercluster` via a custom `useMap` layer (numbered dark cluster badges, colored type pins). `MapController` `flyTo` on radius center; `Circle` draws the radius. `AreaEvents` + a floating **"Search this area"** button report current bounds to the parent. Pin color by `case_type` (`TYPE_COLOR`).
- **Comments moderation flow:** reader posts → `pending_review` → admin approves in console → appears publicly. Nothing publishes automatically (Canadian intermediary-liability posture + trauma-informed ethics).
- **Image pipeline:** editor `ImageUploadField` → `POST /api/admin/upload` → Pillow optimize (≤2000px, JPEG q85 / PNG for alpha) → object storage → DB metadata → public `/api/files/{path}`. Editors may also paste a URL.
- **Scheduled publishing:** purely time-comparison at read time (`article_is_live`); no background worker.
- **Theming:** all colors flow from `index.css` variables; never hardcode hex in components (map popups are a deliberate exception using inline brand hex inside Leaflet-rendered HTML).

---

## 10. What Is Mocked / Not Yet Built

- **MOCKED:** Membership/co-op **payment** is illustrative only (no Stripe in V1).
- **Not built yet (backlog):** real Stripe checkout; Google social login (reader auth is email/password, structured to add it later); image thumbnails; bounds-based loading at true scale (current dataset is small); ETL ingestion from public records (NamUs); reader profile pages; rate-limiting/anti-abuse on public POSTs.

---

## 11. How to Run, Test & Extend

- **Local dev:** services run under supervisor; backend `:8001`, frontend `:3000`. Restart only after `.env`/dependency changes.
- **Backend deps:** `pip install <pkg> && pip freeze > backend/requirements.txt`. **Frontend deps:** `yarn add <pkg>` (never npm).
- **API smoke test:**
  ```bash
  API=$(grep REACT_APP_BACKEND_URL frontend/.env | cut -d '=' -f2)
  curl -s $API/api/articles | head
  TOKEN=$(curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' \
    -d '{"email":"admin@blacusa.com","password":"BlacUSA2026!"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
  curl -s $API/api/admin/overview -H "Authorization: Bearer $TOKEN"
  ```
- **Adding a new model field:** update the Pydantic `*In` model + the relevant route in `server.py`, then the matching editor form + list rendering in the admin page, then this doc.
- **Adding a new page:** create under `src/pages`, register a `<Route>` in `App.js`, add nav where appropriate, add `data-testid`s.
- **Tests:** the testing agent writes pytest suites to `backend/tests/` and reports to `test_reports/iteration_*.json`. Iteration 4 suite: `backend/tests/test_blacusa_iter4.py`.

---

## 12. Changelog

- **2026-06 — Iteration 1 (MVP):** Public site — Home, article pages, 6 category sections, Solutions band, Cold Case database (list + Leaflet map), case detail, submit-tip, membership (3 tiers), About; tokenized theme + 4-preset switcher; FastAPI+Mongo backend auto-seeded (8 articles, 10 cases). Verified 22/22 backend + all UI flows.
- **2026-06 — Iteration 2 (Admin/CMS + map):** JWT admin auth + seeded admin; Newsroom Console (Overview, Articles CRUD/publish, Cold Cases CRUD, Tip moderation, Audience + CSV export); map **marker clustering** + **radius search**. Verified 21/21 new + 22/22 regression.
- **2026-06 — Iteration 3 (Uploads, comments, bounds):** Emergent object-storage **image upload** in article & case editors + optional case portrait; **public comments** with moderation queue; **bounds-based "Search this area"** map loading. Verified 15/15 new + 43/43 regression.
- **2026-06 — Iteration 4 (Readers, curation, scheduling, image opt):** **Reader accounts** (register/login) with unified auth context (token key `blacusa-token`); **commenting now requires a verified account**; **homepage curation** (`/admin/homepage`); **scheduled publishing** (`publish_at`) with CMS badge; **image optimization** (≤2000px + compress) and storage calls offloaded via `asyncio.to_thread`. Verified 19/19 new (100%), no functional bugs.
- **2026-06 — On-brand pass + diagram:** Surfaced the doc's core positioning — header tagline "Algorithm-proof news for Black America", homepage masthead overline "Algorithm-proof journalism · Built for loyal change-seekers"; completed beats in footer (added Rural & The Black Belt); exact CCPA phrasing "Do Not Sell or Share My Personal Information". Added one-page visual system diagram at `/app/SYSTEM_DIAGRAM.html` (print-ready, on-brand).
- **2026-06 — Iteration 5 (Groq AI CMS + News Scraper):** Integrated **Groq API** (`llama-3.3-70b-versatile`) throughout the Newsroom Console. New `backend/scraper.py` module implements a 5-phase pipeline: RSS discovery (25 sources across Black media ecosystem) → body extraction (httpx + BeautifulSoup4) → relevance filtering → RAG site-memory context injection (MongoDB keyword query of existing articles) → Groq rewrite → editorial draft staging (`is_published: false`). Backend: 4 AI-assist routes (`/admin/ai/draft-from-headline`, `/admin/ai/generate-dek`, `/admin/ai/suggest-tags`, `/admin/ai/improve-paragraph`) + 2 scraper routes (`/admin/scraper/run`, `/admin/scraper/status`) + 24h `asyncio` background loop. Frontend: `AdminArticleEditor` gains AI Assist panel (Draft from Headline CTA, inline Suggest Dek/Tags, Improve Paragraph, Internal Reference Chips from RAG context, Accept/Discard flow); `AdminArticles` gains AI Drafts filter tab, Run Scraper button, real-time scraper status bar, source attribution badges. Requires `GROQ_API_KEY` in `backend/.env`.

> **Reminder:** update §5–§9 and add a Changelog entry whenever behavior changes.
