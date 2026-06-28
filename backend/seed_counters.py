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
]
