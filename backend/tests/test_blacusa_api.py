"""BlacUSA backend API tests."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL") or "https://busa-preview.preview.emergentagent.com"
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ---- Health / Categories ----
def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("status") == "live"


def test_categories(s):
    r = s.get(f"{API}/categories")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) == 6
    slugs = {c["slug"] for c in data}
    assert {"politics", "health-equity", "criminal-justice", "environmental-racism", "solutions", "rural"} <= slugs


# ---- Articles ----
def test_articles_list(s):
    r = s.get(f"{API}/articles")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) >= 8
    assert "_id" not in data[0]
    assert {"slug", "title", "category"} <= set(data[0].keys())


def test_articles_filter_category(s):
    r = s.get(f"{API}/articles", params={"category": "politics"})
    assert r.status_code == 200
    data = r.json()
    assert all(a["category"] == "politics" for a in data)
    assert len(data) >= 1


def test_articles_filter_solutions(s):
    r = s.get(f"{API}/articles", params={"solutions": "true"})
    assert r.status_code == 200
    data = r.json()
    assert all(a["is_solutions"] is True for a in data)


def test_articles_filter_featured(s):
    r = s.get(f"{API}/articles", params={"featured": "true"})
    assert r.status_code == 200
    data = r.json()
    assert all(a["is_featured"] is True for a in data)


def test_articles_limit(s):
    r = s.get(f"{API}/articles", params={"limit": 2})
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_article_by_slug(s):
    # get a real slug
    all_articles = s.get(f"{API}/articles").json()
    slug = all_articles[0]["slug"]
    r = s.get(f"{API}/articles/{slug}")
    assert r.status_code == 200
    data = r.json()
    assert "article" in data and "related" in data
    assert data["article"]["slug"] == slug
    assert isinstance(data["related"], list)


def test_article_404(s):
    r = s.get(f"{API}/articles/does-not-exist-slug-xyz")
    assert r.status_code == 404


# ---- Cold Cases ----
def test_cold_cases_list(s):
    r = s.get(f"{API}/cold-cases")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) >= 10
    assert "_id" not in data[0]


def test_cold_cases_stats(s):
    r = s.get(f"{API}/cold-cases/stats")
    assert r.status_code == 200
    data = r.json()
    assert {"total", "open", "cold", "solved"} <= set(data.keys())
    assert data["total"] == data["open"] + data["cold"] + data["solved"]


def test_cold_cases_filter_type(s):
    r = s.get(f"{API}/cold-cases", params={"case_type": "Homicide"})
    assert r.status_code == 200
    data = r.json()
    assert all(c["case_type"] == "Homicide" for c in data)
    assert len(data) >= 1


def test_cold_cases_filter_status(s):
    r = s.get(f"{API}/cold-cases", params={"status": "Open"})
    assert r.status_code == 200
    assert all(c["status"] == "Open" for c in r.json())


def test_cold_cases_filter_state(s):
    r = s.get(f"{API}/cold-cases", params={"state": "IL"})
    assert r.status_code == 200
    assert all(c["state"] == "IL" for c in r.json())


def test_cold_cases_search_q(s):
    # Search by name
    r = s.get(f"{API}/cold-cases", params={"q": "Denise"})
    assert r.status_code == 200
    data = r.json()
    assert any("Denise" in c["name"] for c in data)

    # Search by case_number
    r2 = s.get(f"{API}/cold-cases", params={"q": "BUS-2017"})
    assert r2.status_code == 200
    assert any("BUS-2017" in c["case_number"] for c in r2.json())


def test_cold_case_detail(s):
    all_cases = s.get(f"{API}/cold-cases").json()
    cn = all_cases[0]["case_number"]
    r = s.get(f"{API}/cold-cases/{cn}")
    assert r.status_code == 200
    assert r.json()["case_number"] == cn


def test_cold_case_404(s):
    r = s.get(f"{API}/cold-cases/BUS-9999-0000")
    assert r.status_code == 404


# ---- Tips ----
def test_submit_tip(s):
    payload = {
        "case_number": "BUS-2019-0412",
        "case_name": "TEST_Denise",
        "name": "TEST_Tipster",
        "contact": "test@example.com",
        "message": "TEST_I saw something on the corner of Elm.",
        "anonymous": False,
    }
    r = s.post(f"{API}/tips", json=payload)
    assert r.status_code == 200
    d = r.json()
    assert d.get("ok") is True and "id" in d


def test_submit_tip_minimal(s):
    r = s.post(f"{API}/tips", json={"message": "TEST_anon tip", "anonymous": True})
    assert r.status_code == 200
    assert r.json().get("ok") is True


# ---- Membership ----
def test_membership_tiers(s):
    r = s.get(f"{API}/membership/tiers")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) == 3
    keys = {t["key"] for t in data}
    assert {"reader", "member", "co-owner"} == keys


def test_membership_join(s):
    r = s.post(f"{API}/membership", json={"tier": "member", "name": "TEST_User", "email": "test_member@example.com"})
    assert r.status_code == 200
    assert r.json().get("ok") is True


# ---- Subscribe ----
def test_subscribe_and_dedupe(s):
    email = "test_subscribe_unique@example.com"
    r1 = s.post(f"{API}/subscribe", json={"email": email})
    assert r1.status_code == 200
    assert r1.json().get("ok") is True

    r2 = s.post(f"{API}/subscribe", json={"email": email})
    assert r2.status_code == 200
    assert r2.json().get("ok") is True
    assert "already" in r2.json().get("message", "").lower()
