import { useEffect, useRef } from "react";

const SECONDS_PER_YEAR = 31536000; // 365 days

/*
  useOdometer — high-performance real-time counter.
  Bypasses React's render cycle entirely: uses requestAnimationFrame +
  a direct DOM textContent mutation via a ref. This lets dozens of
  counters tick at 60fps without layout thrashing.

  Linear extrapolation (the Worldometer model):
    V_current = V_base + R_sec * ((T_now - T_base) / 1000)
  where R_sec = annualRate / 31,536,000.
*/
export function useOdometer({
  baselineValue = 0,
  baselineTimestamp,
  annualRate = 0,
  decimals = 0,
  prefix = "",
  suffix = "",
}) {
  const ref = useRef(null);

  useEffect(() => {
    const baseTime = baselineTimestamp
      ? new Date(baselineTimestamp).getTime()
      : Date.now();
    const ratePerSec = annualRate / SECONDS_PER_YEAR;

    const format = (num) => {
      const safe = Number.isFinite(num) ? num : 0;
      const fixed =
        decimals > 0 ? safe.toFixed(decimals) : Math.floor(safe).toString();
      const parts = fixed.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return `${prefix}${parts.join(".")}${suffix}`;
    };

    let raf;
    const tick = () => {
      const now = Date.now();
      const current =
        baselineValue + ratePerSec * ((now - baseTime) / 1000);
      if (ref.current) ref.current.textContent = format(current);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => cancelAnimationFrame(raf);
  }, [baselineValue, baselineTimestamp, annualRate, decimals, prefix, suffix]);

  return ref;
}
