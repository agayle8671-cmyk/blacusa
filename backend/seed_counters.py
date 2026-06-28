"""
BlacUSA counter seed data (the strategic data matrix).
Seeded into Mongo `live_counters` + `counter_meta` on startup when empty.

baseline_kind:
  - "fixed"      -> use baseline_timestamp + baseline_value
  - "year_start" -> Jan 1 current year, value 0 (resets annually)
  - "day_start"  -> midnight today, value 0 (resets daily)
value_type: "live" | "static"
"""

BASELINE_2024 = "2024-07-01T00:00:00"

SECTION_META = [
    ("demographics", "Demographics & Population"),
    ("economics", "Economic Equity & Wealth"),
    ("health", "Public Health & Equity"),
    ("environment", "Environmental Justice"),
    ("justice", "Criminal Legal System"),
    ("news-outlets", "News Outlets"),
]


HERO = {
    "slug": "black-population",
    "caption": "Current Black Population (U.S.)",
    "baseline_value": 49200000,
    "baseline_kind": "fixed",
    "baseline_timestamp": BASELINE_2024,
    "annual_rate": 540000,
    "source": "U.S. Census Bureau \u2014 49.2M in 2024, a 36% increase since 2000.",
}

TICKER_ITEMS = [
    "Black population reached 49.2M in 2024 \u2014 a 36% increase since 2000.",
    "Black-owned employer firms surged 56.9% between 2017 and 2022.",
    "Black businesses generated $249.0B in annual gross revenue in 2023.",
    "34.4M Black Americans are eligible voters \u2014 14.0% of the electorate.",
    "Black maternal mortality: 44.8 per 100,000 \u2014 more than 3x the White rate.",
    "Only 28,723 Black-owned farms remain, on 4.7M acres.",
    "Black Americans: ~13.5% of the population, 37% of those incarcerated.",
    "Black consumer buying power is approaching $2 trillion a year.",
]


def _live(slug, category, order, pre, value, kind, rate, **kw):
    return {
        "metric_slug": slug,
        "category": category,
        "order": order,
        "value_type": "live",
        "baseline_kind": kind,
        "baseline_value": value,
        "baseline_timestamp": kw.get("ts", BASELINE_2024),
        "annual_rate": rate,
        "prefix": kw.get("prefix", ""),
        "suffix": kw.get("suffix", ""),
        "decimals": kw.get("decimals", 0),
        "static_value": None,
        "label_pre": pre,
        "label_link": kw.get("link"),
        "label_post": kw.get("post"),
        "detail": kw.get("detail"),
        "source": kw.get("source"),
        "data_as_of": kw.get("as_of"),
    }


def _static(slug, category, order, pre, static_value, **kw):
    return {
        "metric_slug": slug,
        "category": category,
        "order": order,
        "value_type": "static",
        "baseline_kind": "fixed",
        "baseline_value": None,
        "baseline_timestamp": None,
        "annual_rate": None,
        "prefix": "",
        "suffix": "",
        "decimals": 0,
        "static_value": static_value,
        "label_pre": pre,
        "label_link": kw.get("link"),
        "label_post": kw.get("post"),
        "detail": kw.get("detail"),
        "source": kw.get("source"),
        "data_as_of": kw.get("as_of"),
    }


COUNTERS = [
    # ---------------- Demographics ----------------
    _live("black-population", "demographics", 1, "Current Black Population (U.S.)",
          49200000, "fixed", 540000,
          detail="U.S. Census Bureau. 49.2M in 2024 \u2014 Black alone, multiracial Black, and Black Hispanic. Up 36% since 2000."),
    _live("births-year", "demographics", 2, "Black births", 0, "year_start", 620000,
          link="this year", detail="Projected from CDC NCHS natality baselines."),
    _live("births-today", "demographics", 3, "Black births", 0, "day_start", 620000,
          link="today", detail="Projected from CDC NCHS natality baselines."),
    _live("deaths-year", "demographics", 4, "Black deaths", 0, "year_start", 445000,
          link="this year", detail="Projected from CDC NCHS mortality baselines."),
    _live("deaths-today", "demographics", 5, "Black deaths", 0, "day_start", 445000,
          link="today", detail="Projected from CDC NCHS mortality baselines."),
    _live("net-growth-year", "demographics", 6, "Net population growth", 0, "year_start", 175000,
          link="this year", detail="Births minus deaths (excludes migration & re-identification)."),
    _live("net-growth-today", "demographics", 7, "Net population growth", 0, "day_start", 175000,
          link="today"),
    _live("eligible-voters", "demographics", 8, "Black eligible voters", 34400000, "fixed", 410000,
          detail="Pew Research / Census \u2014 34.4M in 2024, 14.0% of the total U.S. electorate."),

    # ---------------- Economics ----------------
    _live("buying-power-year", "economics", 1, "Black consumer buying power", 0, "year_start",
          1980000000000, prefix="$", link="this year",
          detail="Selig Center for Economic Growth \u2014 ~$1.98 trillion (2024)."),
    _live("biz-revenue-year", "economics", 2, "Revenue by Black employer firms", 0, "year_start",
          249000000000, prefix="$", link="this year",
          detail="U.S. Census ABS \u2014 $249.0B in 2023, up 94.6% from $127.9B in 2017 (~$7,895/sec)."),
    _live("biz-revenue-today", "economics", 3, "Revenue by Black employer firms", 0, "day_start",
          249000000000, prefix="$", link="today"),
    _live("employer-firms", "economics", 4, "Black-owned employer firms", 200885, "fixed", 22000,
          detail="U.S. Census ABS \u2014 200,885 in 2022, up 56.9% since 2017."),
    _live("biz-employees", "economics", 5, "People employed by Black-owned firms", 1600000, "fixed", 75000,
          detail="U.S. Census ABS \u2014 1.6M employees in 2022, up 39.1% since 2017."),
    _static("median-wealth-black", "economics", 6, "Median Black household net worth", "$44,100",
            detail="Federal Reserve SCF (2022). White median is $284,310 \u2014 a ~6x gap unchanged since 1992."),
    _static("median-wealth-white", "economics", 7, "Median White household net worth (for contrast)", "$284,310",
            detail="Federal Reserve Survey of Consumer Finances (2022)."),

    # ---------------- Health ----------------
    _live("asthma-er-year", "health", 1, "Pediatric asthma ER visits (Black children)", 0, "year_start", 165000,
          link="this year",
          detail="Projected from CDC. Black children are nearly 5x more likely to be hospitalized for asthma."),
    _live("asthma-er-today", "health", 2, "Pediatric asthma ER visits (Black children)", 0, "day_start", 165000,
          link="today"),
    _live("maternal-deaths-year", "health", 3, "Black maternal deaths", 0, "year_start", 278,
          link="this year",
          detail="CDC NCHS (2024) \u2014 44.8 per 100,000 live births, more than 3x the White rate (14.2)."),
    _static("maternal-rate", "health", 4, "Black maternal mortality (per 100,000 births)", "44.8",
            detail="CDC NCHS (2024). White: 14.2 \u00b7 Hispanic: 12.1."),
    _static("life-expectancy", "health", 5, "Black life expectancy at birth (years)", "74.0",
            detail="CDC NCHS (2023). White Americans: 78.4 years."),
    _static("life-gap", "health", 6, "Life-expectancy deficit vs White Americans (years)", "4.4",
            detail="The aggregate 'Lost Years' of systemic health disparity."),

    # ---------------- Environment ----------------
    _live("black-farms", "environment", 1, "Black-owned farms remaining", 28723, "fixed", -800,
          detail="USDA Census of Agriculture (2022) \u2014 down from 218,000+ in 1910. Heirs' property land loss."),
    _live("farmland-acres", "environment", 2, "Black-owned farmland remaining (acres)", 4700000, "fixed", -30000,
          detail="USDA (2022) \u2014 down from 16M+ acres in 1910."),
    _static("lost-land-value", "environment", 3, "Estimated value of lost Black farmland", "$326B",
            detail="Union of Concerned Scientists \u2014 compounded lost generational wealth, yields & appreciation."),
    _static("farm-share", "environment", 4, "Share of U.S. farms that are Black-owned", "1.5%",
            detail="USDA (2022) \u2014 down from ~14% in 1910."),
    _static("septic-failing", "environment", 5, "Black Belt homes with failing/no septic systems", "40\u201390%",
            detail="Estimated across Lowndes County, AL and the rural Black Belt \u2014 impermeable soil & infrastructure neglect."),

    # ---------------- Justice ----------------
    _live("arrests-year", "justice", 1, "Arrests of Black Americans", 0, "year_start", 1990000,
          link="this year", detail="Projected from FBI UCR \u2014 nearly 1.99 million arrests annually."),
    _live("arrests-today", "justice", 2, "Arrests of Black Americans", 0, "day_start", 1990000,
          link="today"),
    _static("incarcerated", "justice", 3, "Black Americans currently incarcerated", "735,000",
            detail="BJS (2024) \u2014 state prisons, local jails & federal facilities combined."),
    _static("incarc-share", "justice", 4, "Black share of those incarcerated (state/local)", "37%",
            detail="BJS (2024) \u2014 while Black Americans are ~13.5% of the U.S. population."),
    _static("pop-share", "justice", 5, "Black share of total U.S. population", "13.5%",
            detail="U.S. Census Bureau."),
    _static("arrest-rate", "justice", 6, "Arrest rate per 100,000 Black Americans", "4,223",
            detail="FBI UCR \u2014 vs 2,092 per 100,000 White Americans."),

    # ---------------- News Outlets ----------------
    _static("nyt-subs", "news-outlets", 1, "The New York Times", "12.8M", post="digital subscribers",
            detail="The industry leader in digital subscriptions, generating over $2B in digital revenue. Its newsroom, however, lags behind national demographics in diversity.", source="Alliance for Audited Media"),
    _static("fox-news-prime", "news-outlets", 2, "Fox News Channel", "2.9M", post="prime-time viewers",
            detail="Highest rated cable news network in the U.S., though scoring the lowest in net trust (-10) among major outlets.", source="Nielsen / YouGov"),
    _live("cnn-visits-today", "news-outlets", 3, "CNN", 0, "day_start", 2727600000, link="site visits today",
          detail="Averages 227.3M monthly digital visits. CNN pioneered the 24-hour news cycle but has seen systemic declines in linear TV viewership.", source="Press Gazette / Nielsen"),
    _static("msnbc-prime", "news-outlets", 4, "MSNBC", "940k", post="prime-time viewers",
            detail="MSNBC averages between 800k and 1.08M weekday prime-time viewers, commanding a loyal progressive audience but facing post-election rating drops.", source="Nielsen"),
    _static("abc-evening-news", "news-outlets", 5, "ABC News", "8.1M", post="evening news viewers",
            detail="ABC World News Tonight consistently leads broadcast evening news viewership, drawing over 8M viewers daily.", source="Nielsen"),
    _static("nbc-nightly-news", "news-outlets", 6, "NBC News", "8.3M", post="nightly news viewers",
            detail="NBC Nightly News competes closely for the top spot in evening broadcast news, averaging over 8.3M viewers.", source="Nielsen"),
    _static("cbs-evening-news", "news-outlets", 7, "CBS News", "4.8M", post="evening news viewers",
            detail="CBS Evening News maintains a solid national reach of 4.8M viewers, though trailing ABC and NBC in ratings.", source="Nielsen"),
    _static("wsj-subs", "news-outlets", 8, "The Wall Street Journal", "4.29M", post="digital subscribers",
            detail="A primary financial and business news publication, maintaining a rigid paywall and achieving 30% digital growth in recent years.", source="Alliance for Audited Media"),
    _static("wapo-subs", "news-outlets", 9, "The Washington Post", "2.5M", post="digital subscribers",
            detail="Significant print declines have pushed the publication toward a predominantly digital subscriber base.", source="Alliance for Audited Media"),
    _live("usa-today-visits", "news-outlets", 10, "USA Today", 0, "day_start", 1716000000, link="site visits today",
          detail="USA Today operates a broad, free digital portal alongside a large national print edition.", source="Press Gazette"),
    _live("yahoo-news-visits", "news-outlets", 11, "Yahoo News", 0, "day_start", 778800000, link="site visits today",
          detail="A major digital aggregator that serves as a primary source of news for tens of millions of portal visitors daily.", source="Press Gazette"),
    _live("msn-news-visits", "news-outlets", 12, "MSN News", 0, "day_start", 3720000000, link="site visits today",
          detail="MSN's default browser integration commands a massive global and domestic audience, heavily driven by syndication.", source="Press Gazette"),
    _static("pbs-trust", "news-outlets", 13, "PBS NewsHour", "+26", post="net trust score",
            detail="The second most trusted news source in America, highly valued for impartial, public-service journalism.", source="YouGov"),
    _static("npr-listeners", "news-outlets", 14, "NPR", "51.5M", post="weekly listeners",
            detail="National Public Radio commands a massive weekly audience across terrestrial broadcast and digital podcasts, retaining a +15 net trust score.", source="YouGov / NPR"),
    _static("univision-viewers", "news-outlets", 15, "Univision", "33.7M", post="monthly reach",
            detail="The dominant Spanish-language broadcast network in the U.S., holding massive sway among Latino and Afro-Latino audiences.", source="TelevisaUnivision"),
    _static("telemundo-viewers", "news-outlets", 16, "Telemundo", "548k", post="afternoon viewers",
            detail="Telemundo delivers strong competition in Spanish broadcast, alongside a massive digital video presence generating billions of annual views.", source="HispanicAd"),
    _live("bbc-news-visits", "news-outlets", 17, "BBC News (US)", 0, "day_start", 1107600000, link="site visits today",
          detail="BBC News attracts over 92.3M monthly visits from U.S. readers, carrying a high net trust score (+20) nationally.", source="Press Gazette"),
    _live("guardian-us-visits", "news-outlets", 18, "The Guardian (US)", 0, "day_start", 788400000, link="site visits today",
          detail="The Guardian's U.S. edition drives an estimated 65.7M monthly visits, offering progressive, reader-supported journalism.", source="Press Gazette"),
    _live("reuters-visits", "news-outlets", 19, "Reuters", 0, "day_start", 824400000, link="site visits today",
          detail="One of the world's largest news wire services, providing the raw reporting backbone for major global media.", source="Press Gazette"),
    _live("ap-visits", "news-outlets", 20, "Associated Press", 0, "day_start", 984000000, link="site visits today",
          detail="The Associated Press wire service is the primary source of local and national news copy across thousands of U.S. news outlets.", source="Press Gazette"),
    _live("ny-post-visits", "news-outlets", 21, "New York Post", 0, "day_start", 1290000000, link="site visits today",
          detail="A prominent legacy tabloid-formatted publisher generating over 100M monthly digital visits.", source="Press Gazette"),
    _live("huffpost-visits", "news-outlets", 22, "HuffPost", 0, "day_start", 493800000, link="site visits today",
          detail="A pioneer in digital-native progressive reporting and social-media distribution optimization.", source="Press Gazette"),
    _live("bloomberg-visits", "news-outlets", 23, "Bloomberg", 0, "day_start", 720000000, link="site visits today",
          detail="A dominant global provider of business and financial news, data, and analytics.", source="Press Gazette"),
    _live("cnbc-visits", "news-outlets", 24, "CNBC", 0, "day_start", 912000000, link="site visits today",
          detail="CNBC leads in cable business news, generating large-scale digital traffic focused on personal finance and markets.", source="Press Gazette"),
    _live("newsweek-visits", "news-outlets", 25, "Newsweek", 0, "day_start", 618000000, link="site visits today",
          detail="Newsweek has transitioned to a digital-first model, heavily leveraging SEO and aggregation strategies.", source="Press Gazette"),
]

