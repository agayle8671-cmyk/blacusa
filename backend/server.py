from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import math
import asyncio
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from PIL import Image
from groq import Groq

from seed_data import ARTICLES, COLD_CASES, MEMBERSHIP_TIERS, CATEGORIES
from storage import init_storage, put_object, get_object, APP_NAME, MIME_TYPES
import scraper as scraper_module

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="BlacUSA API")
api_router = APIRouter(prefix="/api")

# ---------------------- Groq Client ----------------------
_groq_api_key = os.environ.get("GROQ_API_KEY", "")
groq_client: Optional[Groq] = Groq(api_key=_groq_api_key) if _groq_api_key else None


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# ---------------------- Auth ----------------------
JWT_ALG = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALG)


async def get_current_user(request: Request) -> dict:
    token = None
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please sign in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"email": payload.get("email")}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_current_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def haversine_miles(lat1, lng1, lat2, lng2):
    r = 3958.8
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return r * 2 * math.asin(math.sqrt(a))


MAX_IMG_WIDTH = 2000


def optimize_image(data: bytes, ext: str):
    """Resize to <=2000px wide and compress. Returns (bytes, content_type, ext)."""
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except Exception:
        return data, MIME_TYPES.get(ext, "application/octet-stream"), ext
    has_alpha = img.mode in ("RGBA", "LA", "P") and ext in ("png", "webp", "gif")
    if img.width > MAX_IMG_WIDTH:
        ratio = MAX_IMG_WIDTH / img.width
        img = img.resize((MAX_IMG_WIDTH, int(img.height * ratio)), Image.LANCZOS)
    out = io.BytesIO()
    if has_alpha:
        img.save(out, format="PNG", optimize=True)
        return out.getvalue(), "image/png", "png"
    img = img.convert("RGB")
    img.save(out, format="JPEG", quality=85, optimize=True, progressive=True)
    return out.getvalue(), "image/jpeg", "jpg"


def article_is_live(a: dict) -> bool:
    if a.get("is_published") is False:
        return False
    pub = a.get("publish_at")
    if pub:
        try:
            dt = datetime.fromisoformat(str(pub).replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt <= datetime.now(timezone.utc)
        except Exception:
            return True
    return True


# ---------------------- Models ----------------------
class TipCreate(BaseModel):
    case_number: Optional[str] = None
    case_name: Optional[str] = None
    name: Optional[str] = None
    contact: Optional[str] = None
    message: str
    anonymous: bool = False


class Tip(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    case_number: Optional[str] = None
    case_name: Optional[str] = None
    name: Optional[str] = None
    contact: Optional[str] = None
    message: str
    anonymous: bool = False
    status: str = "pending_review"
    created_at: str = Field(default_factory=now_iso)


class SubscribeCreate(BaseModel):
    email: EmailStr
    zip_code: Optional[str] = None


class MembershipCreate(BaseModel):
    tier: str
    name: str
    email: EmailStr


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str


class ArticleIn(BaseModel):
    slug: str
    title: str
    dek: str = ""
    category: str
    author: str = "BlacUSA Staff"
    author_role: str = "Staff Reporter"
    read_minutes: int = 5
    is_solutions: bool = False
    is_featured: bool = False
    is_published: bool = True
    publish_at: Optional[str] = None
    image: str = ""
    content_warning: Optional[str] = None
    tags: List[str] = []
    body: List[str] = []


class CaseIn(BaseModel):
    case_number: str
    name: str
    age: Optional[int] = None
    sex: str = ""
    race: str = ""
    case_type: str
    status: str = "Open"
    date_reported: str
    city: str = ""
    state: str = ""
    lat: Optional[float] = None
    lng: Optional[float] = None
    agency: str = ""
    agency_phone: str = ""
    summary: str = ""
    family_note: str = ""
    image: str = ""


class TipStatusIn(BaseModel):
    status: str


class CommentCreate(BaseModel):
    name: Optional[str] = None
    body: str


class CommentStatusIn(BaseModel):
    status: str


# ---------------------- AI Assist Models ----------------------
class AiDraftFromHeadlineIn(BaseModel):
    title: str
    category: str = "politics"


class AiGenerateDekIn(BaseModel):
    title: str
    body: str = ""


class AiSuggestTagsIn(BaseModel):
    body: str


class AiImproveParagraphIn(BaseModel):
    text: str


# ---------------------- Seeding ----------------------
async def seed_database():
    if await db.articles.count_documents({}) == 0:
        docs = []
        for a in ARTICLES:
            doc = {**a, "id": str(uuid.uuid4()), "is_published": True, "published_at": now_iso()}
            docs.append(doc)
        await db.articles.insert_many(docs)
        logger.info("Seeded %d articles", len(docs))

    if await db.cold_cases.count_documents({}) == 0:
        docs = [{**c, "id": str(uuid.uuid4())} for c in COLD_CASES]
        await db.cold_cases.insert_many(docs)
        logger.info("Seeded %d cold cases", len(docs))

    # Backfill: ensure legacy article docs have an explicit is_published flag
    await db.articles.update_many({"is_published": {"$exists": False}}, {"$set": {"is_published": True}})
    await db.articles.update_many({"is_published": None}, {"$set": {"is_published": True}})


async def seed_admin():
    await db.users.create_index("email", unique=True)
    email = os.environ["ADMIN_EMAIL"].lower()
    password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": email})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": hash_password(password),
            "name": "BlacUSA Admin",
            "role": "admin",
            "created_at": now_iso(),
        })
        logger.info("Seeded admin user %s", email)
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(password)}})
        logger.info("Updated admin password for %s", email)


# ---------------------- Routes ----------------------
@api_router.get("/")
async def root():
    return {"message": "BlacUSA API", "status": "live"}


@api_router.get("/categories")
async def get_categories():
    return CATEGORIES


@api_router.get("/articles")
async def get_articles(category: Optional[str] = None, solutions: Optional[bool] = None,
                       featured: Optional[bool] = None, limit: int = 50):
    query = {"is_published": {"$ne": False}}
    if category:
        query["category"] = category
    if solutions is not None:
        query["is_solutions"] = solutions
    if featured is not None:
        query["is_featured"] = featured
    articles = await db.articles.find(query, {"_id": 0}).to_list(500)
    articles = [a for a in articles if article_is_live(a)]
    articles.sort(key=lambda x: x.get("published_at", ""), reverse=True)
    # Honor admin-curated section ordering when a category is requested
    if category:
        cfg = await db.site_config.find_one({"id": "homepage"}, {"_id": 0})
        order = (cfg or {}).get("sections", {}).get(category, [])
        if order:
            rank = {slug: i for i, slug in enumerate(order)}
            articles.sort(key=lambda a: rank.get(a["slug"], 10_000))
    return articles[:limit]


@api_router.get("/articles/{slug}")
async def get_article(slug: str):
    article = await db.articles.find_one({"slug": slug}, {"_id": 0})
    if not article or not article_is_live(article):
        raise HTTPException(status_code=404, detail="Article not found")
    related = [
        a for a in await db.articles.find(
            {"category": article["category"], "slug": {"$ne": slug}}, {"_id": 0}
        ).to_list(20) if article_is_live(a)
    ][:3]
    return {"article": article, "related": related}


@api_router.get("/homepage")
async def get_homepage():
    cfg = await db.site_config.find_one({"id": "homepage"}, {"_id": 0}) or {}
    live = [a for a in await db.articles.find({"is_published": {"$ne": False}}, {"_id": 0}).to_list(500) if article_is_live(a)]
    by_slug = {a["slug"]: a for a in live}
    live.sort(key=lambda x: x.get("published_at", ""), reverse=True)

    def resolve(slugs):
        return [by_slug[s] for s in slugs if s in by_slug]

    lead = by_slug.get(cfg.get("lead")) if cfg.get("lead") else None
    also = resolve(cfg.get("also_leading", []))
    latest = resolve(cfg.get("latest", []))

    # Fallbacks to keep the homepage full if not fully curated
    featured = [a for a in live if a.get("is_featured")]
    if not lead:
        lead = featured[0] if featured else (live[0] if live else None)
    if not also:
        also = [a for a in (featured or live) if not lead or a["slug"] != lead["slug"]][:2]
    if not latest:
        used = {lead["slug"]} if lead else set()
        used |= {a["slug"] for a in also}
        latest = [a for a in live if a["slug"] not in used][:6]
    return {"lead": lead, "also_leading": also, "latest": latest}


@api_router.get("/cold-cases")
async def get_cold_cases(case_type: Optional[str] = None, status: Optional[str] = None,
                         state: Optional[str] = None, q: Optional[str] = None,
                         lat: Optional[float] = None, lng: Optional[float] = None,
                         radius_miles: Optional[float] = None,
                         min_lat: Optional[float] = None, max_lat: Optional[float] = None,
                         min_lng: Optional[float] = None, max_lng: Optional[float] = None):
    query = {}
    if case_type:
        query["case_type"] = case_type
    if status:
        query["status"] = status
    if state:
        query["state"] = state
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"city": {"$regex": q, "$options": "i"}},
            {"case_number": {"$regex": q, "$options": "i"}},
        ]
    cases = await db.cold_cases.find(query, {"_id": 0}).to_list(500)
    if None not in (min_lat, max_lat, min_lng, max_lng):
        cases = [
            c for c in cases
            if c.get("lat") is not None and c.get("lng") is not None
            and min_lat <= c["lat"] <= max_lat and min_lng <= c["lng"] <= max_lng
        ]
    if lat is not None and lng is not None and radius_miles:
        cases = [
            c for c in cases
            if c.get("lat") is not None and c.get("lng") is not None
            and haversine_miles(lat, lng, c["lat"], c["lng"]) <= radius_miles
        ]
    cases.sort(key=lambda x: x.get("date_reported", ""), reverse=True)
    return cases


@api_router.get("/cold-cases/stats")
async def cold_case_stats():
    cases = await db.cold_cases.find({}, {"_id": 0}).to_list(500)
    total = len(cases)
    open_cases = sum(1 for c in cases if c["status"] == "Open")
    cold = sum(1 for c in cases if c["status"] == "Cold")
    solved = sum(1 for c in cases if c["status"] == "Solved")
    return {"total": total, "open": open_cases, "cold": cold, "solved": solved}


@api_router.get("/cold-cases/{case_number}")
async def get_cold_case(case_number: str):
    case = await db.cold_cases.find_one({"case_number": case_number}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@api_router.post("/tips")
async def submit_tip(payload: TipCreate):
    tip = Tip(**payload.model_dump())
    await db.tips.insert_one(tip.model_dump())
    return {"ok": True, "id": tip.id, "message": "Your tip has been received and will be reviewed by our editorial team."}


@api_router.get("/membership/tiers")
async def membership_tiers():
    return MEMBERSHIP_TIERS


@api_router.post("/membership")
async def join_membership(payload: MembershipCreate):
    doc = {**payload.model_dump(), "id": str(uuid.uuid4()), "created_at": now_iso()}
    await db.memberships.insert_one(doc)
    return {"ok": True, "message": f"Welcome to BlacUSA. You joined as a {payload.tier}."}


@api_router.post("/subscribe")
async def subscribe(payload: SubscribeCreate):
    existing = await db.subscribers.find_one({"email": payload.email})
    if existing:
        return {"ok": True, "message": "You're already on the list."}
    doc = {**payload.model_dump(), "id": str(uuid.uuid4()), "created_at": now_iso()}
    await db.subscribers.insert_one(doc)
    return {"ok": True, "message": "You're subscribed. Welcome to the work."}


# ---------------------- Public comments ----------------------
@api_router.get("/articles/{slug}/comments")
async def get_comments(slug: str):
    comments = await db.comments.find(
        {"article_slug": slug, "status": "approved"}, {"_id": 0}
    ).to_list(500)
    comments.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return comments


@api_router.post("/articles/{slug}/comments")
async def create_comment(slug: str, payload: CommentCreate, user: dict = Depends(get_current_user)):
    article = await db.articles.find_one({"slug": slug})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if not payload.body.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty")
    doc = {
        "id": str(uuid.uuid4()),
        "article_slug": slug,
        "article_title": article.get("title"),
        "user_id": user.get("id"),
        "name": user.get("name") or user.get("email"),
        "verified": True,
        "body": payload.body.strip(),
        "status": "pending_review",
        "created_at": now_iso(),
    }
    await db.comments.insert_one(doc)
    return {"ok": True, "message": "Your comment was submitted and will appear after editorial review."}


# ---------------------- Public file serving ----------------------
@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, content_type = await asyncio.to_thread(get_object, path)
    except Exception:
        raise HTTPException(status_code=404, detail="File unavailable")
    return Response(content=data, media_type=record.get("content_type", content_type),
                    headers={"Cache-Control": "public, max-age=86400"})


# ---------------------- Auth routes ----------------------
@api_router.post("/auth/register")
async def register(payload: RegisterIn):
    email = payload.email.lower()
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(payload.password),
        "name": payload.name.strip(),
        "role": "reader",
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    token = create_access_token(user["id"], user["email"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"email": user["email"], "name": user["name"], "role": user["role"]},
    }


@api_router.post("/auth/login")
async def login(payload: LoginIn):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], user["email"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"email": user["email"], "name": user.get("name"), "role": user.get("role")},
    }


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"email": user["email"], "name": user.get("name"), "role": user.get("role")}


# ---------------------- Admin routes ----------------------
@api_router.get("/admin/overview")
async def admin_overview(admin: dict = Depends(get_current_admin)):
    return {
        "articles": await db.articles.count_documents({}),
        "published": await db.articles.count_documents({"is_published": {"$ne": False}}),
        "cold_cases": await db.cold_cases.count_documents({}),
        "tips_pending": await db.tips.count_documents({"status": "pending_review"}),
        "tips_total": await db.tips.count_documents({}),
        "comments_pending": await db.comments.count_documents({"status": "pending_review"}),
        "subscribers": await db.subscribers.count_documents({}),
        "memberships": await db.memberships.count_documents({}),
    }


@api_router.get("/admin/articles")
async def admin_list_articles(admin: dict = Depends(get_current_admin)):
    items = await db.articles.find({}, {"_id": 0}).to_list(500)
    items.sort(key=lambda x: x.get("published_at", ""), reverse=True)
    return items


@api_router.post("/admin/articles")
async def admin_create_article(payload: ArticleIn, admin: dict = Depends(get_current_admin)):
    if await db.articles.find_one({"slug": payload.slug}):
        raise HTTPException(status_code=400, detail="An article with this slug already exists")
    doc = {**payload.model_dump(), "id": str(uuid.uuid4()), "published_at": now_iso()}
    await db.articles.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/articles/{article_id}")
async def admin_update_article(article_id: str, payload: ArticleIn, admin: dict = Depends(get_current_admin)):
    existing = await db.articles.find_one({"id": article_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Article not found")
    clash = await db.articles.find_one({"slug": payload.slug, "id": {"$ne": article_id}})
    if clash:
        raise HTTPException(status_code=400, detail="Another article already uses this slug")
    await db.articles.update_one({"id": article_id}, {"$set": payload.model_dump()})
    return {"ok": True}


@api_router.delete("/admin/articles/{article_id}")
async def admin_delete_article(article_id: str, admin: dict = Depends(get_current_admin)):
    res = await db.articles.delete_one({"id": article_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"ok": True}


@api_router.get("/admin/cold-cases")
async def admin_list_cases(admin: dict = Depends(get_current_admin)):
    items = await db.cold_cases.find({}, {"_id": 0}).to_list(500)
    items.sort(key=lambda x: x.get("date_reported", ""), reverse=True)
    return items


@api_router.post("/admin/cold-cases")
async def admin_create_case(payload: CaseIn, admin: dict = Depends(get_current_admin)):
    if await db.cold_cases.find_one({"case_number": payload.case_number}):
        raise HTTPException(status_code=400, detail="This case number already exists")
    doc = {**payload.model_dump(), "id": str(uuid.uuid4())}
    await db.cold_cases.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/cold-cases/{case_id}")
async def admin_update_case(case_id: str, payload: CaseIn, admin: dict = Depends(get_current_admin)):
    existing = await db.cold_cases.find_one({"id": case_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Case not found")
    await db.cold_cases.update_one({"id": case_id}, {"$set": payload.model_dump()})
    return {"ok": True}


@api_router.delete("/admin/cold-cases/{case_id}")
async def admin_delete_case(case_id: str, admin: dict = Depends(get_current_admin)):
    res = await db.cold_cases.delete_one({"id": case_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"ok": True}


@api_router.get("/admin/tips")
async def admin_list_tips(status: Optional[str] = None, admin: dict = Depends(get_current_admin)):
    query = {"status": status} if status else {}
    items = await db.tips.find(query, {"_id": 0}).to_list(500)
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items


@api_router.patch("/admin/tips/{tip_id}")
async def admin_update_tip(tip_id: str, payload: TipStatusIn, admin: dict = Depends(get_current_admin)):
    if payload.status not in ("pending_review", "approved", "rejected", "reviewed"):
        raise HTTPException(status_code=400, detail="Invalid status")
    res = await db.tips.update_one({"id": tip_id}, {"$set": {"status": payload.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tip not found")
    return {"ok": True}


@api_router.delete("/admin/tips/{tip_id}")
async def admin_delete_tip(tip_id: str, admin: dict = Depends(get_current_admin)):
    res = await db.tips.delete_one({"id": tip_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tip not found")
    return {"ok": True}


@api_router.get("/admin/subscribers")
async def admin_subscribers(admin: dict = Depends(get_current_admin)):
    items = await db.subscribers.find({}, {"_id": 0}).to_list(1000)
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items


@api_router.get("/admin/memberships")
async def admin_memberships(admin: dict = Depends(get_current_admin)):
    items = await db.memberships.find({}, {"_id": 0}).to_list(1000)
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items


@api_router.post("/admin/upload")
async def admin_upload(file: UploadFile = File(...), admin: dict = Depends(get_current_admin)):
    ext = (file.filename.rsplit(".", 1)[-1] if "." in (file.filename or "") else "bin").lower()
    if ext not in MIME_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, GIF or WebP images are allowed")
    data = await file.read()
    if len(data) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be 15MB or smaller")
    # Optimize (resize + compress) off the event loop
    opt_data, content_type, ext = await asyncio.to_thread(optimize_image, data, ext)
    path = f"{APP_NAME}/uploads/{uuid.uuid4()}.{ext}"
    try:
        result = await asyncio.to_thread(put_object, path, opt_data, content_type)
    except Exception as e:
        logger.error("Upload failed: %s", e)
        raise HTTPException(status_code=502, detail="Image upload failed. Please try again.")
    stored_path = result.get("path", path)
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": stored_path,
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(opt_data)),
        "is_deleted": False,
        "created_at": now_iso(),
    })
    return {"url": f"/api/files/{stored_path}", "path": stored_path, "size": result.get("size", len(opt_data))}


@api_router.get("/admin/homepage")
async def admin_get_homepage(admin: dict = Depends(get_current_admin)):
    cfg = await db.site_config.find_one({"id": "homepage"}, {"_id": 0}) or {
        "id": "homepage", "lead": None, "also_leading": [], "latest": [], "sections": {}
    }
    articles = await db.articles.find(
        {"is_published": {"$ne": False}},
        {"_id": 0, "slug": 1, "title": 1, "category": 1, "is_featured": 1, "publish_at": 1},
    ).to_list(500)
    articles.sort(key=lambda x: x.get("title", ""))
    return {"config": cfg, "articles": articles}


# ---------------------- AI Assist Routes ----------------------

def _require_groq():
    """Raise 503 if GROQ_API_KEY is not configured."""
    if not groq_client:
        raise HTTPException(
            status_code=503,
            detail="AI features are not available. Set GROQ_API_KEY in backend/.env and restart.",
        )
    return groq_client


@api_router.post("/admin/ai/draft-from-headline")
async def ai_draft_from_headline(
    payload: AiDraftFromHeadlineIn,
    admin: dict = Depends(get_current_admin),
):
    """Generate a full article draft from a headline with site-memory RAG context."""
    gc = _require_groq()
    result = await scraper_module.ai_draft_from_headline(
        title=payload.title,
        category=payload.category,
        db=db,
        groq_client=gc,
    )
    if not result:
        raise HTTPException(status_code=502, detail="AI draft generation failed. Please try again.")
    return result


@api_router.post("/admin/ai/generate-dek")
async def ai_generate_dek(
    payload: AiGenerateDekIn,
    admin: dict = Depends(get_current_admin),
):
    """Generate a standfirst (dek) from the article title and body."""
    gc = _require_groq()
    dek = await scraper_module.ai_generate_dek(
        title=payload.title,
        body=payload.body,
        groq_client=gc,
    )
    if dek is None:
        raise HTTPException(status_code=502, detail="Dek generation failed. Please try again.")
    return {"dek": dek}


@api_router.post("/admin/ai/suggest-tags")
async def ai_suggest_tags(
    payload: AiSuggestTagsIn,
    admin: dict = Depends(get_current_admin),
):
    """Suggest tags based on article body content."""
    gc = _require_groq()
    tags = await scraper_module.ai_suggest_tags(body=payload.body, groq_client=gc)
    if tags is None:
        raise HTTPException(status_code=502, detail="Tag suggestion failed. Please try again.")
    return {"tags": tags}


@api_router.post("/admin/ai/improve-paragraph")
async def ai_improve_paragraph(
    payload: AiImproveParagraphIn,
    admin: dict = Depends(get_current_admin),
):
    """Rewrite a paragraph in BlacUSA's editorial voice."""
    gc = _require_groq()
    improved = await scraper_module.ai_improve_paragraph(text=payload.text, groq_client=gc)
    if improved is None:
        raise HTTPException(status_code=502, detail="Paragraph improvement failed. Please try again.")
    return {"text": improved}


# ---------------------- Scraper Routes ----------------------

_scraper_last_run: Optional[dict] = None
_scraper_running: bool = False


@api_router.post("/admin/scraper/run")
async def run_scraper_now(admin: dict = Depends(get_current_admin)):
    """Manually trigger the news scraper pipeline."""
    global _scraper_running, _scraper_last_run
    gc = _require_groq()
    if _scraper_running:
        raise HTTPException(status_code=409, detail="Scraper is already running. Please wait.")
    _scraper_running = True
    try:
        summary = await scraper_module.run_scraper(db=db, groq_client=gc)
        _scraper_last_run = summary
        return summary
    except Exception as e:
        logger.error("Manual scraper run failed: %s", e)
        raise HTTPException(status_code=502, detail=f"Scraper error: {str(e)}")
    finally:
        _scraper_running = False


@api_router.get("/admin/scraper/status")
async def scraper_status(admin: dict = Depends(get_current_admin)):
    """Return the last scraper run summary and current state."""
    return {
        "running": _scraper_running,
        "groq_configured": groq_client is not None,
        "last_run": _scraper_last_run,
        "sources_count": len(scraper_module.RSS_SOURCES),
    }


# ---------------------- Background Scraper Loop ----------------------

async def _scraper_background_loop():
    """Runs the scraper every 24 hours after an initial 60-second delay."""
    global _scraper_running, _scraper_last_run
    await asyncio.sleep(60)  # Wait for server to fully initialize
    while True:
        if groq_client and not _scraper_running:
            logger.info("Background scraper: starting scheduled run")
            _scraper_running = True
            try:
                summary = await scraper_module.run_scraper(db=db, groq_client=groq_client)
                _scraper_last_run = summary
                logger.info("Background scraper done: %s", summary)
            except Exception as e:
                logger.error("Background scraper error: %s", e)
            finally:
                _scraper_running = False
        else:
            if not groq_client:
                logger.warning("Background scraper: GROQ_API_KEY not set — skipping run")
        await asyncio.sleep(24 * 60 * 60)  # 24 hours


@api_router.put("/admin/homepage")
async def admin_save_homepage(payload: dict, admin: dict = Depends(get_current_admin)):
    cfg = {
        "id": "homepage",
        "lead": payload.get("lead"),
        "also_leading": payload.get("also_leading", []),
        "latest": payload.get("latest", []),
        "sections": payload.get("sections", {}),
        "updated_at": now_iso(),
    }
    await db.site_config.update_one({"id": "homepage"}, {"$set": cfg}, upsert=True)
    return {"ok": True}


@api_router.get("/admin/comments")
async def admin_list_comments(status: Optional[str] = None, admin: dict = Depends(get_current_admin)):
    query = {"status": status} if status else {}
    items = await db.comments.find(query, {"_id": 0}).to_list(1000)
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items


@api_router.patch("/admin/comments/{comment_id}")
async def admin_update_comment(comment_id: str, payload: CommentStatusIn, admin: dict = Depends(get_current_admin)):
    if payload.status not in ("pending_review", "approved", "rejected"):
        raise HTTPException(status_code=400, detail="Invalid status")
    res = await db.comments.update_one({"id": comment_id}, {"$set": {"status": payload.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"ok": True}


@api_router.delete("/admin/comments/{comment_id}")
async def admin_delete_comment(comment_id: str, admin: dict = Depends(get_current_admin)):
    res = await db.comments.delete_one({"id": comment_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    await seed_database()
    await seed_admin()
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error("Storage init failed: %s", e)
    # Ensure scraped_url sparse unique index for deduplication
    try:
        await db.articles.create_index(
            "scraped_url", unique=True, sparse=True, background=True
        )
    except Exception as e:
        logger.warning("scraped_url index: %s", e)
    # Launch 24-hour background scraper loop
    asyncio.create_task(_scraper_background_loop())
    logger.info("Background scraper loop started (first run in 60s)")
    if not groq_client:
        logger.warning("GROQ_API_KEY not set — AI features and scraper are disabled")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
