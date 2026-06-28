from fastapi import FastAPI, APIRouter, Header, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import UpdateOne, UpdateMany
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Union
import uuid
from datetime import datetime, timezone
import asyncio
import urllib.parse
import xml.etree.ElementTree as ET
import httpx

from seed_counters import COUNTERS, HERO, TICKER_ITEMS, SECTION_META

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Optional admin token. If set (e.g. on Railway), admin write routes require it.
# If empty (local dev), admin routes are open so you can seed/correct data easily.
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN', '').strip()

app = FastAPI()
api_router = APIRouter(prefix="/api")

VALID_VALUE_TYPES = {"live", "static"}
VALID_BASELINE_KINDS = {"fixed", "year_start", "day_start"}


# ----------------------- Models -----------------------
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class StatusCheckCreate(BaseModel):
    client_name: str


class CounterIn(BaseModel):
    """Definition of a single tracked metric (used by the admin upsert API)."""
    metric_slug: str
    category: str
    order: int = 0
    value_type: str = "live"
    baseline_kind: str = "fixed"
    baseline_value: Optional[float] = None
    baseline_timestamp: Optional[str] = None
    annual_rate: Optional[float] = None
    prefix: str = ""
    suffix: str = ""
    decimals: int = 0
    static_value: Optional[str] = None
    label_pre: str
    label_link: Optional[str] = None
    label_post: Optional[str] = None
    detail: Optional[str] = None
    source: Optional[str] = None
    data_as_of: Optional[str] = None  # date the baseline reflects (for accuracy/freshness)


class SectionIn(BaseModel):
    key: str
    title: str
    order: int = 0


# ----------------------- Helpers -----------------------
def _require_admin(token: Optional[str]):
    if ADMIN_TOKEN and token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid or missing admin token")


def _resolve_baseline(kind, stored_ts, stored_value):
    """Resolve year_start / day_start to a concrete ISO timestamp + value at request time."""
    now = datetime.now()
    if kind == "year_start":
        return datetime(now.year, 1, 1).isoformat(), 0
    if kind == "day_start":
        return datetime(now.year, now.month, now.day).isoformat(), 0
    return stored_ts, stored_value


def _num(v, default=0):
    """Accuracy guard: coerce to a finite number, else default. Prevents NaN/None reaching the UI."""
    try:
        f = float(v)
        if f != f or f in (float("inf"), float("-inf")):
            return default
        return f
    except (TypeError, ValueError):
        return default


def _row_to_public(doc: dict) -> dict:
    label = {"pre": doc.get("label_pre")}
    if doc.get("label_link"):
        label["link"] = doc["label_link"]
    if doc.get("label_post"):
        label["post"] = doc["label_post"]

    row = {
        "slug": doc["metric_slug"],
        "label": label,
        "detail": doc.get("detail"),
        "source": doc.get("source"),
        "sourceUrl": doc.get("source_url"),
        "dataAsOf": doc.get("data_as_of"),
    }

    if doc.get("value_type") == "static":
        row["static"] = doc.get("static_value")
        return row

    ts, value = _resolve_baseline(
        doc.get("baseline_kind", "fixed"),
        doc.get("baseline_timestamp"),
        doc.get("baseline_value"),
    )
    row.update({
        "baselineValue": _num(value, 0),
        "baselineTimestamp": ts,
        "annualRate": _num(doc.get("annual_rate"), 0),
        "prefix": doc.get("prefix", "") or "",
        "suffix": doc.get("suffix", "") or "",
        "decimals": int(doc.get("decimals", 0) or 0),
    })
    return row


def _humanize(key: str) -> str:
    return key.replace("-", " ").replace("_", " ").title()


# ----------------------- Seeding (idempotent, value-preserving) -----------------------
async def seed_counters():
    """
    Insert-if-missing per metric_slug. This BOOTSTRAPS new counters/categories on
    restart WITHOUT overwriting any existing values (so corrections pushed via the
    admin API or a future ETL pipeline are always preserved). Use the admin API to
    update existing numbers.
    """
    ops = [
        UpdateOne({"metric_slug": c["metric_slug"]}, {"$setOnInsert": dict(c)}, upsert=True)
        for c in COUNTERS
    ]
    if ops:
        result = await db.live_counters.bulk_write(ops, ordered=False)
        if result.upserted_count:
            logger.info("Bootstrapped %d new counters", result.upserted_count)

    seed_sections = [{"key": k, "title": t, "order": i} for i, (k, t) in enumerate(SECTION_META)]
    meta = await db.counter_meta.find_one({"id": "meta"})
    if not meta:
        await db.counter_meta.insert_one({
            "id": "meta",
            "hero": HERO,
            "ticker": TICKER_ITEMS,
            "sections": seed_sections,
        })
        logger.info("Seeded counter meta")
    else:
        existing = {s["key"] for s in meta.get("sections", [])}
        merged = list(meta.get("sections", []))
        next_order = len(merged)
        added = False
        for s in seed_sections:
            if s["key"] not in existing:
                merged.append({**s, "order": next_order})
                next_order += 1
                added = True
        if added:
            await db.counter_meta.update_one({"id": "meta"}, {"$set": {"sections": merged}})
            logger.info("Merged new sections into meta")


# ----------------------- Public Routes -----------------------
@api_router.get("/")
async def root():
    return {"message": "BlacUSA Real-Time Tracker API"}


@api_router.get("/counters")
async def get_counters():
    meta = await db.counter_meta.find_one({"id": "meta"}, {"_id": 0})
    if not meta:
        await seed_counters()
        meta = await db.counter_meta.find_one({"id": "meta"}, {"_id": 0})

    docs = await db.live_counters.find({}, {"_id": 0}).to_list(2000)
    docs.sort(key=lambda d: (d.get("category", ""), d.get("order", 0)))

    by_cat = {}
    for d in docs:
        if not d.get("metric_slug") or not d.get("label_pre"):
            continue  # accuracy guard: skip malformed rows
        by_cat.setdefault(d["category"], []).append(_row_to_public(d))

    sections = []
    seen = set()
    meta_sections = sorted(meta.get("sections", []), key=lambda s: s.get("order", 0))
    for s in meta_sections:
        rows = by_cat.get(s["key"], [])
        if rows:
            sections.append({"key": s["key"], "title": s["title"], "rows": rows})
            seen.add(s["key"])

    # Auto-surface any category present in the data but not yet titled in meta
    # -> unlimited categories work even before you register a title.
    for cat, rows in by_cat.items():
        if cat not in seen and rows:
            sections.append({"key": cat, "title": _humanize(cat), "rows": rows})

    hero = dict(meta.get("hero", {}))
    ts, value = _resolve_baseline(
        hero.get("baseline_kind", "fixed"),
        hero.get("baseline_timestamp"),
        hero.get("baseline_value"),
    )
    hero_public = {
        "slug": hero.get("slug"),
        "caption": hero.get("caption"),
        "baselineValue": _num(value, 0),
        "baselineTimestamp": ts,
        "annualRate": _num(hero.get("annual_rate"), 0),
        "source": hero.get("source"),
    }

    return {"hero": hero_public, "sections": sections, "ticker": meta.get("ticker", [])}


@api_router.get("/counters/meta")
async def get_counters_meta():
    count = await db.live_counters.count_documents({})
    meta = await db.counter_meta.find_one({"id": "meta"}, {"_id": 0}) or {}
    return {
        "counters": count,
        "sections": [s.get("key") for s in sorted(meta.get("sections", []), key=lambda s: s.get("order", 0))],
        "admin_protected": bool(ADMIN_TOKEN),
        "etl_ingestion": "stub",
        "note": "DB is the runtime source of truth. Push accurate updates / new categories via "
                "POST /api/admin/counters and /api/admin/sections. Startup only bootstraps missing "
                "counters and never overwrites existing values.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


# ----------------------- Admin Routes (data accuracy & extensibility) -----------------------
@api_router.post("/admin/counters")
async def upsert_counters(
    payload: Union[CounterIn, List[CounterIn]],
    x_admin_token: Optional[str] = Header(default=None),
):
    """
    Upsert one or many counter definitions (overwrite by metric_slug).
    This is how a future ETL/cron or an operator pushes ACCURATE numbers and adds
    new metrics. New categories appear automatically; register a title via
    /api/admin/sections (optional — otherwise a humanized title is used).
    """
    _require_admin(x_admin_token)
    items = payload if isinstance(payload, list) else [payload]
    ops = []
    for c in items:
        if c.value_type not in VALID_VALUE_TYPES:
            raise HTTPException(400, f"value_type must be one of {VALID_VALUE_TYPES}")
        if c.baseline_kind not in VALID_BASELINE_KINDS:
            raise HTTPException(400, f"baseline_kind must be one of {VALID_BASELINE_KINDS}")
        doc = c.dict()
        ops.append(UpdateOne({"metric_slug": c.metric_slug}, {"$set": doc}, upsert=True))
    if ops:
        res = await db.live_counters.bulk_write(ops, ordered=False)
        return {"matched": res.matched_count, "upserted": res.upserted_count, "modified": res.modified_count}
    return {"matched": 0, "upserted": 0, "modified": 0}


@api_router.post("/admin/sections")
async def upsert_sections(
    payload: Union[SectionIn, List[SectionIn]],
    x_admin_token: Optional[str] = Header(default=None),
):
    """Register / rename / reorder categories (section titles + display order)."""
    _require_admin(x_admin_token)
    items = payload if isinstance(payload, list) else [payload]
    meta = await db.counter_meta.find_one({"id": "meta"}) or {"id": "meta", "hero": HERO, "ticker": TICKER_ITEMS, "sections": []}
    by_key = {s["key"]: s for s in meta.get("sections", [])}
    for s in items:
        by_key[s.key] = {"key": s.key, "title": s.title, "order": s.order}
    merged = sorted(by_key.values(), key=lambda s: s.get("order", 0))
    await db.counter_meta.update_one({"id": "meta"}, {"$set": {"sections": merged}}, upsert=True)
    return {"sections": [s["key"] for s in merged]}


@api_router.delete("/admin/counters/{slug}")
async def delete_counter(slug: str, x_admin_token: Optional[str] = Header(default=None)):
    _require_admin(x_admin_token)
    res = await db.live_counters.delete_one({"metric_slug": slug})
    return {"deleted": res.deleted_count}


@api_router.put("/admin/hero")
async def set_hero(payload: dict, x_admin_token: Optional[str] = Header(default=None)):
    """Update the flagship hero counter (and optionally ticker lines)."""
    _require_admin(x_admin_token)
    update = {}
    if "hero" in payload:
        update["hero"] = payload["hero"]
    if "ticker" in payload:
        update["ticker"] = payload["ticker"]
    if not update:
        raise HTTPException(400, "Provide 'hero' and/or 'ticker'.")
    await db.counter_meta.update_one({"id": "meta"}, {"$set": update}, upsert=True)
    return {"updated": list(update.keys())}


# ----------------------- Demo status routes -----------------------
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.dict())
    await db.status_checks.insert_one(status_obj.dict())
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**s) for s in status_checks]


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# =====================================================================
# NEWS HEADLINE SCRAPER — comprehensive autonomous system
# Stores headlines in a dedicated `news_headlines` collection so the
# frontend can fetch them independently of the counters, and they are
# always fresh without waiting for a full /api/counters round-trip.
# =====================================================================

OUTLET_MAPPING = {
    "nyt-subs":          "The New York Times",
    "fox-news-prime":    "Fox News",
    "cnn-visits-today":  "CNN",
    "msnbc-prime":       "MSNBC",
    "abc-evening-news":  "ABC News",
    "nbc-nightly-news":  "NBC News",
    "cbs-evening-news":  "CBS News",
    "wsj-subs":          "The Wall Street Journal",
    "wapo-subs":         "The Washington Post",
    "usa-today-visits":  "USA Today",
    "yahoo-news-visits": "Yahoo News",
    "msn-news-visits":   "MSN",
    "pbs-trust":         "PBS NewsHour",
    "npr-listeners":     "NPR",
    "univision-viewers": "Univision",
    "telemundo-viewers": "Telemundo",
    "bbc-news-visits":   "BBC News",
    "guardian-us-visits":"The Guardian",
    "reuters-visits":    "Reuters",
    "ap-visits":         "Associated Press",
    "ny-post-visits":    "New York Post",
    "huffpost-visits":   "HuffPost",
    "bloomberg-visits":  "Bloomberg",
    "cnbc-visits":       "CNBC",
    "newsweek-visits":   "Newsweek",
}

# Priority keyword search — most likely to return relevant results first
KEYWORD_VARIANTS = [
    '"Black America" OR "Black Americans"',
    '"African American" OR "Black people"',
    '"racial" OR "civil rights"',
    '"diversity" OR "segregation" OR "voting rights"',
]

_SCRAPER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
}

SCRAPE_INTERVAL_SECS = 1800  # refresh every 30 minutes


def _parse_rss_items(xml_text: str) -> list:
    """Return list of (title, pub_date, link) from RSS XML text."""
    try:
        root = ET.fromstring(xml_text)
        out = []
        for item in root.findall(".//item"):
            t = item.find("title")
            p = item.find("pubDate")
            l = item.find("link")
            if t is not None and t.text:
                title = t.text.strip()
                # Strip trailing " - Source Name" appended by Google News
                if " - " in title:
                    title = title.rsplit(" - ", 1)[0].strip()
                out.append({
                    "title": title,
                    "pub_date": p.text.strip() if p is not None and p.text else "",
                    "link": l.text.strip() if l is not None and l.text else "",
                })
        return out
    except Exception:
        return []


def _relative_time(pub_date_str: str) -> str:
    """Convert an RSS pubDate string to a human-readable relative time."""
    if not pub_date_str:
        return ""
    # Try multiple common RSS date formats
    for fmt in (
        "%a, %d %b %Y %H:%M:%S %Z",
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S",
    ):
        try:
            dt = datetime.strptime(pub_date_str.strip(), fmt)
            # Make naive (UTC)
            if dt.tzinfo is not None:
                dt = dt.replace(tzinfo=None)
            diff = datetime.utcnow() - dt
            total_secs = diff.total_seconds()
            if total_secs < 0:
                return "just now"
            if total_secs < 3600:
                return f"{int(total_secs // 60)}m ago"
            if total_secs < 86400:
                return f"{int(total_secs // 3600)}h ago"
            return f"{diff.days}d ago"
        except ValueError:
            continue
    return ""


async def _google_news_rss(query: str) -> list:
    """Fetch and parse a Google News RSS search result."""
    url = (
        "https://news.google.com/rss/search"
        f"?q={urllib.parse.quote(query)}"
        "&hl=en-US&gl=US&ceid=US:en"
    )
    try:
        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
            r = await client.get(url, headers=_SCRAPER_HEADERS)
            if r.status_code == 200:
                return _parse_rss_items(r.text)
    except Exception as e:
        logger.warning("RSS fetch failed for query '%s': %s", query[:60], e)
    return []


async def scrape_outlet(slug: str, outlet_name: str) -> dict | None:
    """
    Try progressively narrower keyword searches for an outlet, then fall back
    to a general latest-stories query. Returns a headline dict or None.
    """
    # 1. Try each keyword variant with the outlet source filter
    for kw in KEYWORD_VARIANTS:
        items = await _google_news_rss(f'source:"{outlet_name}" ({kw})')
        if items:
            item = items[0]
            return {
                "slug": slug,
                "outlet": outlet_name,
                "headline": item["title"],
                "pub_date": item["pub_date"],
                "relative_time": _relative_time(item["pub_date"]),
                "url": item["link"],
                "keyword_matched": True,
                "scraped_at": datetime.utcnow().isoformat(),
            }
        await asyncio.sleep(0.3)

    # 2. Fall back to latest headline from that outlet regardless of topic
    items = await _google_news_rss(f'source:"{outlet_name}"')
    if items:
        item = items[0]
        return {
            "slug": slug,
            "outlet": outlet_name,
            "headline": item["title"],
            "pub_date": item["pub_date"],
            "relative_time": _relative_time(item["pub_date"]),
            "url": item["link"],
            "keyword_matched": False,
            "scraped_at": datetime.utcnow().isoformat(),
        }

    return None


async def run_headline_scraper() -> int:
    """
    Scrape all 25 outlets and upsert results into `news_headlines` collection.
    Returns the number of successfully scraped outlets.
    """
    logger.info("[headlines] scraper started — %d outlets", len(OUTLET_MAPPING))
    count = 0
    for slug, outlet_name in OUTLET_MAPPING.items():
        try:
            result = await scrape_outlet(slug, outlet_name)
            if result:
                await db.news_headlines.update_one(
                    {"slug": slug},
                    {"$set": result},
                    upsert=True,
                )
                logger.info("[headlines] ✓ %s — %s", outlet_name, result["headline"][:60])
                count += 1
            else:
                logger.warning("[headlines] ✗ no headline found for %s", outlet_name)
            await asyncio.sleep(0.5)  # polite delay between outlets
        except Exception as e:
            logger.error("[headlines] error scraping %s: %s", outlet_name, e)
    logger.info("[headlines] scraper done — %d/%d outlets updated", count, len(OUTLET_MAPPING))
    return count


async def headline_scraper_loop():
    """Background loop: scrape immediately on startup, then every 30 minutes."""
    while True:
        try:
            await run_headline_scraper()
        except Exception as e:
            logger.error("[headlines] loop error: %s", e)
        logger.info("[headlines] next refresh in %d minutes", SCRAPE_INTERVAL_SECS // 60)
        await asyncio.sleep(SCRAPE_INTERVAL_SECS)


# ----------------------- /api/headlines endpoint -----------------------

@api_router.get("/headlines")
async def get_headlines():
    """
    Returns the latest scraped headline for each of the 25 news outlets.
    The frontend calls this on every page load to always show fresh headlines.
    Also triggers a background re-scrape if all cached data is older than 35 min.
    """
    docs = await db.news_headlines.find({}, {"_id": 0}).to_list(100)

    # Check staleness — if data is old, kick off a background refresh
    if docs:
        try:
            oldest_ts = min(
                datetime.fromisoformat(d["scraped_at"])
                for d in docs
                if d.get("scraped_at")
            )
            age_mins = (datetime.utcnow() - oldest_ts).total_seconds() / 60
            if age_mins > 35:
                logger.info("[headlines] cache is %.0f min old — triggering background refresh", age_mins)
                asyncio.create_task(run_headline_scraper())
        except Exception:
            pass

    # Return keyed by slug for easy frontend lookup
    by_slug = {d["slug"]: d for d in docs if d.get("slug")}
    return {
        "headlines": by_slug,
        "total": len(by_slug),
        "last_updated": datetime.utcnow().isoformat(),
    }


@api_router.post("/headlines/refresh")
async def force_refresh_headlines():
    """Admin endpoint to manually trigger a full headline scrape."""
    asyncio.create_task(run_headline_scraper())
    return {"status": "refresh_started", "outlets": len(OUTLET_MAPPING)}


# =====================================================================
# App lifecycle
# =====================================================================

@app.on_event("startup")
async def on_startup():
    await seed_counters()
    # Launch headline scraper immediately in the background; never blocks startup
    asyncio.create_task(headline_scraper_loop())


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

