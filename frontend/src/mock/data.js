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
      {
        slug: "nyt-subs",
        static: "12.8M",
        label: { pre: "The New York Times", post: "digital subscribers" },
        detail: "The industry leader in digital subscriptions, generating over $2B in digital revenue. Its newsroom, however, lags behind national demographics in diversity.",
        source: "Alliance for Audited Media",
      },
      {
        slug: "fox-news-prime",
        static: "2.9M",
        label: { pre: "Fox News Channel", post: "prime-time viewers" },
        detail: "Highest rated cable news network in the U.S., though scoring the lowest in net trust (-10) among major outlets.",
        source: "Nielsen / YouGov",
      },
      {
        slug: "cnn-visits-today",
        baselineValue: 0,
        baselineTimestamp: START_OF_TODAY,
        annualRate: 2727600000,
        label: { pre: "CNN", link: "site visits today" },
        detail: "Averages 227.3M monthly digital visits. CNN pioneered the 24-hour news cycle but has seen systemic declines in linear TV viewership.",
        source: "Press Gazette / Nielsen",
      },
      {
        slug: "msnbc-prime",
        static: "940k",
        label: { pre: "MSNBC", post: "prime-time viewers" },
        detail: "MSNBC averages between 800k and 1.08M weekday prime-time viewers, commanding a loyal progressive audience but facing post-election rating drops.",
        source: "Nielsen",
      },
      {
        slug: "abc-evening-news",
        static: "8.1M",
        label: { pre: "ABC News", post: "evening news viewers" },
        detail: "ABC World News Tonight consistently leads broadcast evening news viewership, drawing over 8M viewers daily.",
        source: "Nielsen",
      },
      {
        slug: "nbc-nightly-news",
        static: "8.3M",
        label: { pre: "NBC News", post: "nightly news viewers" },
        detail: "NBC Nightly News competes closely for the top spot in evening broadcast news, averaging over 8.3M viewers.",
        source: "Nielsen",
      },
      {
        slug: "cbs-evening-news",
        static: "4.8M",
        label: { pre: "CBS News", post: "evening news viewers" },
        detail: "CBS Evening News maintains a solid national reach of 4.8M viewers, though trailing ABC and NBC in ratings.",
        source: "Nielsen",
      },
      {
        slug: "wsj-subs",
        static: "4.29M",
        label: { pre: "The Wall Street Journal", post: "digital subscribers" },
        detail: "A primary financial and business news publication, maintaining a rigid paywall and achieving 30% digital growth in recent years.",
        source: "Alliance for Audited Media",
      },
      {
        slug: "wapo-subs",
        static: "2.5M",
        label: { pre: "The Washington Post", post: "digital subscribers" },
        detail: "Significant print declines have pushed the publication toward a predominantly digital subscriber base.",
        source: "Alliance for Audited Media",
      },
      {
        slug: "usa-today-visits",
        baselineValue: 0,
        baselineTimestamp: START_OF_TODAY,
        annualRate: 1716000000,
        label: { pre: "USA Today", link: "site visits today" },
        detail: "USA Today operates a broad, free digital portal alongside a large national print edition.",
        source: "Press Gazette",
      },
      {
        slug: "yahoo-news-visits",
        baselineValue: 0,
        baselineTimestamp: START_OF_TODAY,
        annualRate: 778800000,
        label: { pre: "Yahoo News", link: "site visits today" },
        detail: "A major digital aggregator that serves as a primary source of news for tens of millions of portal visitors daily.",
        source: "Press Gazette",
      },
      {
        slug: "msn-news-visits",
        baselineValue: 0,
        baselineTimestamp: START_OF_TODAY,
        annualRate: 3720000000,
        label: { pre: "MSN News", link: "site visits today" },
        detail: "MSN's default browser integration commands a massive global and domestic audience, heavily driven by syndication.",
        source: "Press Gazette",
      },
      {
        slug: "pbs-trust",
        static: "+26",
        label: { pre: "PBS NewsHour", post: "net trust score" },
        detail: "The second most trusted news source in America, highly valued for impartial, public-service journalism.",
        source: "YouGov",
      },
      {
        slug: "npr-listeners",
        static: "51.5M",
        label: { pre: "NPR", post: "weekly listeners" },
        detail: "National Public Radio commands a massive weekly audience across terrestrial broadcast and digital podcasts, retaining a +15 net trust score.",
        source: "YouGov / NPR",
      },
      {
        slug: "univision-viewers",
        static: "33.7M",
        label: { pre: "Univision", post: "monthly reach" },
        detail: "The dominant Spanish-language broadcast network in the U.S., holding massive sway among Latino and Afro-Latino audiences.",
        source: "TelevisaUnivision",
      },
      {
        slug: "telemundo-viewers",
        static: "548k",
        label: { pre: "Telemundo", post: "afternoon viewers" },
        detail: "Telemundo delivers strong competition in Spanish broadcast, alongside a massive digital video presence generating billions of annual views.",
        source: "HispanicAd",
      },
      {
        slug: "bbc-news-visits",
        baselineValue: 0,
        baselineTimestamp: START_OF_TODAY,
        annualRate: 1107600000,
        label: { pre: "BBC News (US)", link: "site visits today" },
        detail: "BBC News attracts over 92.3M monthly visits from U.S. readers, carrying a high net trust score (+20) nationally.",
        source: "Press Gazette",
      },
      {
        slug: "guardian-us-visits",
        baselineValue: 0,
        baselineTimestamp: START_OF_TODAY,
        annualRate: 788400000,
        label: { pre: "The Guardian (US)", link: "site visits today" },
        detail: "The Guardian's U.S. edition drives an estimated 65.7M monthly visits, offering progressive, reader-supported journalism.",
        source: "Press Gazette",
      },
      {
        slug: "reuters-visits",
        baselineValue: 0,
        baselineTimestamp: START_OF_TODAY,
        annualRate: 824400000,
        label: { pre: "Reuters", link: "site visits today" },
        detail: "One of the world's largest news wire services, providing the raw reporting backbone for major global media.",
        source: "Press Gazette",
      },
      {
        slug: "ap-visits",
        baselineValue: 0,
        baselineTimestamp: START_OF_TODAY,
        annualRate: 984000000,
        label: { pre: "Associated Press", link: "site visits today" },
        detail: "The Associated Press wire service is the primary source of local and national news copy across thousands of U.S. news outlets.",
        source: "Press Gazette",
      },
      {
        slug: "ny-post-visits",
        baselineValue: 0,
        baselineTimestamp: START_OF_TODAY,
        annualRate: 1290000000,
        label: { pre: "New York Post", link: "site visits today" },
        detail: "A prominent legacy tabloid-formatted publisher generating over 100M monthly digital visits.",
        source: "Press Gazette",
      },
      {
        slug: "huffpost-visits",
        baselineValue: 0,
        baselineTimestamp: START_OF_TODAY,
        annualRate: 493800000,
        label: { pre: "HuffPost", link: "site visits today" },
        detail: "A pioneer in digital-native progressive reporting and social-media distribution optimization.",
        source: "Press Gazette",
      },
      {
        slug: "bloomberg-visits",
        baselineValue: 0,
        baselineTimestamp: START_OF_TODAY,
        annualRate: 720000000,
        label: { pre: "Bloomberg", link: "site visits today" },
        detail: "A dominant global provider of business and financial news, data, and analytics.",
        source: "Press Gazette",
      },
      {
        slug: "cnbc-visits",
        baselineValue: 0,
        baselineTimestamp: START_OF_TODAY,
        annualRate: 912000000,
        label: { pre: "CNBC", link: "site visits today" },
        detail: "CNBC leads in cable business news, generating large-scale digital traffic focused on personal finance and markets.",
        source: "Press Gazette",
      },
      {
        slug: "newsweek-visits",
        baselineValue: 0,
        baselineTimestamp: START_OF_TODAY,
        annualRate: 618000000,
        label: { pre: "Newsweek", link: "site visits today" },
        detail: "Newsweek has transitioned to a digital-first model, heavily leveraging SEO and aggregation strategies.",
        source: "Press Gazette",
      },
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
