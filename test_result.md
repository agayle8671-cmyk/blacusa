#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Clone of worldometers.info structure, customized as BlacUSA — a real-time demographic & civic data tracker for Black America. Live client-side extrapolation counters, served from a backend /api/counters endpoint backed by MongoDB live_counters."

backend:
  - task: "GET /api/counters returns hero, sections, ticker with resolved baselines"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Serves assembled dashboard config. Resolves year_start/day_start baseline_kind to concrete ISO timestamps + value=0 at request time; fixed kind uses stored values. Groups live_counters by category, ordered by 'order'."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED all tests. Verified: (1) Returns 200 with correct JSON shape {hero, sections, ticker}. (2) Hero has all required fields (slug='black-population', caption, baselineValue=49200000, baselineTimestamp='2024-07-01T00:00:00', annualRate=540000, source). (3) Sections array ordered correctly: demographics, economics, health, environment, justice - all non-empty with proper structure. (4) All 32 rows present (20 LIVE + 12 STATIC). (5) LIVE rows have all required fields: baselineValue, baselineTimestamp, annualRate, prefix, suffix, decimals. (6) STATIC rows have 'static' string field. (7) Baseline resolution CORRECT: year_start rows (8 total: births-year, deaths-year, net-growth-year, buying-power-year, biz-revenue-year, asthma-er-year, maternal-deaths-year, arrests-year) have baselineValue=0 and baselineTimestamp='2026-01-01T00:00:00'. (8) day_start rows (6 total: births-today, deaths-today, net-growth-today, biz-revenue-today, asthma-er-today, arrests-today) have baselineValue=0 and baselineTimestamp='2026-06-28T00:00:00'. (9) Fixed rows (black-population, eligible-voters, employer-firms, biz-employees, black-farms, farmland-acres) retain stored values with baselineTimestamp='2024-07-01T00:00:00'. (10) Ticker array is non-empty. All 325 test assertions passed."
  - task: "Counter seeding on startup (live_counters + counter_meta)"
    implemented: true
    working: true
    file: "backend/server.py, backend/seed_counters.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "32 counters + meta seeded if collections empty. Verified via startup logs and curl."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED. Verified seeding is working correctly - GET /api/counters returns all 32 counters with proper structure, and GET /api/counters/meta confirms 32 counters in database. Seeding logic is idempotent (only seeds when collections are empty)."
  - task: "GET /api/counters/meta status echo"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Returns counter count + ETL stub note."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED. Returns 200 with correct structure: counters=32, etl_ingestion='stub', plus note and generated_at timestamp."

frontend:
  - task: "Worldometer-style dashboard renders all sections with live-ticking + static rows"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/Dashboard.jsx, components/Section.jsx, components/WorldRow.jsx, hooks/useOdometer.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Counters tick via requestAnimationFrame direct-DOM mutation (tabular-nums). Verified visually via screenshot."
  - task: "Data fetched from /api/counters with mock fallback (CountersContext)"
    implemented: true
    working: "NA"
    file: "frontend/src/context/CountersContext.jsx, lib/api.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Starts with mock for instant render, swaps in server data on fetch success."
  - task: "Header nav (Population scroll, More dropdown, mobile menu) + masthead Ticker"
    implemented: true
    working: "NA"
    file: "frontend/src/components/Header.jsx, components/Ticker.jsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "More dropdown lists sections, clicks smooth-scroll. Ticker is react-fast-marquee."
  - task: "[+] expander reveals source/detail per row"
    implemented: true
    working: "NA"
    file: "frontend/src/components/WorldRow.jsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Toggles a detail note for rows that have detail text."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "Worldometer-style dashboard renders all sections with live-ticking + static rows"
    - "Data fetched from /api/counters with mock fallback (CountersContext)"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    -agent: "main"
    -message: "Backend implemented per the BlacUSA document. Please test GET /api/counters: (1) 200 + shape {hero, sections[], ticker[]}; (2) year_start rows have baselineValue 0 and baselineTimestamp = Jan 1 current year; day_start rows have baselineTimestamp = today's midnight; fixed rows keep stored values; (3) static rows include a 'static' string and no baseline fields requirement; (4) sections ordered demographics, economics, health, environment, justice with rows sorted by order; (5) /api/counters/meta returns counter count. Frontend testing will follow after backend passes."
    -agent: "testing"
    -message: "✅ ALL BACKEND TESTS PASSED (325/325 assertions). Comprehensive testing completed: (1) GET /api/ root endpoint working. (2) POST/GET /api/status endpoints working. (3) GET /api/counters/meta returns correct count (32) and etl_ingestion='stub'. (4) GET /api/counters returns proper structure with hero, sections (ordered: demographics, economics, health, environment, justice), and ticker. (5) All 32 rows present (20 LIVE + 12 STATIC). (6) Baseline resolution is CORRECT: year_start rows reset to Jan 1 2026 with value=0, day_start rows reset to today (2026-06-28) with value=0, fixed rows retain stored values from 2024-07-01. (7) All row schemas validated. Backend is production-ready. Frontend testing NOT performed per system limitations (UI testing excluded). Main agent should summarize and finish."