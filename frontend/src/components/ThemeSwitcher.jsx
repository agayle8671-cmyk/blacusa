import { useState, useEffect, useRef } from "react";
import { Palette, Check } from "lucide-react";
import { THEMES, applyTheme, getStoredTheme } from "@/lib/themes";

export const ThemeSwitcher = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(getStoredTheme());
  const ref = useRef(null);

  useEffect(() => {
    applyTheme(active);
  }, []); // eslint-disable-line

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pick = (key) => {
    setActive(key);
    applyTheme(key);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        data-testid="theme-switcher-button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Change theme"
        className="flex h-9 w-9 items-center justify-center border border-border text-foreground transition-colors hover:bg-muted"
      >
        <Palette className="h-4 w-4" />
      </button>
      {open && (
        <div
          data-testid="theme-switcher-menu"
          className="absolute right-0 z-50 mt-2 w-64 border border-border bg-popover p-1 shadow-xl animate-fade-in"
        >
          <p className="overline px-3 pb-2 pt-3 text-muted-foreground">Palette</p>
          {Object.entries(THEMES).map(([key, t]) => (
            <button
              key={key}
              data-testid={`theme-option-${key}`}
              onClick={() => pick(key)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted"
            >
              <span className="flex">
                {t.swatch.map((c, i) => (
                  <span
                    key={i}
                    className="h-5 w-5 border border-border"
                    style={{ background: c, marginLeft: i ? -4 : 0 }}
                  />
                ))}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium text-popover-foreground">{t.label}</span>
                <span className="block text-xs text-muted-foreground">{t.description}</span>
              </span>
              {active === key && <Check className="h-4 w-4 text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
