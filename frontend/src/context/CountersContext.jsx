import React, { createContext, useContext, useEffect, useState } from "react";
import { getCounters } from "@/lib/api";
import { HERO as MOCK_HERO, SECTIONS as MOCK_SECTIONS, TICKER_ITEMS as MOCK_TICKER } from "@/mock/data";

const MOCK = {
  hero: {
    slug: MOCK_HERO.slug,
    caption: MOCK_HERO.caption,
    baselineValue: MOCK_HERO.baselineValue,
    baselineTimestamp: MOCK_HERO.baselineTimestamp,
    annualRate: MOCK_HERO.annualRate,
    source: MOCK_HERO.source,
  },
  sections: MOCK_SECTIONS,
  ticker: MOCK_TICKER,
};

const CountersContext = createContext(MOCK);

export const CountersProvider = ({ children }) => {
  // Start with mock so the UI renders instantly, then swap in server data.
  const [data, setData] = useState(MOCK);

  useEffect(() => {
    let cancelled = false;
    getCounters()
      .then((res) => {
        if (!cancelled && res && res.sections && res.sections.length) {
          setData(res);
        }
      })
      .catch(() => {
        // keep mock fallback
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CountersContext.Provider value={data}>{children}</CountersContext.Provider>
  );
};

export const useCounters = () => useContext(CountersContext);
