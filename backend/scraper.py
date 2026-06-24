"""
BlacUSA AI News Scraper — Iteration 5
======================================
5-phase pipeline:
  1. Discovery   — Parse 20+ RSS feeds from Black media ecosystem
  2. Extraction  — Fetch full article body via httpx + BeautifulSoup4
  3. Filtering   — Keyword relevance pre-filter
  4. RAG Context — Query MongoDB for relevant existing BlacUSA articles (site memory)
  5. Rewriting   — Groq llama-3.3-70b-versatile rewrites with site context injected
  6. Staging     — Insert as is_published=False draft for editorial review

Never auto-publishes. All content requires human approval in the Newsroom Console.
"""

import asyncio
import logging
import re
import json
import uuid
from datetime import datetime, timezone
from typing import Optional

import feedparser
import httpx
from bs4 import BeautifulSoup
from groq import Groq

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# RSS Source Registry (20+ feeds across the Black media ecosystem)
# ---------------------------------------------------------------------------
RSS_SOURCES = [
    # Tier 1 — Black-Owned Digital News
    {"name": "TheGrio",               "url": "https://thegrio.com/feed/",                       "category_hint": "politics"},
    {"name": "The Root",              "url": "https://www.theroot.com/rss",                      "category_hint": "politics"},
    {"name": "Black Enterprise",      "url": "https://www.blackenterprise.com/feed/",             "category_hint": "solutions"},
    {"name": "EBONY",                 "url": "https://www.ebony.com/feed/",                      "category_hint": "health-equity"},
    {"name": "Atlanta Black Star",    "url": "https://atlantablackstar.com/feed/",                "category_hint": "criminal-justice"},
    {"name": "Capital B",             "url": "https://capitalbnews.org/feed/",                   "category_hint": "politics"},
    {"name": "Blavity",               "url": "https://blavity.com/feed",                         "category_hint": "solutions"},
    {"name": "Colorlines",            "url": "https://www.colorlines.com/feed",                  "category_hint": "criminal-justice"},
    {"name": "NewsOne",               "url": "https://newsone.com/feed/",                        "category_hint": "politics"},
    {"name": "The Crisis (NAACP)",    "url": "https://www.thecrisismagazine.com/feed",            "category_hint": "criminal-justice"},

    # Tier 2 — Health, Justice & Culture Specialists
    {"name": "Black Health Matters",  "url": "https://blackhealthmatters.com/feed/",              "category_hint": "health-equity"},
    {"name": "The Undefeated",        "url": "https://theundefeated.com/feed/",                   "category_hint": "solutions"},
    {"name": "Shadow & Act",          "url": "https://shadowandact.com/feed/",                   "category_hint": "solutions"},
    {"name": "Prison Policy Init.",   "url": "https://www.prisonpolicy.org/blog/feed/",           "category_hint": "criminal-justice"},
    {"name": "Equal Justice Init.",   "url": "https://eji.org/news/feed/",                        "category_hint": "criminal-justice"},
    {"name": "Urban Institute",       "url": "https://www.urban.org/feeds/all",                  "category_hint": "solutions"},

    # Tier 3 — Mainstream Outlets with Dedicated Black Beat Coverage
    {"name": "ProPublica",            "url": "https://feeds.propublica.org/propublica/main",      "category_hint": "criminal-justice"},
    {"name": "The Guardian (Race)",   "url": "https://www.theguardian.com/world/race/rss",        "category_hint": "politics"},
    {"name": "NPR Code Switch",       "url": "https://feeds.npr.org/510312/podcast.xml",          "category_hint": "solutions"},
    {"name": "The 19th",              "url": "https://19thnews.org/feed/",                        "category_hint": "health-equity"},
    {"name": "Vox",                   "url": "https://www.vox.com/rss/index.xml",                 "category_hint": "politics"},
    {"name": "Truthout",              "url": "https://truthout.org/feed/",                        "category_hint": "environmental-racism"},
    {"name": "Grist",                 "url": "https://grist.org/feed/",                           "category_hint": "environmental-racism"},
    {"name": "Pew Research (Race)",   "url": "https://www.pewresearch.org/feed/",                 "category_hint": "solutions"},
    {"name": "ACLU News",             "url": "https://www.aclu.org/news/feed",                    "category_hint": "criminal-justice"},
]

# Relevance keywords — articles lacking any of these are skipped
RELEVANCE_KEYWORDS = [
    "black", "african american", "race", "racial", "racism", "civil rights",
    "naacp", "black lives", "police", "criminal justice", "voting rights",
    "health equity", "environmental racism", "redlining", "reparations",
    "segregation", "discrimination", "systemic", "equity", "justice",
    "community", "historically black", "hbcu", "black-owned",
]

VALID_CATEGORIES = [
    "politics", "health-equity", "criminal-justice",
    "environmental-racism", "solutions", "rural",
]

MAX_BODY_CHARS = 6000   # Trim source article to keep tokens manageable
MAX_CONTEXT_ARTICLES = 6  # How many BlacUSA articles to inject as site memory
MAX_CONTEXT_CHARS = 400   # Chars per existing article in context block


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _strip_html(html: str) -> str:
    """Remove HTML tags and collapse whitespace."""
    soup = BeautifulSoup(html, "lxml")
    return re.sub(r"\s+", " ", soup.get_text(separator=" ")).strip()


def _is_relevant(text: str) -> bool:
    """Return True if the text contains at least one relevance keyword."""
    lower = text.lower()
    return any(kw in lower for kw in RELEVANCE_KEYWORDS)


def _slugify(title: str) -> str:
    """Generate a URL-safe slug from a title."""
    slug = title.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s]+", "-", slug).strip("-")
    return slug[:80]


# ---------------------------------------------------------------------------
# Phase 1 — Discovery: parse RSS feed entries
# ---------------------------------------------------------------------------

async def fetch_rss_entries(source: dict) -> list[dict]:
    """
    Fetch and parse an RSS feed. Returns a list of entry dicts with:
    {title, url, summary, category_hint, source_name}
    """
    try:
        # feedparser is sync; run in thread to avoid blocking event loop
        feed = await asyncio.to_thread(feedparser.parse, source["url"])
        entries = []
        for entry in feed.entries[:15]:  # Cap at 15 per feed per run
            title = entry.get("title", "").strip()
            url = entry.get("link", "").strip()
            summary = _strip_html(entry.get("summary", entry.get("description", "")))
            if not title or not url:
                continue
            entries.append({
                "title": title,
                "url": url,
                "summary": summary[:800],
                "category_hint": source.get("category_hint", "politics"),
                "source_name": source["name"],
            })
        logger.info("RSS %s → %d entries", source["name"], len(entries))
        return entries
    except Exception as e:
        logger.warning("RSS fetch failed for %s: %s", source["name"], e)
        return []


# ---------------------------------------------------------------------------
# Phase 2 — Extraction: fetch full article body
# ---------------------------------------------------------------------------

async def extract_article_body(url: str) -> str:
    """
    Fetch the article page and extract the main body text using BeautifulSoup.
    Falls back to empty string on any error.
    """
    try:
        async with httpx.AsyncClient(
            timeout=12,
            headers={
                "User-Agent": (
                    "BlacUSA Editorial Aggregator/1.0 "
                    "(https://blacusa.com; editorial@blacusa.com)"
                )
            },
            follow_redirects=True,
        ) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return ""
            soup = BeautifulSoup(resp.text, "lxml")

            # Remove clutter
            for tag in soup(["script", "style", "nav", "header", "footer",
                              "aside", "form", "noscript", "iframe", "ads"]):
                tag.decompose()

            # Try common article containers first
            for selector in ["article", "[class*='article-body']",
                              "[class*='post-content']", "[class*='entry-content']",
                              "main", ".content"]:
                el = soup.select_one(selector)
                if el:
                    text = re.sub(r"\s+", " ", el.get_text(separator=" ")).strip()
                    if len(text) > 200:
                        return text[:MAX_BODY_CHARS]

            # Final fallback: all paragraph text
            paras = soup.find_all("p")
            text = " ".join(p.get_text() for p in paras)
            return re.sub(r"\s+", " ", text).strip()[:MAX_BODY_CHARS]
    except Exception as e:
        logger.warning("Body extraction failed for %s: %s", url, e)
        return ""


# ---------------------------------------------------------------------------
# Phase 3 — Site Memory (RAG): query BlacUSA MongoDB for related articles
# ---------------------------------------------------------------------------

async def build_site_memory(keywords: list[str], category: str, db, limit: int = MAX_CONTEXT_ARTICLES) -> tuple[str, list[str]]:
    """
    Query the BlacUSA articles collection for published articles related to
    the given keywords and category. Returns:
      - A formatted context block string to inject into the Groq prompt
      - A list of article slugs used (for provenance tracking)
    """
    # Build a $or query across title, dek, tags, and body text
    kw_conditions = []
    for kw in keywords[:8]:  # Cap to avoid massive queries
        kw_conditions.extend([
            {"title": {"$regex": kw, "$options": "i"}},
            {"dek": {"$regex": kw, "$options": "i"}},
            {"tags": {"$regex": kw, "$options": "i"}},
        ])

    query = {
        "is_published": {"$ne": False},
    }
    if kw_conditions:
        query["$or"] = kw_conditions

    try:
        articles = await db.articles.find(
            query,
            {"_id": 0, "slug": 1, "title": 1, "dek": 1, "category": 1,
             "author": 1, "body": 1, "tags": 1, "published_at": 1}
        ).to_list(50)
    except Exception as e:
        logger.warning("Site memory query failed: %s", e)
        return "", []

    if not articles:
        # Fallback: same-category articles
        try:
            articles = await db.articles.find(
                {"is_published": {"$ne": False}, "category": category},
                {"_id": 0, "slug": 1, "title": 1, "dek": 1, "body": 1, "tags": 1}
            ).to_list(limit)
        except Exception:
            return "", []

    # Sort by relevance: same-category first, then by recency
    articles.sort(
        key=lambda a: (0 if a.get("category") == category else 1,
                       a.get("published_at", "")),
        reverse=False,
    )

    selected = articles[:limit]
    slugs = [a["slug"] for a in selected]

    # Build the context block
    lines = ["=== BlacUSA Site Memory (our past coverage) ==="]
    for a in selected:
        body_preview = ""
        if a.get("body") and isinstance(a["body"], list):
            body_preview = " ".join(a["body"])[:MAX_CONTEXT_CHARS]
        elif a.get("dek"):
            body_preview = a["dek"][:MAX_CONTEXT_CHARS]

        lines.append(
            f'\n[ARTICLE slug="{a["slug"]}" category="{a.get("category", "")}"]\n'
            f'Title: {a["title"]}\n'
            f'Dek: {a.get("dek", "")}\n'
            f'Preview: {body_preview}\n'
            f'Tags: {", ".join(a.get("tags", []))}'
        )

    context = "\n".join(lines)
    logger.info("Site memory: %d articles retrieved for context", len(selected))
    return context, slugs


# ---------------------------------------------------------------------------
# Phase 4 — Groq Rewriting
# ---------------------------------------------------------------------------

CATEGORY_DESCRIPTIONS = {
    "politics": "political power, policy, voting rights, and civic action",
    "health-equity": "health disparities, healthcare access, and medical racism",
    "criminal-justice": "criminal justice reform, police accountability, and mass incarceration",
    "environmental-racism": "environmental justice, pollution, and climate inequity",
    "solutions": "community-led solutions, innovation, and Black excellence",
    "rural": "rural Black communities, the Black Belt, and the overlooked countryside",
}


def build_groq_prompt(
    source_title: str,
    source_text: str,
    source_name: str,
    site_memory: str,
    category: str,
) -> tuple[str, str]:
    """
    Build the system + user prompt for Groq.
    Returns (system_prompt, user_prompt).
    """
    cat_desc = CATEGORY_DESCRIPTIONS.get(category, "Black American issues")

    system_prompt = f"""You are a senior editorial writer at BlacUSA, a next-generation digital news platform for and about Black Americans. 

Your editorial standards:
- Trauma-informed: dignified treatment of subjects, content warnings where appropriate, person-first language
- Solutions-oriented: energizing reporting that highlights agency and community action, not just problems
- Algorithm-proof: original voice, loyal-audience writing — not clickbait or shock headlines
- Cross-reference our past coverage where genuinely relevant (use slugs from site memory)
- Never fabricate quotes, statistics, or facts not present in the source material
- Write for the BlacUSA beat: {cat_desc}

{site_memory}

=== OUTPUT FORMAT ===
Respond with ONLY a valid JSON object, no markdown fences, no extra text. Schema:
{{
  "title": "compelling BlacUSA headline (max 100 chars)",
  "dek": "1-2 sentence standfirst that draws the reader in (max 200 chars)",
  "category": "one of: politics, health-equity, criminal-justice, environmental-racism, solutions, rural",
  "tags": ["tag1", "tag2", "tag3"],
  "body": ["paragraph 1", "paragraph 2", "paragraph 3", "paragraph 4", "paragraph 5"],
  "internal_refs": ["slug-of-related-blacusa-article-1", "slug-2"],
  "content_warning": "brief warning if article covers violence/death/trauma, else null"
}}"""

    user_prompt = f"""Rewrite the following source article for BlacUSA. The article was sourced from {source_name}.

Original title: {source_title}

Source content:
{source_text}

Write a fresh BlacUSA article informed by our past coverage. Where our site memory shows we have covered related topics, naturally weave in references. Do not copy the source verbatim — synthesize and elevate it with our editorial voice."""

    return system_prompt, user_prompt


async def call_groq(
    groq_client: Groq,
    system_prompt: str,
    user_prompt: str,
    model: str = "llama-3.3-70b-versatile",
) -> Optional[dict]:
    """
    Call Groq and parse JSON response. Returns parsed dict or None on failure.
    """
    try:
        response = await asyncio.to_thread(
            groq_client.chat.completions.create,
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=2048,
        )
        raw = response.choices[0].message.content.strip()
        # Strip markdown fences if model adds them despite instructions
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        return json.loads(raw)
    except json.JSONDecodeError as e:
        logger.error("Groq JSON parse error: %s", e)
        return None
    except Exception as e:
        logger.error("Groq API error: %s", e)
        return None


# ---------------------------------------------------------------------------
# Phase 5 — Staging: insert draft into MongoDB
# ---------------------------------------------------------------------------

async def stage_draft(
    ai_article: dict,
    source_url: str,
    source_name: str,
    context_slugs: list[str],
    db,
) -> bool:
    """
    Insert AI-rewritten article as a draft (is_published=False).
    Deduplicates by scraped_url. Returns True if inserted, False if skipped.
    """
    # Deduplication check
    existing = await db.articles.find_one({"scraped_url": source_url})
    if existing:
        logger.debug("Skipping duplicate: %s", source_url)
        return False

    # Validate and sanitise category
    category = ai_article.get("category", "politics")
    if category not in VALID_CATEGORIES:
        category = "politics"

    # Build slug — ensure uniqueness
    base_slug = _slugify(ai_article.get("title", "untitled-" + str(uuid.uuid4())[:8]))
    slug = base_slug
    counter = 1
    while await db.articles.find_one({"slug": slug}):
        slug = f"{base_slug}-{counter}"
        counter += 1

    tags = ai_article.get("tags", [])
    if not isinstance(tags, list):
        tags = []

    body = ai_article.get("body", [])
    if not isinstance(body, list):
        body = [str(body)]

    internal_refs = ai_article.get("internal_refs", [])
    if not isinstance(internal_refs, list):
        internal_refs = []

    doc = {
        "id": str(uuid.uuid4()),
        "slug": slug,
        "title": ai_article.get("title", "Untitled AI Draft"),
        "dek": ai_article.get("dek", ""),
        "category": category,
        "author": f"BlacUSA Staff (AI Draft via {source_name})",
        "author_role": "AI-Assisted Draft — Awaiting Editorial Review",
        "read_minutes": max(1, len(body) * 2),
        "is_solutions": category == "solutions",
        "is_featured": False,
        "is_published": False,          # NEVER auto-published
        "publish_at": None,
        "image": "",
        "content_warning": ai_article.get("content_warning"),
        "tags": tags,
        "body": body,
        "published_at": now_iso(),
        # Provenance fields
        "scraped_url": source_url,
        "scraped_source": source_name,
        "ai_context_slugs": context_slugs,
        "ai_internal_refs": internal_refs,
        "is_ai_draft": True,
    }

    await db.articles.insert_one(doc)
    logger.info("Staged AI draft: '%s' (from %s)", doc["title"], source_name)
    return True


# ---------------------------------------------------------------------------
# Main Orchestrator
# ---------------------------------------------------------------------------

async def run_scraper(db, groq_client: Groq) -> dict:
    """
    Full pipeline run. Returns summary dict:
    {ingested, skipped, errors, sources_checked, timestamp}
    """
    ingested = 0
    skipped = 0
    errors = 0

    for source in RSS_SOURCES:
        entries = await fetch_rss_entries(source)

        for entry in entries:
            try:
                # Phase 3 — Relevance filter
                combined_text = f"{entry['title']} {entry['summary']}"
                if not _is_relevant(combined_text):
                    skipped += 1
                    continue

                # Phase 2 — Extract full body
                body_text = await extract_article_body(entry["url"])
                if len(body_text) < 150:
                    # Body too short — fall back to summary
                    body_text = entry["summary"]
                if not body_text or not _is_relevant(body_text):
                    skipped += 1
                    continue

                # Extract keywords from title for RAG query
                keywords = [
                    w for w in re.findall(r"\b[a-zA-Z]{4,}\b", entry["title"])
                    if w.lower() not in {"that", "this", "with", "from", "have",
                                        "what", "when", "where", "will", "been",
                                        "their", "they", "about", "black"}
                ][:10]

                # Phase 3 — Build site memory (RAG)
                site_memory, context_slugs = await build_site_memory(
                    keywords=keywords,
                    category=entry["category_hint"],
                    db=db,
                )

                # Phase 4 — Groq rewrite
                system_prompt, user_prompt = build_groq_prompt(
                    source_title=entry["title"],
                    source_text=body_text,
                    source_name=entry["source_name"],
                    site_memory=site_memory,
                    category=entry["category_hint"],
                )

                ai_article = await call_groq(groq_client, system_prompt, user_prompt)
                if not ai_article:
                    errors += 1
                    continue

                # Phase 5 — Stage draft
                inserted = await stage_draft(
                    ai_article=ai_article,
                    source_url=entry["url"],
                    source_name=entry["source_name"],
                    context_slugs=context_slugs,
                    db=db,
                )
                if inserted:
                    ingested += 1
                else:
                    skipped += 1

                # Brief pause to respect rate limits
                await asyncio.sleep(1.5)

            except Exception as e:
                logger.error("Pipeline error for %s: %s", entry.get("url", "?"), e)
                errors += 1

    summary = {
        "ingested": ingested,
        "skipped": skipped,
        "errors": errors,
        "sources_checked": len(RSS_SOURCES),
        "timestamp": now_iso(),
    }
    logger.info("Scraper run complete: %s", summary)
    return summary


# ---------------------------------------------------------------------------
# AI Assist Helpers (used by server.py admin routes)
# ---------------------------------------------------------------------------

async def ai_draft_from_headline(
    title: str,
    category: str,
    db,
    groq_client: Groq,
) -> Optional[dict]:
    """
    Generate a full article draft from a headline, with site memory context.
    Returns {dek, tags, body, internal_refs, content_warning} or None.
    """
    keywords = [w for w in re.findall(r"\b[a-zA-Z]{4,}\b", title)][:10]
    site_memory, context_slugs = await build_site_memory(keywords, category, db)

    cat_desc = CATEGORY_DESCRIPTIONS.get(category, "Black American issues")

    system_prompt = f"""You are a senior editorial writer at BlacUSA, a next-generation digital news platform for and about Black Americans.

Editorial standards: trauma-informed, solutions-oriented, person-first language, algorithm-proof voice.
Beat: {cat_desc}

{site_memory}

Respond with ONLY valid JSON. Schema:
{{
  "dek": "compelling 1-2 sentence standfirst",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "body": ["paragraph 1", "paragraph 2", "paragraph 3", "paragraph 4", "paragraph 5"],
  "internal_refs": ["related-blacusa-slug-1", "related-blacusa-slug-2"],
  "content_warning": "brief warning or null"
}}"""

    user_prompt = (
        f'Write a full BlacUSA article for the headline: "{title}"\n\n'
        f"Category: {category}\n\n"
        "Draw on our past coverage in the site memory above where relevant. "
        "Reference internal articles naturally. Use our editorial voice: dignified, energizing, community-centered."
    )

    try:
        response = await asyncio.to_thread(
            groq_client.chat.completions.create,
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.75,
            max_tokens=2048,
        )
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        result = json.loads(raw)
        result["context_slugs"] = context_slugs
        return result
    except Exception as e:
        logger.error("ai_draft_from_headline error: %s", e)
        return None


async def ai_generate_dek(
    title: str,
    body: str,
    groq_client: Groq,
) -> Optional[str]:
    """Generate a standfirst (dek) from title and body preview."""
    try:
        response = await asyncio.to_thread(
            groq_client.chat.completions.create,
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a BlacUSA copy editor. Write a compelling 1–2 sentence "
                        "standfirst (dek) for the article. Respond with ONLY the dek text, "
                        "no quotes, no extra formatting."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Headline: {title}\n\nArticle preview:\n{body[:1500]}",
                },
            ],
            temperature=0.6,
            max_tokens=200,
        )
        return response.choices[0].message.content.strip().strip('"')
    except Exception as e:
        logger.error("ai_generate_dek error: %s", e)
        return None


async def ai_suggest_tags(body: str, groq_client: Groq) -> Optional[list[str]]:
    """Suggest 4–6 relevant tags from article body."""
    try:
        response = await asyncio.to_thread(
            groq_client.chat.completions.create,
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a BlacUSA content tagger. Suggest 4–6 concise, relevant tags "
                        "for this article. Respond with ONLY a JSON array of strings, e.g. "
                        '["tag one", "tag two", "tag three"]'
                    ),
                },
                {"role": "user", "content": f"Article:\n{body[:2000]}"},
            ],
            temperature=0.4,
            max_tokens=150,
        )
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        tags = json.loads(raw)
        return tags if isinstance(tags, list) else []
    except Exception as e:
        logger.error("ai_suggest_tags error: %s", e)
        return None


async def ai_improve_paragraph(text: str, groq_client: Groq) -> Optional[str]:
    """Rewrite a paragraph in BlacUSA's editorial voice."""
    try:
        response = await asyncio.to_thread(
            groq_client.chat.completions.create,
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a senior BlacUSA editor. Rewrite the given paragraph in our "
                        "editorial voice: trauma-informed, solutions-oriented, person-first language, "
                        "dignified and energizing. Preserve the factual content. Respond with ONLY "
                        "the rewritten paragraph, no intro, no quotes."
                    ),
                },
                {"role": "user", "content": text},
            ],
            temperature=0.65,
            max_tokens=512,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error("ai_improve_paragraph error: %s", e)
        return None
