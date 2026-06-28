#!/usr/bin/env python3
"""
BlacUSA Backend API Test Suite
Tests the counters API at the external URL with /api prefix
"""

import requests
from datetime import datetime
import sys

# Read backend URL from frontend .env
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BASE_URL = line.split('=', 1)[1].strip()
            break

API_BASE = f"{BASE_URL}/api"

print(f"Testing BlacUSA API at: {API_BASE}")
print("=" * 80)

# Track test results
passed = 0
failed = 0
errors = []

def test_result(name, condition, error_msg=""):
    global passed, failed, errors
    if condition:
        passed += 1
        print(f"✅ {name}")
        return True
    else:
        failed += 1
        print(f"❌ {name}")
        if error_msg:
            print(f"   Error: {error_msg}")
            errors.append(f"{name}: {error_msg}")
        return False

# ============================================================================
# Test 1: Root endpoint
# ============================================================================
print("\n[Test 1] GET /api/ - Root endpoint")
try:
    resp = requests.get(f"{API_BASE}/", timeout=10)
    test_result("Root returns 200", resp.status_code == 200, f"Got {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        test_result("Root has message field", "message" in data, f"Response: {data}")
except Exception as e:
    test_result("Root endpoint accessible", False, str(e))

# ============================================================================
# Test 2: Status endpoints
# ============================================================================
print("\n[Test 2] POST /api/status and GET /api/status")
try:
    # POST status
    post_resp = requests.post(
        f"{API_BASE}/status",
        json={"client_name": "test_client_blacusa"},
        timeout=10
    )
    test_result("POST /api/status returns 200", post_resp.status_code == 200, f"Got {post_resp.status_code}")
    
    if post_resp.status_code == 200:
        post_data = post_resp.json()
        test_result("POST response has id", "id" in post_data)
        test_result("POST response has client_name", post_data.get("client_name") == "test_client_blacusa")
    
    # GET status
    get_resp = requests.get(f"{API_BASE}/status", timeout=10)
    test_result("GET /api/status returns 200", get_resp.status_code == 200, f"Got {get_resp.status_code}")
    
    if get_resp.status_code == 200:
        get_data = get_resp.json()
        test_result("GET status returns array", isinstance(get_data, list))
except Exception as e:
    test_result("Status endpoints work", False, str(e))

# ============================================================================
# Test 3: GET /api/counters/meta
# ============================================================================
print("\n[Test 3] GET /api/counters/meta")
try:
    resp = requests.get(f"{API_BASE}/counters/meta", timeout=10)
    test_result("Meta endpoint returns 200", resp.status_code == 200, f"Got {resp.status_code}")
    
    if resp.status_code == 200:
        meta = resp.json()
        test_result("Meta has 'counters' field", "counters" in meta, f"Keys: {list(meta.keys())}")
        test_result("Meta counters == 32", meta.get("counters") == 32, f"Got {meta.get('counters')}")
        test_result("Meta has 'etl_ingestion' == 'stub'", meta.get("etl_ingestion") == "stub", f"Got {meta.get('etl_ingestion')}")
except Exception as e:
    test_result("Meta endpoint accessible", False, str(e))

# ============================================================================
# Test 4: GET /api/counters - Main counters endpoint
# ============================================================================
print("\n[Test 4] GET /api/counters - Main endpoint structure")
try:
    resp = requests.get(f"{API_BASE}/counters", timeout=10)
    test_result("Counters endpoint returns 200", resp.status_code == 200, f"Got {resp.status_code}")
    
    if resp.status_code != 200:
        print(f"Response body: {resp.text[:500]}")
        sys.exit(1)
    
    data = resp.json()
    
    # Check top-level structure
    test_result("Response has 'hero' field", "hero" in data, f"Keys: {list(data.keys())}")
    test_result("Response has 'sections' field", "sections" in data, f"Keys: {list(data.keys())}")
    test_result("Response has 'ticker' field", "ticker" in data, f"Keys: {list(data.keys())}")
    
    # ========================================================================
    # Test 4a: Hero structure
    # ========================================================================
    print("\n[Test 4a] Hero structure")
    hero = data.get("hero", {})
    test_result("Hero has 'slug'", "slug" in hero, f"Hero keys: {list(hero.keys())}")
    test_result("Hero slug == 'black-population'", hero.get("slug") == "black-population", f"Got {hero.get('slug')}")
    test_result("Hero has 'caption'", "caption" in hero)
    test_result("Hero has 'baselineValue'", "baselineValue" in hero)
    test_result("Hero has 'baselineTimestamp'", "baselineTimestamp" in hero)
    test_result("Hero has 'annualRate'", "annualRate" in hero)
    test_result("Hero has 'source'", "source" in hero)
    
    # Hero should be fixed with stored values
    test_result("Hero baselineValue == 49200000", hero.get("baselineValue") == 49200000, f"Got {hero.get('baselineValue')}")
    test_result("Hero baselineTimestamp == 2024-07-01T00:00:00", hero.get("baselineTimestamp") == "2024-07-01T00:00:00", f"Got {hero.get('baselineTimestamp')}")
    test_result("Hero annualRate == 540000", hero.get("annualRate") == 540000, f"Got {hero.get('annualRate')}")
    
    # ========================================================================
    # Test 4b: Sections structure and ordering
    # ========================================================================
    print("\n[Test 4b] Sections structure and ordering")
    sections = data.get("sections", [])
    test_result("Sections is non-empty array", isinstance(sections, list) and len(sections) > 0, f"Got {type(sections)}, len={len(sections)}")
    
    expected_order = ["demographics", "economics", "health", "environment", "justice"]
    actual_order = [s.get("key") for s in sections]
    test_result("Sections ordered correctly", actual_order == expected_order, f"Got {actual_order}")
    
    for section in sections:
        test_result(f"Section '{section.get('key')}' has 'title'", "title" in section)
        test_result(f"Section '{section.get('key')}' has 'rows'", "rows" in section)
        test_result(f"Section '{section.get('key')}' rows is non-empty", isinstance(section.get("rows"), list) and len(section.get("rows", [])) > 0)
    
    # ========================================================================
    # Test 4c: Ticker structure
    # ========================================================================
    print("\n[Test 4c] Ticker structure")
    ticker = data.get("ticker", [])
    test_result("Ticker is array", isinstance(ticker, list))
    test_result("Ticker is non-empty", len(ticker) > 0, f"Got {len(ticker)} items")
    
    # ========================================================================
    # Test 4d: Row structure validation
    # ========================================================================
    print("\n[Test 4d] Row structure validation")
    
    all_rows = []
    for section in sections:
        all_rows.extend(section.get("rows", []))
    
    test_result("Total rows == 32", len(all_rows) == 32, f"Got {len(all_rows)} rows")
    
    # Check each row has required fields
    live_rows = []
    static_rows = []
    
    for row in all_rows:
        slug = row.get("slug", "unknown")
        
        # All rows must have slug and label
        if not test_result(f"Row '{slug}' has 'slug'", "slug" in row):
            continue
        test_result(f"Row '{slug}' has 'label'", "label" in row)
        
        if "label" in row:
            test_result(f"Row '{slug}' label has 'pre'", "pre" in row["label"])
        
        # Categorize by type
        if "static" in row:
            static_rows.append(row)
        else:
            live_rows.append(row)
    
    print(f"\n   Found {len(live_rows)} LIVE rows and {len(static_rows)} STATIC rows")
    
    # ========================================================================
    # Test 4e: LIVE row validation
    # ========================================================================
    print("\n[Test 4e] LIVE row validation")
    
    for row in live_rows:
        slug = row.get("slug")
        test_result(f"LIVE row '{slug}' has 'baselineValue'", "baselineValue" in row)
        test_result(f"LIVE row '{slug}' has 'baselineTimestamp'", "baselineTimestamp" in row)
        test_result(f"LIVE row '{slug}' has 'annualRate'", "annualRate" in row)
        test_result(f"LIVE row '{slug}' has 'prefix'", "prefix" in row)
        test_result(f"LIVE row '{slug}' has 'suffix'", "suffix" in row)
        test_result(f"LIVE row '{slug}' has 'decimals'", "decimals" in row)
    
    # ========================================================================
    # Test 4f: STATIC row validation
    # ========================================================================
    print("\n[Test 4f] STATIC row validation")
    
    for row in static_rows:
        slug = row.get("slug")
        test_result(f"STATIC row '{slug}' has 'static' field", "static" in row)
        test_result(f"STATIC row '{slug}' static is string", isinstance(row.get("static"), str))
    
    # ========================================================================
    # Test 5: Baseline resolution correctness
    # ========================================================================
    print("\n[Test 5] Baseline resolution correctness")
    
    now = datetime.now()
    current_year = now.year
    today_date = now.strftime("%Y-%m-%d")
    
    # Expected timestamps
    year_start_ts = f"{current_year}-01-01T00:00:00"
    day_start_ts = f"{today_date}T00:00:00"
    
    print(f"   Current year: {current_year}")
    print(f"   Expected year_start timestamp: {year_start_ts}")
    print(f"   Expected day_start timestamp: {day_start_ts}")
    
    # Test year_start rows (ending in -year)
    year_rows = [r for r in live_rows if r.get("slug", "").endswith("-year")]
    print(f"\n   Testing {len(year_rows)} -year rows:")
    for row in year_rows:
        slug = row.get("slug")
        test_result(f"Row '{slug}' baselineValue == 0", row.get("baselineValue") == 0, f"Got {row.get('baselineValue')}")
        test_result(f"Row '{slug}' baselineTimestamp == {year_start_ts}", row.get("baselineTimestamp") == year_start_ts, f"Got {row.get('baselineTimestamp')}")
    
    # Test day_start rows (ending in -today)
    day_rows = [r for r in live_rows if r.get("slug", "").endswith("-today")]
    print(f"\n   Testing {len(day_rows)} -today rows:")
    for row in day_rows:
        slug = row.get("slug")
        test_result(f"Row '{slug}' baselineValue == 0", row.get("baselineValue") == 0, f"Got {row.get('baselineValue')}")
        test_result(f"Row '{slug}' baselineTimestamp == {day_start_ts}", row.get("baselineTimestamp") == day_start_ts, f"Got {row.get('baselineTimestamp')}")
    
    # Test fixed rows (specific slugs with stored values)
    fixed_slugs = {
        "black-population": {"value": 49200000, "ts": "2024-07-01T00:00:00"},
        "eligible-voters": {"value": 34400000, "ts": "2024-07-01T00:00:00"},
        "employer-firms": {"value": 200885, "ts": "2024-07-01T00:00:00"},
        "biz-employees": {"value": 1600000, "ts": "2024-07-01T00:00:00"},
        "black-farms": {"value": 28723, "ts": "2024-07-01T00:00:00"},
        "farmland-acres": {"value": 4700000, "ts": "2024-07-01T00:00:00"},
    }
    
    print(f"\n   Testing {len(fixed_slugs)} fixed rows:")
    for slug, expected in fixed_slugs.items():
        row = next((r for r in live_rows if r.get("slug") == slug), None)
        if row:
            test_result(f"Row '{slug}' baselineValue == {expected['value']}", row.get("baselineValue") == expected["value"], f"Got {row.get('baselineValue')}")
            test_result(f"Row '{slug}' baselineTimestamp == {expected['ts']}", row.get("baselineTimestamp") == expected["ts"], f"Got {row.get('baselineTimestamp')}")
        else:
            test_result(f"Row '{slug}' exists", False, "Row not found")

except Exception as e:
    test_result("Counters endpoint test", False, str(e))
    import traceback
    print(traceback.format_exc())

# ============================================================================
# Summary
# ============================================================================
print("\n" + "=" * 80)
print(f"SUMMARY: {passed} passed, {failed} failed")
print("=" * 80)

if failed > 0:
    print("\nFailed tests:")
    for error in errors:
        print(f"  - {error}")
    sys.exit(1)
else:
    print("\n✅ All tests passed!")
    sys.exit(0)
