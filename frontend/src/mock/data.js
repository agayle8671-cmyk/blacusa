/*
  BlacUSA — Worldometer-style data matrix (frontend-only V1).

  Each LIVE row carries the three variables the extrapolation engine needs:
    baselineValue     (V_base)  — absolute value at the baseline date
    baselineTimestamp (T_base)  — ISO 8601 of that baseline
    annualRate        (R_year)  — raw yearly change (engine derives per-second)

  STATIC rows render a fixed figure (used for ratios / context like Worldometer's
  non-ticking lines). Sources summarized from the strategic data matrix
  (Census ABS, FRED/Federal Reserve SCF, CDC NCHS, USDA, BJS, FBI UCR, Selig Center).

  Replace with a live GET /api/counters endpoint when the backend is wired.
*/

const _now = new Date();
const START_OF_YEAR = new Date(_now.getFullYear(), 0, 1).toISOString();
const START_OF_TODAY = new Date(
  _now.getFullYear(),
  _now.getMonth(),
  _now.getDate()
).toISOString();
const BASELINE_2024 = "2024-07-01T00:00:00";

/* The flagship hero counter (mirrors Worldometer's "Current World Population") */
export const HERO = {
  slug: "black-population",
  caption: "Current Black Population (U.S.)",
  baselineValue: 49200000,
  baselineTimestamp: BASELINE_2024,
  annualRate: 540000,
  source: "U.S. Census Bureau — 49.2M in 2024, a 36% increase since 2000.",
};

/* label = { pre, link, post } — `link` renders in Worldometer blue */
export const SECTIONS = [
  {
    key: "demographics",
    title: "Demographics & Population",
    rows: [
      {
        slug: "black-population",
        baselineValue: 49200000,
        baselineTimestamp: BASELINE_2024,
        annualRate: 540000,
        label: { pre: "Current Black Population (U.S.)" },
        detail:
          "U.S. Census Bureau. 49.2M in 2024 — Black alone, multiracial Black, and Black Hispanic. Up 36% since 2000.",
      },
      {
        slug: "births-year",
        baselineValue: 0,
        baselineTimestamp: START_OF_YEAR,
        annualRate: 620000,
        label: { pre: "Black births", link: "this year" },
        detail: "Projected from CDC NCHS natality baselines.",
      },
      {
        slug: "births-today",
        baselineValue: 0,
        baselineTimestamp: START_OF_TODAY,
        annualRate: 620000,
        label: { pre: "Black births", link: "today" },
        detail: "Projected from CDC NCHS natality baselines.",
      },
      {
        slug: "deaths-year",
        baselineValue: 0,
        baselineTimestamp: START_OF_YEAR,
        annualRate: 445000,
        label: { pre: "Black deaths", link: "this year" },
        detail: "Projected from CDC NCHS mortality baselines.",
      },
      {
        slug: "deaths-today",
        baselineValue: 0,
        baselineTimestamp: START_OF_TODAY,
        annualRate: 445000,
        label: { pre: "Black deaths", link: "today" },
        detail: "Projected from CDC NCHS mortality baselines.",
      },
      {
        slug: "net-growth-year",
        baselineValue: 0,
        baselineTimestamp: START_OF_YEAR,
        annualRate: 175000,
        label: { pre: "Net population growth", link: "this year" },
        detail: "Births minus deaths (excludes migration & re-identification).",
      },
      {
        slug: "net-growth-today",
        baselineValue: 0,
        baselineTimestamp: START_OF_TODAY,
        annualRate: 175000,
        label: { pre: "Net population growth", link: "today" },
      },
      {
        slug: "eligible-voters",
        baselineValue: 34400000,
        baselineTimestamp: BASELINE_2024,
        annualRate: 410000,
        label: { pre: "Black eligible voters" },
        detail:
          "Pew Research / Census — 34.4M in 2024, 14.0% of the total U.S. electorate.",
      },
    ],
  },
  {
    key: "economics",
    title: "Economic Equity & Wealth",
    rows: [
      {
        slug: "buying-power-year",
        baselineValue: 0,
        baselineTimestamp: START_OF_YEAR,
        annualRate: 1980000000000,
        prefix: "$",
        label: { pre: "Black consumer buying power", link: "this year" },
        detail: "Selig Center for Economic Growth — ~$1.98 trillion (2024).",
      },
      {
        slug: "biz-revenue-year",
        baselineValue: 0,
        baselineTimestamp: START_OF_YEAR,
        annualRate: 249000000000,
        prefix: "$",
        label: { pre: "Revenue by Black employer firms", link: "this year" },
        detail:
          "U.S. Census ABS — $249.0B in 2023, up 94.6% from $127.9B in 2017 (~$7,895/sec).",
      },
      {
        slug: "biz-revenue-today",
        baselineValue: 0,
        baselineTimestamp: START_OF_TODAY,
        annualRate: 249000000000,
        prefix: "$",
        label: { pre: "Revenue by Black employer firms", link: "today" },
      },
      {
        slug: "employer-firms",
        baselineValue: 200885,
        baselineTimestamp: BASELINE_2024,
        annualRate: 22000,
        label: { pre: "Black-owned employer firms" },
        detail: "U.S. Census ABS — 200,885 in 2022, up 56.9% since 2017.",
      },
      {
        slug: "biz-employees",
        baselineValue: 1600000,
        baselineTimestamp: BASELINE_2024,
        annualRate: 75000,
        label: { pre: "People employed by Black-owned firms" },
        detail: "U.S. Census ABS — 1.6M employees in 2022, up 39.1% since 2017.",
      },
      {
        slug: "median-wealth-black",
        static: "$44,100",
        label: { pre: "Median Black household net worth" },
        detail:
          "Federal Reserve SCF (2022). White median is $284,310 — a ~6x gap unchanged since 1992.",
      },
      {
        slug: "median-wealth-white",
        static: "$284,310",
        label: { pre: "Median White household net worth (for contrast)" },
        detail: "Federal Reserve Survey of Consumer Finances (2022).",
      },
    ],
  },
  {
    key: "health",
    title: "Public Health & Equity",
    rows: [
      {
        slug: "asthma-er-year",
        baselineValue: 0,
        baselineTimestamp: START_OF_YEAR,
        annualRate: 165000,
        label: { pre: "Pediatric asthma ER visits (Black children)", link: "this year" },
        detail:
          "Projected from CDC. Black children are nearly 5x more likely to be hospitalized for asthma.",
      },
      {
        slug: "asthma-er-today",
        baselineValue: 0,
        baselineTimestamp: START_OF_TODAY,
        annualRate: 165000,
        label: { pre: "Pediatric asthma ER visits (Black children)", link: "today" },
      },
      {
        slug: "maternal-deaths-year",
        baselineValue: 0,
        baselineTimestamp: START_OF_YEAR,
        annualRate: 278,
        label: { pre: "Black maternal deaths", link: "this year" },
        detail:
          "CDC NCHS (2024) — 44.8 per 100,000 live births, more than 3x the White rate (14.2).",
      },
      {
        slug: "maternal-rate",
        static: "44.8",
        label: { pre: "Black maternal mortality (per 100,000 births)" },
        detail: "CDC NCHS (2024). White: 14.2 · Hispanic: 12.1.",
      },
      {
        slug: "life-expectancy",
        static: "74.0",
        label: { pre: "Black life expectancy at birth (years)" },
        detail: "CDC NCHS (2023). White Americans: 78.4 years.",
      },
      {
        slug: "life-gap",
        static: "4.4",
        label: { pre: "Life-expectancy deficit vs White Americans (years)" },
        detail: "The aggregate 'Lost Years' of systemic health disparity.",
      },
    ],
  },
  {
    key: "environment",
    title: "Environmental Justice",
    rows: [
      {
        slug: "black-farms",
        baselineValue: 28723,
        baselineTimestamp: BASELINE_2024,
        annualRate: -800,
        label: { pre: "Black-owned farms remaining" },
        detail:
          "USDA Census of Agriculture (2022) — down from 218,000+ in 1910. Heirs' property land loss.",
      },
      {
        slug: "farmland-acres",
        baselineValue: 4700000,
        baselineTimestamp: BASELINE_2024,
        annualRate: -30000,
        label: { pre: "Black-owned farmland remaining (acres)" },
        detail: "USDA (2022) — down from 16M+ acres in 1910.",
      },
      {
        slug: "lost-land-value",
        static: "$326B",
        label: { pre: "Estimated value of lost Black farmland" },
        detail:
          "Union of Concerned Scientists — compounded lost generational wealth, yields & appreciation.",
      },
      {
        slug: "farm-share",
        static: "1.5%",
        label: { pre: "Share of U.S. farms that are Black-owned" },
        detail: "USDA (2022) — down from ~14% in 1910.",
      },
      {
        slug: "septic-failing",
        static: "40–90%",
        label: { pre: "Black Belt homes with failing/no septic systems" },
        detail:
          "Estimated across Lowndes County, AL and the rural Black Belt — impermeable soil & infrastructure neglect.",
      },
    ],
  },
  {
    key: "justice",
    title: "Criminal Legal System",
    rows: [
      {
        slug: "arrests-year",
        baselineValue: 0,
        baselineTimestamp: START_OF_YEAR,
        annualRate: 1990000,
        label: { pre: "Arrests of Black Americans", link: "this year" },
        detail: "Projected from FBI UCR — nearly 1.99 million arrests annually.",
      },
      {
        slug: "arrests-today",
        baselineValue: 0,
        baselineTimestamp: START_OF_TODAY,
        annualRate: 1990000,
        label: { pre: "Arrests of Black Americans", link: "today" },
      },
      {
        slug: "incarcerated",
        static: "735,000",
        label: { pre: "Black Americans currently incarcerated" },
        detail: "BJS (2024) — state prisons, local jails & federal facilities combined.",
      },
      {
        slug: "incarc-share",
        static: "37%",
        label: { pre: "Black share of those incarcerated (state/local)" },
        detail: "BJS (2024) — while Black Americans are ~13.5% of the U.S. population.",
      },
      {
        slug: "pop-share",
        static: "13.5%",
        label: { pre: "Black share of total U.S. population" },
        detail: "U.S. Census Bureau.",
      },
      {
        slug: "arrest-rate",
        static: "4,223",
        label: { pre: "Arrest rate per 100,000 Black Americans" },
        detail: "FBI UCR — vs 2,092 per 100,000 White Americans.",
      },
    ],
  },
  {
    key: "news-outlets",
    title: "News Outlets",
    rows: [
      { slug: "wabc-ny", static: "", label: { pre: "WABC-TV (New York)" }, detail: "New York local news channel covering the Tri-State area." },
      { slug: "ktla-ca", static: "", label: { pre: "KTLA (California)" }, detail: "Los Angeles local news station covering Southern California." },
      { slug: "wfaa-tx", static: "", label: { pre: "WFAA (Texas)" }, detail: "Dallas-Fort Worth local news station covering North Texas." },
      { slug: "wsb-ga", static: "", label: { pre: "WSB-TV (Georgia)" }, detail: "Atlanta local news channel covering North Georgia." },
      { slug: "wgn-il", static: "", label: { pre: "WGN-TV (Illinois)" }, detail: "Chicago local news station covering Illinois and Chicagoland." },
      { slug: "wpvi-pa", static: "", label: { pre: "WPVI (Pennsylvania)" }, detail: "Philadelphia local news station covering the Delaware Valley." },
      { slug: "wxyz-mi", static: "", label: { pre: "WXYZ (Michigan)" }, detail: "Detroit local news channel covering Southeast Michigan." },
      { slug: "wral-nc", static: "", label: { pre: "WRAL (North Carolina)" }, detail: "Raleigh local news station covering Eastern North Carolina." },
      { slug: "wplg-fl", static: "", label: { pre: "WPLG (Florida)" }, detail: "Miami local news channel covering South Florida." },
      { slug: "wews-oh", static: "", label: { pre: "WEWS (Ohio)" }, detail: "Cleveland local news channel covering Northeast Ohio." },
      { slug: "king-wa", static: "", label: { pre: "KING 5 (Washington)" }, detail: "Seattle local news station covering Western Washington." },
      { slug: "wcvb-ma", static: "", label: { pre: "WCVB (Massachusetts)" }, detail: "Boston local news channel covering Eastern Massachusetts." },
      { slug: "kpnx-az", static: "", label: { pre: "KPNX (Arizona)" }, detail: "Phoenix local news channel covering Arizona." },
      { slug: "wthr-in", static: "", label: { pre: "WTHR (Indiana)" }, detail: "Indianapolis local news channel covering Central Indiana." },
      { slug: "wmc-tn", static: "", label: { pre: "WMC-TV (Tennessee)" }, detail: "Memphis local news channel covering West Tennessee and Mid-South." },
      { slug: "ksdk-mo", static: "", label: { pre: "KSDK (Missouri)" }, detail: "St. Louis local news station covering Eastern Missouri and Illinois." },
      { slug: "wbal-md", static: "", label: { pre: "WBAL-TV (Maryland)" }, detail: "Baltimore local news channel covering Maryland." },
      { slug: "kusa-co", static: "", label: { pre: "KUSA (Colorado)" }, detail: "Denver local news channel covering Colorado." },
      { slug: "wcco-mn", static: "", label: { pre: "WCCO (Minnesota)" }, detail: "Minneapolis local news channel covering Minnesota." },
      { slug: "wtmj-wi", static: "", label: { pre: "WTMJ-TV (Wisconsin)" }, detail: "Milwaukee local news channel covering Southeast Wisconsin." },
      { slug: "wwl-la", static: "", label: { pre: "WWL-TV (Louisiana)" }, detail: "New Orleans local news channel covering Southeast Louisiana." },
      { slug: "wbrc-al", static: "", label: { pre: "WBRC (Alabama)" }, detail: "Birmingham local news channel covering Alabama." },
      { slug: "wavy-va", static: "", label: { pre: "WAVY-TV (Virginia)" }, detail: "Portsmouth-Norfolk local news channel covering Hampton Roads." },
      { slug: "wis-sc", static: "", label: { pre: "WIS-TV (South Carolina)" }, detail: "Columbia local news channel covering South Carolina." },
      { slug: "wlbt-ms", static: "", label: { pre: "WLBT (Mississippi)" }, detail: "Jackson local news channel covering Central Mississippi." },
    ],
  },
];

/* Breaking-style ticker — slower-moving secondary data points across the masthead */
export const TICKER_ITEMS = [
  "Black population reached 49.2M in 2024 — a 36% increase since 2000.",
  "Black-owned employer firms surged 56.9% between 2017 and 2022.",
  "Black businesses generated $249.0B in annual gross revenue in 2023.",
  "34.4M Black Americans are eligible voters — 14.0% of the electorate.",
  "Black maternal mortality: 44.8 per 100,000 — more than 3x the White rate.",
  "Only 28,723 Black-owned farms remain, on 4.7M acres.",
  "Black Americans: ~13.5% of the population, 37% of those incarcerated.",
  "Black consumer buying power is approaching $2 trillion a year.",
];
