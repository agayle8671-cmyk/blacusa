/*
  One-click theme presets for BlacUSA.
  Each preset maps directly to the CSS variables defined in index.css.
  Values are HSL triplets "H S% L%" (used as hsl(var(--token))).
  To add your own brand colors, copy a preset and edit the values.
  The active preset key is stored in localStorage("blacusa-theme").
*/

export const THEMES = {
  heritage: {
    label: "Heritage Crimson",
    description: "Linen, classic black, dignified crimson.",
    swatch: ["#FAF9F6", "#1A1A1A", "#8C271E"],
    tokens: {
      "--background": "48 20% 97%",
      "--foreground": "0 0% 7%",
      "--card": "0 0% 100%",
      "--card-foreground": "0 0% 7%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "0 0% 7%",
      "--primary": "0 0% 10%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "43 16% 90%",
      "--secondary-foreground": "0 0% 10%",
      "--muted": "43 21% 94%",
      "--muted-foreground": "0 0% 40%",
      "--accent": "5 65% 33%",
      "--accent-foreground": "0 0% 100%",
      "--destructive": "5 67% 28%",
      "--destructive-foreground": "0 0% 100%",
      "--border": "45 16% 84%",
      "--input": "45 16% 84%",
      "--ring": "5 65% 33%",
    },
  },
  liberation: {
    label: "Liberation Green",
    description: "Warm paper, ink, deep pan-African green.",
    swatch: ["#F7F5EF", "#161616", "#1F6B3B"],
    tokens: {
      "--background": "45 30% 95%",
      "--foreground": "0 0% 9%",
      "--card": "0 0% 100%",
      "--card-foreground": "0 0% 9%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "0 0% 9%",
      "--primary": "0 0% 9%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "44 20% 89%",
      "--secondary-foreground": "0 0% 9%",
      "--muted": "44 24% 93%",
      "--muted-foreground": "0 0% 38%",
      "--accent": "142 55% 27%",
      "--accent-foreground": "0 0% 100%",
      "--destructive": "5 67% 30%",
      "--destructive-foreground": "0 0% 100%",
      "--border": "44 18% 83%",
      "--input": "44 18% 83%",
      "--ring": "142 55% 27%",
    },
  },
  gold: {
    label: "Sovereign Gold",
    description: "Bone white, charcoal, burnished gold.",
    swatch: ["#FBFAF7", "#1C1B19", "#B8860B"],
    tokens: {
      "--background": "45 33% 98%",
      "--foreground": "40 6% 11%",
      "--card": "0 0% 100%",
      "--card-foreground": "40 6% 11%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "40 6% 11%",
      "--primary": "40 6% 11%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "44 20% 90%",
      "--secondary-foreground": "40 6% 11%",
      "--muted": "44 26% 94%",
      "--muted-foreground": "40 4% 40%",
      "--accent": "43 88% 38%",
      "--accent-foreground": "0 0% 100%",
      "--destructive": "5 67% 30%",
      "--destructive-foreground": "0 0% 100%",
      "--border": "44 18% 84%",
      "--input": "44 18% 84%",
      "--ring": "43 88% 38%",
    },
  },
  midnight: {
    label: "Midnight Archive",
    description: "Near-black canvas, bone text, ember accent.",
    swatch: ["#121110", "#F4F1EA", "#C2502E"],
    tokens: {
      "--background": "30 6% 7%",
      "--foreground": "44 30% 94%",
      "--card": "30 6% 10%",
      "--card-foreground": "44 30% 94%",
      "--popover": "30 6% 10%",
      "--popover-foreground": "44 30% 94%",
      "--primary": "44 30% 94%",
      "--primary-foreground": "30 6% 7%",
      "--secondary": "30 5% 16%",
      "--secondary-foreground": "44 30% 94%",
      "--muted": "30 5% 14%",
      "--muted-foreground": "40 8% 62%",
      "--accent": "15 62% 47%",
      "--accent-foreground": "0 0% 100%",
      "--destructive": "5 67% 45%",
      "--destructive-foreground": "0 0% 100%",
      "--border": "30 5% 20%",
      "--input": "30 5% 20%",
      "--ring": "15 62% 47%",
    },
  },
};

export const DEFAULT_THEME = "heritage";

export function applyTheme(key) {
  const theme = THEMES[key] || THEMES[DEFAULT_THEME];
  const root = document.documentElement;
  Object.entries(theme.tokens).forEach(([prop, val]) => {
    root.style.setProperty(prop, val);
  });
  try {
    localStorage.setItem("blacusa-theme", key);
  } catch (e) {}
}

export function getStoredTheme() {
  try {
    return localStorage.getItem("blacusa-theme") || DEFAULT_THEME;
  } catch (e) {
    return DEFAULT_THEME;
  }
}
