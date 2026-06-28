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
  "arrests-year": "arrest-rate",
  "arrests-today": "arrest-rate",
  "incarcerated": "incarc-share",
};

export const getInsight = (slug) => {
  if (!slug) return null;
  const key = ALIASES[slug] || slug;
  return INSIGHTS[key] || null;
};

export const hasInsight = (slug) => Boolean(getInsight(slug));
