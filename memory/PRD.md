# BlacUSA — Product Requirements Document

## Original Problem Statement
Build "blacusa.com" — a next-generation digital news platform focused on Black Americans, based on the attached strategy document ("Next-Gen News Platform Strategy"). V1 priority: a premium, distinctive look & feel (no generic AI aesthetics) that feels built by a professional product/design team. Implement everything the document suggests. User handles their own deployment (Railway + Vercel).

## User Choices (V1)
- Design: "surprise me" — premium & distinctive (no basic/generic elements).
- Showcase ALL sections: Homepage + article pages, Cold Case/Missing Persons DB (list + map), Membership/News Co-op, About/Mission.
- Realistic placeholder content.
- Easy one-click theme color switching (tokenized CSS variables).
- Fully wired backend (search, DB, submissions). Content to be added by owner later.

## Architecture
- Frontend: React (CRA) + Tailwind + shadcn/ui, react-router, react-query, framer-motion, react-fast-marquee, react-leaflet (OpenStreetMap/Carto tiles — no API key).
- Backend: FastAPI + MongoDB (motor). All routes under /api. Auto-seeds on startup.
- Design: Cormorant Garamond (headings) + Satoshi (body) + JetBrains Mono (overlines). Tokenized HSL theme in index.css; 4 presets in src/lib/themes.js (Heritage Crimson, Liberation Green, Sovereign Gold, Midnight Archive) switchable live via header palette icon (persisted in localStorage).

## Implemented (2026-06)
- Homepage: breaking ticker, editorial bento lead, latest grid, Solutions Journalism band, Cold Case spotlight w/ live stats, Co-op CTA, newsletter band.
- Article detail pages: long-form reading, dropcap, content-warning banners (trauma-informed), byline, tags, related stories.
- Category pages for all 6 beats (Politics, Health Equity, Criminal Justice, Environmental Racism, Solutions, Rural).
- Cold Case database: archival-index list with text search + type/status filters; interactive Leaflet map with colored pins + popups; case count.
- Case detail: dignified record panel, family note, mini-map, contextual tip CTA (prefills tip form).
- Submit-a-tip flow: anonymous option, editorial-review messaging, persists to DB.
- Membership/News Co-op: 3 tiers (Reader/Member/Co-Owner) + join modal (payment illustrative/MOCKED, no Stripe in V1).
- About/Mission: hybrid model, beats, editorial standards (solutions + trauma-informed + person-first + accountable moderation).
- Newsletter subscribe (dedupes). Footer with PIPEDA/CCPA references.
- Backend APIs: /articles, /articles/{slug}, /categories, /cold-cases (+filters/search), /cold-cases/stats, /cold-cases/{case_number}, /tips, /membership/tiers, /membership, /subscribe.
- Verified: 22/22 backend tests + all frontend flows pass (testing agent iteration_1), zero console errors.

## Implemented — Iteration 2 (2026-06): Admin/CMS + map upgrades
- JWT Bearer admin auth (single seeded admin from env), `/admin/login` + protected `/admin/*`.
- Newsroom Console: Overview dashboard; Articles CRUD/publish-draft; Cold Cases CRUD; Tip moderation queue; Audience (subscribers/members) with CSV export.
- Cold Case map: marker clustering (leaflet.markercluster via custom react-leaflet useMap layer) + radius search ("near city within X miles", haversine backend + radius circle).
- Verified: 21/21 new + 22/22 prior backend tests, all admin/map UI flows.

## Implemented — Iteration 3 (2026-06): Uploads, comments, bounds loading
- Image upload via Emergent object storage in article + cold-case editors (admin POST /api/admin/upload; public GET /api/files/{path}); optional family-approved case portrait rendered on case detail.
- Public comments with moderation queue (Canadian intermediary-liability compliant): visitors post -> pending_review -> admin approve/reject in /admin/comments -> approved show publicly. Overview shows comments_pending.
- Bounds-based map loading: "Search this area" button loads only cases in the current viewport (backend min/max lat-lng filter); bounds and radius are mutually exclusive with clear controls.
- Verified: 15/15 new + 43/43 regression backend tests, all UI flows, zero console errors. Real object storage (not mocked).

## Backlog (not yet built)
- P1: Real payments for membership/co-op (Stripe — test key available in env). [DEFERRED at user request]
- P1: CMS/admin to author articles + manage cold cases + moderate tips/comments (doc recommends Sanity headless; here would be an admin UI).
- P1: Authentication + member accounts (member-only content, forum).
- P2: Map clustering + bounds-based loading for large datasets (doc spec); geospatial radius search.
- P2: ETL ingestion from NamUs/public records; events/affiliate revenue modules.
- P2: Migrate FastAPI on_event to lifespan; full PIPEDA/CCPA consent + "Do Not Sell" tooling.

## Next Tasks
1. Confirm visual direction with owner; iterate on any sections they want bolder.
2. Wire real Stripe checkout for membership tiers.
3. Build lightweight admin for content + tip moderation.
