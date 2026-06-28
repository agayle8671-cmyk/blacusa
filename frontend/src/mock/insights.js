/*
  BlacUSA — "Disparity Spotlight" insight data (static reference content).
  Keyed by counter slug. Provides historical trends and side-by-side comparisons
  drawn from the strategic data matrix (Census, USDA, Federal Reserve, CDC, BJS, FBI).

  This is editorial/reference context that doesn't tick — kept on the frontend.
*/

const INSIGHTS = {
  "black-population": {
    title: "Black Population in the United States",
    summary:
      "The Black population reached 49.2M in 2024 — a 36% increase since 2000. After the lowest Census share in 1930 (during the Great Migration), the modern era has seen steady, accelerating growth concentrated in the South and Sunbelt suburbs.",
    history: {
      label: "Population, 1790–2024",
      unit: "people",
      data: [
        { name: "1790", value: 757208 },
        { name: "1860", value: 4441830 },
        { name: "1930", value: 11900000 },
        { name: "1970", value: 22600000 },
        { name: "2000", value: 36200000 },
        { name: "2024", value: 49200000 },
      ],
    },
    source: "U.S. Census Bureau",
  },

  "biz-revenue-year": {
    title: "Black-Owned Employer Business Revenue",
    summary:
      "Annual gross revenue from Black-owned employer firms nearly doubled in six years — up 94.6% from $127.9B (2017) to $249.0B (2023) — one of the fastest-growing segments of the U.S. economy.",
    history: {
      label: "Annual gross revenue",
      unit: "$",
      data: [
        { name: "2017", value: 127900000000 },
        { name: "2023", value: 249000000000 },
      ],
    },
    source: "U.S. Census Annual Business Survey",
  },

  "employer-firms": {
    title: "Black-Owned Employer Firms",
    summary:
      "Between 2017 and 2022 the number of Black-owned employer firms surged 56.9%, reaching 200,885 businesses employing 1.6 million people.",
    comparison: {
      label: "Number of employer firms",
      unit: "",
      rows: [
        { label: "2017", value: 124004, accent: false },
        { label: "2022", value: 200885, accent: true },
      ],
    },
    source: "U.S. Census Annual Business Survey",
  },

  "median-wealth-black": {
    title: "The Racial Wealth Gap",
    summary:
      "In 2022 the median White household held $284,310 in net worth — more than six times the $44,100 held by the median Black household. As a percentage, this gap is virtually unchanged since 1992.",
    comparison: {
      label: "Median household net worth",
      unit: "$",
      rows: [
        { label: "Black households", value: 44100, accent: true },
        { label: "White households", value: 284310, accent: false },
      ],
    },
    source: "Federal Reserve Survey of Consumer Finances (2022)",
  },

  "maternal-rate": {
    title: "Black Maternal Mortality",
    summary:
      "Black women die from pregnancy-related causes at more than three times the rate of White women. The disparity compounds with age — and reflects systemic bias in healthcare delivery, not individual risk.",
    comparison: {
      label: "Deaths per 100,000 live births",
      unit: "",
      rows: [
        { label: "Black women", value: 44.8, accent: true },
        { label: "White women", value: 14.2, accent: false },
        { label: "Hispanic women", value: 12.1, accent: false },
      ],
    },
    source: "CDC NCHS (2024)",
  },

  "life-expectancy": {
    title: "Life Expectancy Gap",
    summary:
      "Black Americans have a life expectancy of 74.0 years versus 78.4 for White Americans — a persistent 4.4-year deficit that reflects the aggregate weight of systemic health and environmental inequities.",
    comparison: {
      label: "Life expectancy at birth (years)",
      unit: "",
      rows: [
        { label: "Black Americans", value: 74.0, accent: true },
        { label: "White Americans", value: 78.4, accent: false },
      ],
    },
    source: "CDC NCHS (2023)",
  },

  "black-farms": {
    title: "A Century of Black Land Loss",
    summary:
      "Black farmers owned 16M+ acres across 218,000+ farms in 1910. Heirs'-property exploitation, denied loans, and predatory partition sales drove a near-total collapse — to just 28,723 farms on 4.7M acres by 2022. Estimated lost value: $326 billion.",
    history: {
      label: "Number of Black-owned farms",
      unit: "farms",
      data: [
        { name: "1910", value: 218000 },
        { name: "1950", value: 190000 },
        { name: "1997", value: 18000 },
        { name: "2022", value: 28723 },
      ],
    },
    source: "USDA Census of Agriculture",
  },

  "incarc-share": {
    title: "Mass Incarceration & Disproportionality",
    summary:
      "Black Americans are roughly 13.5% of the U.S. population but 37% of those held in state prisons and local jails — a stark measure of disproportionate policing and sentencing.",
    comparison: {
      label: "Share of total (%)",
      unit: "%",
      rows: [
        { label: "% of U.S. population", value: 13.5, accent: false },
        { label: "% of those incarcerated", value: 37, accent: true },
      ],
    },
    source: "Bureau of Justice Statistics (2024)",
  },

  "arrest-rate": {
    title: "Arrest Rate Disparity",
    summary:
      "The arrest rate for Black Americans is 4,223 per 100,000 — more than double the 2,092 per 100,000 rate for White Americans — fueling the pipeline into the carceral system.",
    comparison: {
      label: "Arrests per 100,000 people",
      unit: "",
      rows: [
        { label: "Black Americans", value: 4223, accent: true },
        { label: "White Americans", value: 2092, accent: false },
      ],
    },
    source: "FBI Uniform Crime Reporting",
  },

  "births-year": {
    title: "Births, Deaths & Natural Increase",
    summary:
      "Roughly 620,000 Black children are born each year while about 445,000 Black Americans die — a natural increase of ~175,000 annually, before migration and re-identification are counted. This steady momentum drives the community's demographic growth.",
    comparison: {
      label: "Projected annual totals",
      unit: "",
      rows: [
        { label: "Births / year", value: 620000, accent: true },
        { label: "Deaths / year", value: 445000, accent: false },
        { label: "Natural increase", value: 175000, accent: false },
      ],
    },
    source: "Projected from CDC NCHS natality & mortality baselines",
  },

  "eligible-voters": {
    title: "The Black Electorate",
    summary:
      "An estimated 34.4 million Black Americans are eligible voters in 2024 — 14.0% of the U.S. electorate, slightly exceeding the Black share of the total population. A growing, increasingly Southern electorate translates demographic momentum into civic power.",
    comparison: {
      label: "Share of the United States",
      unit: "%",
      rows: [
        { label: "% of U.S. population", value: 13.5, accent: false },
        { label: "% of U.S. electorate", value: 14.0, accent: true },
      ],
    },
    source: "Pew Research Center / U.S. Census Bureau (2024)",
  },

  "asthma-er-year": {
    title: "Pediatric Asthma & Environmental Racism",
    summary:
      "Non-Hispanic Black children are roughly twice as likely to have asthma as White children, almost five times more likely to be hospitalized for it, and suffer a mortality rate nearly eight times higher — a direct consequence of housing quality, localized pollution, and unequal care.",
    comparison: {
      label: "Risk relative to White children (\u00d7)",
      unit: "x",
      rows: [
        { label: "More likely to have asthma", value: 2, accent: false },
        { label: "More likely hospitalized", value: 5, accent: false },
        { label: "Higher asthma mortality", value: 8, accent: true },
      ],
    },
    source: "CDC / HHS Office of Minority Health",
  },

  "septic-failing": {
    title: "The Black Belt Sanitation Crisis",
    summary:
      "Across Lowndes County, Alabama and the rural Black Belt, impermeable clay soil makes conventional septic systems fail. Health departments estimate that between 40% and 90% of homes rely on failing or straight-piped systems — exposing residents to raw sewage and preventable disease entirely within the United States.",
    source: "Catherine Coleman Flowers testimony; public-health estimates",
  },

  "newsroom-diversity": {
    title: "Newsroom Leadership vs. National Demographics",
    summary:
      "While these publications and networks reach hundreds of millions of Americans daily, their leadership and reporting ranks remain overwhelmingly homogenous. White journalists hold 83.7% of supervisor roles and 78% of top leadership positions in North American newsrooms. Meanwhile, only 6% of reporting journalists are Black, contributing directly to coverage blind spots.",
    comparison: {
      label: "Share of positions held (%)",
      unit: "%",
      rows: [
        { label: "White Supervisors", value: 83.7, accent: false },
        { label: "Black Journalists", value: 6.0, accent: true },
        { label: "Black Population", value: 13.6, accent: false },
      ]
    },
    source: "CAJ Diversity Survey / Pew Research (2022-2024)"
  },

  "media-distrust": {
    title: "The Crisis of Trust and Coverage Bias",
    summary:
      "Television news dominates Black American media consumption, yet 88% of Black adults report encountering inaccurate news about their communities, with 73% believing those inaccuracies are intentional. Furthermore, 63% feel that news coverage of Black people is disproportionately negative compared to other racial groups.",
    comparison: {
      label: "Perceptions of Media Coverage",
      unit: "%",
      rows: [
        { label: "Encounter inaccurate news", value: 88, accent: true },
        { label: "Believe inaccuracies are intentional", value: 73, accent: true },
        { label: "Coverage is disproportionately negative", value: 63, accent: true },
        { label: "Media designed to hold Black people back", value: 52, accent: true },
      ]
    },
    source: "Pew Research Center / Center for Media Engagement (2023-2024)"
  },
};


/* Alias related ticking rows to a shared insight. */
const ALIASES = {
  "buying-power-year": "biz-revenue-year",
  "biz-revenue-today": "biz-revenue-year",
  "biz-employees": "employer-firms",
  "median-wealth-white": "median-wealth-black",
  "maternal-deaths-year": "maternal-rate",
  "life-gap": "life-expectancy",
  "farmland-acres": "black-farms",
  "lost-land-value": "black-farms",
  "farm-share": "black-farms",
  "arrests-year": "arrest-rate",
  "arrests-today": "arrest-rate",
  "incarcerated": "incarc-share",
  "pop-share": "incarc-share",
  // population dynamics share one insight
  "births-today": "births-year",
  "deaths-year": "births-year",
  "deaths-today": "births-year",
  "net-growth-year": "births-year",
  "net-growth-today": "births-year",
  // asthma year/today share one insight
  "asthma-er-today": "asthma-er-year",

  // newsroom diversity mappings
  "wapo-subs": "newsroom-diversity",
  "nyt-subs": "newsroom-diversity",
  "wsj-subs": "newsroom-diversity",
  "abc-evening-news": "newsroom-diversity",
  "nbc-nightly-news": "newsroom-diversity",
  "cbs-evening-news": "newsroom-diversity",
  "usa-today-visits": "newsroom-diversity",
  "ny-post-visits": "newsroom-diversity",
  "huffpost-visits": "newsroom-diversity",
  "bloomberg-visits": "newsroom-diversity",
  "cnbc-visits": "newsroom-diversity",
  "newsweek-visits": "newsroom-diversity",
  "univision-viewers": "newsroom-diversity",
  "telemundo-viewers": "newsroom-diversity",
  "bbc-news-visits": "newsroom-diversity",
  "guardian-us-visits": "newsroom-diversity",
  "reuters-visits": "newsroom-diversity",
  "ap-visits": "newsroom-diversity",

  // media distrust mappings
  "fox-news-prime": "media-distrust",
  "cnn-visits-today": "media-distrust",
  "msnbc-prime": "media-distrust",
  "yahoo-news-visits": "media-distrust",
  "msn-news-visits": "media-distrust",
  "pbs-trust": "media-distrust",
  "npr-listeners": "media-distrust",
};


export const getInsight = (slug) => {
  if (!slug) return null;
  const key = ALIASES[slug] || slug;
  return INSIGHTS[key] || null;
};

export const hasInsight = (slug) => Boolean(getInsight(slug));
