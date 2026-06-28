from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from seed_counters import COUNTERS, HERO, TICKER_ITEMS, SECTION_META

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ----------------------- Models -----------------------
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class StatusCheckCreate(BaseModel):
    client_name: str


# ----------------------- Helpers -----------------------
def _resolve_baseline(kind: str, stored_ts: Optional[str], stored_value):
    """Resolve year_start / day_start to concrete ISO timestamp + value at request time."""
    now = datetime.now()
    if kind == "year_start":
        ts = datetime(now.year, 1, 1).isoformat()
        return ts, 0
    if kind == "day_start":
        ts = datetime(now.year, now.month, now.day).isoformat()
        return ts, 0
    return stored_ts, stored_value


def _row_to_public(doc: dict) -> dict:
    """Map a stored live_counters doc to the frontend row shape."""
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
        "baselineValue": value,
        "baselineTimestamp": ts,
        "annualRate": doc.get("annual_rate"),
        "prefix": doc.get("prefix", ""),
        "suffix": doc.get("suffix", ""),
        "decimals": doc.get("decimals", 0),
    })
    return row


# ----------------------- Seeding -----------------------
async def seed_counters():
    existing = await db.live_counters.count_documents({})
    if existing == 0:
        await db.live_counters.insert_many([dict(c) for c in COUNTERS])
        logger.info("Seeded %d live counters", len(COUNTERS))
    meta = await db.counter_meta.find_one({"id": "meta"})
    if not meta:
        await db.counter_meta.insert_one({
            "id": "meta",
            "hero": HERO,
            "ticker": TICKER_ITEMS,
            "sections": [{"key": k, "title": t} for k, t in SECTION_META],
        })
        logger.info("Seeded counter meta")


# ----------------------- Routes -----------------------
@api_router.get("/")
async def root():
    return {"message": "BlacUSA Real-Time Tracker API"}


@api_router.get("/counters")
async def get_counters():
    meta = await db.counter_meta.find_one({"id": "meta"}, {"_id": 0})
    if not meta:
        await seed_counters()
        meta = await db.counter_meta.find_one({"id": "meta"}, {"_id": 0})

    docs = await db.live_counters.find({}, {"_id": 0}).to_list(500)
    docs.sort(key=lambda d: (d.get("category", ""), d.get("order", 0)))

    by_cat = {}
    for d in docs:
        by_cat.setdefault(d["category"], []).append(_row_to_public(d))

    sections = []
    for s in meta.get("sections", []):
        rows = by_cat.get(s["key"], [])
        if rows:
            sections.append({"key": s["key"], "title": s["title"], "rows": rows})

    # Resolve hero baseline (currently fixed, but future-proofed)
    hero = dict(meta.get("hero", {}))
    ts, value = _resolve_baseline(
        hero.get("baseline_kind", "fixed"),
        hero.get("baseline_timestamp"),
        hero.get("baseline_value"),
    )
    hero_public = {
        "slug": hero.get("slug"),
        "caption": hero.get("caption"),
        "baselineValue": value,
        "baselineTimestamp": ts,
        "annualRate": hero.get("annual_rate"),
        "source": hero.get("source"),
    }

    return {
        "hero": hero_public,
        "sections": sections,
        "ticker": meta.get("ticker", []),
    }


@api_router.get("/counters/meta")
async def get_counters_meta():
    """Status/info echo \u2014 makes the mock/stub state explicit."""
    count = await db.live_counters.count_documents({})
    return {
        "counters": count,
        "etl_ingestion": "stub",
        "note": "Baselines are seeded constants from the strategic data matrix. "
                "Live government-API ingestion (FRED/Census/CDC) is not enabled (requires API keys). "
                "All ticking is client-side mathematical extrapolation.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


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


@app.on_event("startup")
async def on_startup():
    await seed_counters()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
