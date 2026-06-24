"""BlacUSA iteration-4 backend tests:
- Reader auth (register/login/me, role separation)
- Comments require login + verified flag
- Image optimize on upload (>2000px -> JPEG <=2000px)
- Scheduled publishing (future publish_at hides article publicly)
- Homepage curation (GET/PUT admin, public GET reflects, section ordering)
"""
import os
import io
import uuid
import pytest
import requests
from PIL import Image

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL")
            or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split("\n")[0]).rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@blacusa.com"
ADMIN_PASSWORD = "BlacUSA2026!"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def admin_auth(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def reader():
    """Register a fresh reader and return token + email."""
    email = f"TEST_reader_{uuid.uuid4().hex[:10]}@example.com"
    r = requests.post(f"{API}/auth/register",
                      json={"name": "Test Reader", "email": email, "password": "readerpass123"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "access_token" in data
    assert data["user"]["role"] == "reader"
    return {"email": email, "token": data["access_token"], "name": data["user"]["name"]}


@pytest.fixture(scope="module")
def reader_auth(reader):
    return {"Authorization": f"Bearer {reader['token']}"}


# ============== READER AUTH ==============
class TestReaderAuth:
    def test_register_duplicate_email_400(self, reader):
        r = requests.post(f"{API}/auth/register",
                          json={"name": "Dup", "email": reader["email"], "password": "anotherpass"})
        assert r.status_code == 400

    def test_register_short_password_400(self):
        email = f"TEST_short_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/auth/register",
                          json={"name": "X", "email": email, "password": "short"})
        assert r.status_code == 400

    def test_login_reader_works(self, reader):
        r = requests.post(f"{API}/auth/login",
                          json={"email": reader["email"], "password": "readerpass123"})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "reader"

    def test_me_returns_user(self, reader_auth, reader):
        r = requests.get(f"{API}/auth/me", headers=reader_auth)
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == reader["email"].lower()
        assert body["role"] == "reader"

    def test_reader_token_blocked_from_admin(self, reader_auth):
        r = requests.get(f"{API}/admin/overview", headers=reader_auth)
        assert r.status_code == 403

    def test_admin_login_still_works(self, admin_auth):
        r = requests.get(f"{API}/auth/me", headers=admin_auth)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"


# ============== COMMENTS AUTH GATE ==============
@pytest.fixture(scope="module")
def known_slug():
    r = requests.get(f"{API}/articles")
    assert r.status_code == 200
    arts = r.json()
    assert arts
    # Prefer busa-preview if present
    for a in arts:
        if a["slug"] == "busa-preview":
            return "busa-preview"
    return arts[0]["slug"]


class TestCommentsAuth:
    def test_comment_without_token_returns_401(self, known_slug):
        r = requests.post(f"{API}/articles/{known_slug}/comments",
                          json={"body": "anonymous attempt"})
        assert r.status_code == 401

    def test_comment_with_reader_token_creates_pending_verified(self, reader_auth, reader, known_slug, admin_auth):
        body = f"TEST_reader_comment_{uuid.uuid4().hex[:8]}"
        r = requests.post(f"{API}/articles/{known_slug}/comments",
                          headers=reader_auth, json={"body": body})
        assert r.status_code == 200, r.text
        # Verify in admin queue
        items = requests.get(f"{API}/admin/comments", params={"status": "pending_review"},
                             headers=admin_auth).json()
        target = next((c for c in items if c["body"] == body), None)
        assert target is not None, "comment not in pending queue"
        assert target["verified"] is True
        assert target["name"] == reader["name"]
        assert target["status"] == "pending_review"
        # Cleanup
        requests.delete(f"{API}/admin/comments/{target['id']}", headers=admin_auth)

    def test_public_get_returns_only_approved(self, known_slug):
        r = requests.get(f"{API}/articles/{known_slug}/comments")
        assert r.status_code == 200
        for c in r.json():
            assert c.get("status", "approved") == "approved"


# ============== IMAGE OPTIMIZE ==============
def _make_large_jpeg(w=3000, h=2000):
    img = Image.new("RGB", (w, h), (200, 100, 50))
    out = io.BytesIO()
    img.save(out, format="JPEG", quality=95)
    return out.getvalue()


class TestImageOptimize:
    def test_large_image_resized_to_2000(self, admin_auth):
        original = _make_large_jpeg(3000, 2000)
        files = {"file": ("big.jpg", original, "image/jpeg")}
        r = requests.post(f"{API}/admin/upload", files=files, headers=admin_auth)
        assert r.status_code == 200, r.text
        url = r.json()["url"]
        rf = requests.get(f"{BASE_URL}{url}")
        assert rf.status_code == 200
        ct = rf.headers.get("Content-Type", "")
        assert ct.startswith("image/jpeg") or ct.startswith("image/")
        # Decode and verify dimensions
        img = Image.open(io.BytesIO(rf.content))
        assert img.width <= 2000, f"image width {img.width} > 2000"
        # Compressed should be smaller than the high-quality source
        assert len(rf.content) < len(original)

    def test_unauth_upload_401(self):
        r = requests.post(f"{API}/admin/upload",
                          files={"file": ("x.jpg", _make_large_jpeg(10, 10), "image/jpeg")})
        assert r.status_code == 401

    def test_non_image_400(self, admin_auth):
        r = requests.post(f"{API}/admin/upload",
                          files={"file": ("evil.txt", b"hello", "text/plain")},
                          headers=admin_auth)
        assert r.status_code == 400


# ============== SCHEDULED PUBLISHING ==============
@pytest.fixture
def scheduled_article(admin_auth):
    slug = f"test-sched-{uuid.uuid4().hex[:8]}"
    future = "2099-12-31T00:00:00+00:00"
    payload = {
        "slug": slug, "title": "TEST scheduled", "dek": "", "category": "politics",
        "is_published": True, "publish_at": future, "body": ["hi"]
    }
    r = requests.post(f"{API}/admin/articles", json=payload, headers=admin_auth)
    assert r.status_code == 200, r.text
    aid = r.json()["id"]
    yield {"id": aid, "slug": slug}
    requests.delete(f"{API}/admin/articles/{aid}", headers=admin_auth)


@pytest.fixture
def past_article(admin_auth):
    slug = f"test-past-{uuid.uuid4().hex[:8]}"
    past = "2020-01-01T00:00:00+00:00"
    payload = {
        "slug": slug, "title": "TEST past", "dek": "", "category": "politics",
        "is_published": True, "publish_at": past, "body": ["hi"]
    }
    r = requests.post(f"{API}/admin/articles", json=payload, headers=admin_auth)
    assert r.status_code == 200, r.text
    aid = r.json()["id"]
    yield {"id": aid, "slug": slug}
    requests.delete(f"{API}/admin/articles/{aid}", headers=admin_auth)


class TestScheduledPublishing:
    def test_future_article_hidden_publicly(self, scheduled_article):
        slug = scheduled_article["slug"]
        # Public list excludes
        arts = requests.get(f"{API}/articles").json()
        assert all(a["slug"] != slug for a in arts)
        # Public detail 404
        r = requests.get(f"{API}/articles/{slug}")
        assert r.status_code == 404

    def test_future_article_visible_in_admin(self, scheduled_article, admin_auth):
        items = requests.get(f"{API}/admin/articles", headers=admin_auth).json()
        match = next((a for a in items if a["slug"] == scheduled_article["slug"]), None)
        assert match is not None
        assert match.get("publish_at")

    def test_past_publish_at_visible_publicly(self, past_article):
        slug = past_article["slug"]
        arts = requests.get(f"{API}/articles").json()
        assert any(a["slug"] == slug for a in arts)
        r = requests.get(f"{API}/articles/{slug}")
        assert r.status_code == 200


# ============== HOMEPAGE CURATION ==============
class TestHomepageCuration:
    def test_admin_get_homepage_structure(self, admin_auth):
        r = requests.get(f"{API}/admin/homepage", headers=admin_auth)
        assert r.status_code == 200
        data = r.json()
        assert "config" in data and "articles" in data
        assert isinstance(data["articles"], list)
        assert len(data["articles"]) >= 1

    def test_curate_and_public_reflects(self, admin_auth):
        # Get available articles
        data = requests.get(f"{API}/admin/homepage", headers=admin_auth).json()
        articles = data["articles"]
        assert len(articles) >= 4
        lead_slug = articles[0]["slug"]
        also = [articles[1]["slug"], articles[2]["slug"]]
        latest = [a["slug"] for a in articles[3:6]]
        # Save original config to restore
        original = data["config"]
        try:
            payload = {"lead": lead_slug, "also_leading": also, "latest": latest, "sections": {}}
            r = requests.put(f"{API}/admin/homepage", json=payload, headers=admin_auth)
            assert r.status_code == 200
            # Public homepage reflects
            hp = requests.get(f"{API}/homepage").json()
            assert hp["lead"]["slug"] == lead_slug
            assert [a["slug"] for a in hp["also_leading"]] == also
            assert [a["slug"] for a in hp["latest"]] == latest
        finally:
            # Restore (or clear)
            restore = {
                "lead": original.get("lead"),
                "also_leading": original.get("also_leading", []),
                "latest": original.get("latest", []),
                "sections": original.get("sections", {}),
            }
            requests.put(f"{API}/admin/homepage", json=restore, headers=admin_auth)

    def test_section_ordering_honored(self, admin_auth):
        # Find articles in politics
        all_arts = requests.get(f"{API}/articles", params={"category": "politics"}).json()
        if len(all_arts) < 2:
            pytest.skip("not enough politics articles")
        # Pick the LAST politics article and force it to top of section
        target = all_arts[-1]["slug"]
        data = requests.get(f"{API}/admin/homepage", headers=admin_auth).json()
        original = data["config"]
        try:
            payload = {
                "lead": original.get("lead"),
                "also_leading": original.get("also_leading", []),
                "latest": original.get("latest", []),
                "sections": {"politics": [target]},
            }
            r = requests.put(f"{API}/admin/homepage", json=payload, headers=admin_auth)
            assert r.status_code == 200
            ordered = requests.get(f"{API}/articles", params={"category": "politics"}).json()
            assert ordered[0]["slug"] == target
        finally:
            restore = {
                "lead": original.get("lead"),
                "also_leading": original.get("also_leading", []),
                "latest": original.get("latest", []),
                "sections": original.get("sections", {}),
            }
            requests.put(f"{API}/admin/homepage", json=restore, headers=admin_auth)

    def test_admin_homepage_requires_auth(self):
        r = requests.get(f"{API}/admin/homepage")
        assert r.status_code == 401
