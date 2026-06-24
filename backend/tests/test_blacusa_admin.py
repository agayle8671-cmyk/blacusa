"""BlacUSA admin/auth/radius backend tests (iteration 2)."""
import os
import uuid
import pytest
import requests

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split("\n")[0]).rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@blacusa.com"
ADMIN_PASSWORD = "BlacUSA2026!"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="module")
def token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "access_token" in data and data.get("token_type") == "bearer"
    assert data["user"]["email"] == ADMIN_EMAIL
    assert data["user"]["role"] == "admin"
    return data["access_token"]


@pytest.fixture(scope="module")
def auth(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------------- Auth ----------------
def test_login_wrong_password(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong-pass"})
    assert r.status_code == 401


def test_auth_me(s, auth):
    r = s.get(f"{API}/auth/me", headers=auth)
    assert r.status_code == 200
    assert r.json()["email"] == ADMIN_EMAIL
    assert r.json()["role"] == "admin"


def test_admin_overview_no_token(s):
    r = requests.get(f"{API}/admin/overview")
    assert r.status_code == 401


def test_admin_overview_with_token(s, auth):
    r = s.get(f"{API}/admin/overview", headers=auth)
    assert r.status_code == 200
    d = r.json()
    for k in ["articles", "published", "cold_cases", "tips_pending", "subscribers", "memberships"]:
        assert k in d


# ---------------- Articles ----------------
@pytest.fixture(scope="module")
def created_article(s, auth):
    slug = f"test-article-{uuid.uuid4().hex[:8]}"
    payload = {
        "slug": slug,
        "title": "TEST Admin Article",
        "dek": "TEST dek",
        "category": "politics",
        "is_published": True,
        "body": ["Para 1", "Para 2"],
    }
    r = s.post(f"{API}/admin/articles", json=payload, headers=auth)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["slug"] == slug
    assert "id" in data
    yield data
    # cleanup
    s.delete(f"{API}/admin/articles/{data['id']}", headers=auth)


def test_admin_list_articles(s, auth, created_article):
    r = s.get(f"{API}/admin/articles", headers=auth)
    assert r.status_code == 200
    slugs = [a["slug"] for a in r.json()]
    assert created_article["slug"] in slugs


def test_published_article_visible_publicly(s, created_article):
    r = s.get(f"{API}/articles")
    assert r.status_code == 200
    slugs = [a["slug"] for a in r.json()]
    assert created_article["slug"] in slugs


def test_article_duplicate_slug(s, auth, created_article):
    payload = {
        "slug": created_article["slug"],
        "title": "DUP",
        "category": "politics",
    }
    r = s.post(f"{API}/admin/articles", json=payload, headers=auth)
    assert r.status_code == 400


def test_article_unpublish_hides_from_public(s, auth, created_article):
    payload = {
        "slug": created_article["slug"],
        "title": created_article["title"],
        "dek": created_article.get("dek", ""),
        "category": created_article["category"],
        "is_published": False,
        "body": created_article.get("body", []),
    }
    r = s.put(f"{API}/admin/articles/{created_article['id']}", json=payload, headers=auth)
    assert r.status_code == 200

    # not in public
    pub = s.get(f"{API}/articles").json()
    assert created_article["slug"] not in [a["slug"] for a in pub]
    # but in admin list
    adm = s.get(f"{API}/admin/articles", headers=auth).json()
    assert created_article["slug"] in [a["slug"] for a in adm]


def test_article_delete(s, auth):
    slug = f"test-delete-{uuid.uuid4().hex[:8]}"
    r = s.post(f"{API}/admin/articles", json={"slug": slug, "title": "TD", "category": "politics"}, headers=auth)
    assert r.status_code == 200
    aid = r.json()["id"]
    r2 = s.delete(f"{API}/admin/articles/{aid}", headers=auth)
    assert r2.status_code == 200
    r3 = s.delete(f"{API}/admin/articles/{aid}", headers=auth)
    assert r3.status_code == 404


# ---------------- Cold Cases ----------------
@pytest.fixture(scope="module")
def created_case(s, auth):
    cn = f"TEST-{uuid.uuid4().hex[:8]}"
    payload = {
        "case_number": cn,
        "name": "TEST Case Person",
        "case_type": "Homicide",
        "status": "Open",
        "date_reported": "2024-01-01",
        "city": "Chicago",
        "state": "IL",
        "lat": 41.8781,
        "lng": -87.6298,
    }
    r = s.post(f"{API}/admin/cold-cases", json=payload, headers=auth)
    assert r.status_code == 200, r.text
    data = r.json()
    yield data
    s.delete(f"{API}/admin/cold-cases/{data['id']}", headers=auth)


def test_case_appears_publicly(s, created_case):
    r = s.get(f"{API}/cold-cases")
    nums = [c["case_number"] for c in r.json()]
    assert created_case["case_number"] in nums


def test_case_duplicate_number(s, auth, created_case):
    payload = {
        "case_number": created_case["case_number"],
        "name": "DUP",
        "case_type": "Homicide",
        "date_reported": "2024-01-02",
    }
    r = s.post(f"{API}/admin/cold-cases", json=payload, headers=auth)
    assert r.status_code == 400


def test_case_update_and_delete(s, auth):
    cn = f"TEST-UPD-{uuid.uuid4().hex[:8]}"
    r = s.post(f"{API}/admin/cold-cases", json={
        "case_number": cn, "name": "X", "case_type": "Homicide", "date_reported": "2024-01-01",
    }, headers=auth)
    assert r.status_code == 200
    cid = r.json()["id"]
    r2 = s.put(f"{API}/admin/cold-cases/{cid}", json={
        "case_number": cn, "name": "Updated", "case_type": "Homicide", "date_reported": "2024-01-01",
    }, headers=auth)
    assert r2.status_code == 200
    r3 = s.delete(f"{API}/admin/cold-cases/{cid}", headers=auth)
    assert r3.status_code == 200


# ---------------- Radius search ----------------
def test_radius_search_chicago_50mi(s):
    r = s.get(f"{API}/cold-cases", params={"lat": 41.8781, "lng": -87.6298, "radius_miles": 50})
    assert r.status_code == 200
    cases = r.json()
    # All returned must have lat/lng and within 50mi (sanity check - all should be IL/Chicago-area)
    assert all(c.get("lat") is not None for c in cases)
    # Get all cases
    all_cases = s.get(f"{API}/cold-cases").json()
    assert len(cases) <= len(all_cases)


def test_radius_larger_returns_more(s):
    small = s.get(f"{API}/cold-cases", params={"lat": 41.8781, "lng": -87.6298, "radius_miles": 50}).json()
    big = s.get(f"{API}/cold-cases", params={"lat": 41.8781, "lng": -87.6298, "radius_miles": 5000}).json()
    assert len(big) >= len(small)


# ---------------- Tips ----------------
@pytest.fixture(scope="module")
def created_tip(s):
    r = s.post(f"{API}/tips", json={
        "message": "TEST admin tip workflow", "anonymous": True, "case_name": "TEST"
    })
    assert r.status_code == 200
    return r.json()["id"]


def test_admin_list_tips(s, auth, created_tip):
    r = s.get(f"{API}/admin/tips", headers=auth)
    assert r.status_code == 200
    ids = [t["id"] for t in r.json()]
    assert created_tip in ids


def test_admin_tips_filter_pending(s, auth, created_tip):
    r = s.get(f"{API}/admin/tips", params={"status": "pending_review"}, headers=auth)
    assert r.status_code == 200
    assert all(t["status"] == "pending_review" for t in r.json())


def test_admin_tip_status_transition(s, auth, created_tip):
    r = s.patch(f"{API}/admin/tips/{created_tip}", json={"status": "approved"}, headers=auth)
    assert r.status_code == 200
    # verify via list
    items = s.get(f"{API}/admin/tips", headers=auth).json()
    tip = next(t for t in items if t["id"] == created_tip)
    assert tip["status"] == "approved"


def test_admin_tip_invalid_status(s, auth, created_tip):
    r = s.patch(f"{API}/admin/tips/{created_tip}", json={"status": "garbage"}, headers=auth)
    assert r.status_code == 400


def test_admin_tip_delete(s, auth):
    r = s.post(f"{API}/tips", json={"message": "TEST delete", "anonymous": True})
    tid = r.json()["id"]
    r2 = s.delete(f"{API}/admin/tips/{tid}", headers=auth)
    assert r2.status_code == 200


# ---------------- Audience ----------------
def test_admin_subscribers(s, auth):
    # seed one
    s.post(f"{API}/subscribe", json={"email": f"test_aud_{uuid.uuid4().hex[:6]}@x.com"})
    r = s.get(f"{API}/admin/subscribers", headers=auth)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_admin_memberships(s, auth):
    s.post(f"{API}/membership", json={"tier": "member", "name": "TEST_aud", "email": f"m_{uuid.uuid4().hex[:6]}@x.com"})
    r = s.get(f"{API}/admin/memberships", headers=auth)
    assert r.status_code == 200
    assert isinstance(r.json(), list)
