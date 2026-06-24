import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, ArrowDown, X, Save, GripVertical, Star } from "lucide-react";
import { toast } from "sonner";
import { adminGetHomepage, adminSaveHomepage } from "@/lib/adminApi";

const CATEGORIES = [
  { slug: "politics", name: "Politics" },
  { slug: "health-equity", name: "Health Equity" },
  { slug: "criminal-justice", name: "Criminal Justice" },
  { slug: "environmental-racism", name: "Environmental Racism" },
  { slug: "solutions", name: "Solutions" },
  { slug: "rural", name: "Rural" },
];

const move = (arr, i, dir) => {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const c = [...arr];
  [c[i], c[j]] = [c[j], c[i]];
  return c;
};

function OrderedPicker({ options, value, onChange, testid }) {
  const titleOf = (slug) => options.find((o) => o.slug === slug)?.title || slug;
  const available = options.filter((o) => !value.includes(o.slug));
  return (
    <div data-testid={testid}>
      <div className="border border-border">
        {value.length === 0 && <p className="px-4 py-3 font-mono text-xs text-muted-foreground">Nothing selected — defaults will be used.</p>}
        {value.map((slug, i) => (
          <div key={slug} className="flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 truncate text-sm text-foreground">{titleOf(slug)}</span>
            <button type="button" onClick={() => onChange(move(value, i, -1))} disabled={i === 0} className="flex h-7 w-7 items-center justify-center border border-border text-foreground hover:bg-muted disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => onChange(move(value, i, 1))} disabled={i === value.length - 1} className="flex h-7 w-7 items-center justify-center border border-border text-foreground hover:bg-muted disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => onChange(value.filter((s) => s !== slug))} className="flex h-7 w-7 items-center justify-center border border-border text-accent hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
      {available.length > 0 && (
        <select
          value=""
          onChange={(e) => e.target.value && onChange([...value, e.target.value])}
          className="mt-2 w-full border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">+ Add a story…</option>
          {available.map((o) => <option key={o.slug} value={o.slug}>{o.title}</option>)}
        </select>
      )}
    </div>
  );
}

export default function AdminHomepage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-homepage"], queryFn: adminGetHomepage });
  const [cfg, setCfg] = useState({ lead: "", also_leading: [], latest: [], sections: {} });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data?.config) {
      setCfg({
        lead: data.config.lead || "",
        also_leading: data.config.also_leading || [],
        latest: data.config.latest || [],
        sections: data.config.sections || {},
      });
    }
  }, [data]);

  if (isLoading) return <div className="p-12 font-mono text-sm text-muted-foreground">Loading…</div>;

  const articles = data?.articles || [];
  const setSection = (cat, list) => setCfg((c) => ({ ...c, sections: { ...c.sections, [cat]: list } }));

  const save = async () => {
    setBusy(true);
    try {
      await adminSaveHomepage(cfg);
      toast.success("Homepage layout saved");
    } catch {
      toast.error("Could not save layout");
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent";

  return (
    <div className="p-8 md:p-12" data-testid="admin-homepage">
      <div className="flex items-end justify-between">
        <div>
          <p className="overline text-accent">Curation</p>
          <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight text-foreground">Front Page</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Hand-arrange your homepage. Leave a section empty to fall back to automatic ordering.</p>
        </div>
        <button data-testid="homepage-save" onClick={save} disabled={busy} className="flex items-center gap-2 bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent disabled:opacity-60">
          <Save className="h-4 w-4" /> {busy ? "Saving…" : "Save layout"}
        </button>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div className="space-y-8">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" />
              <h2 className="font-heading text-2xl font-medium text-foreground">Lead Story</h2>
            </div>
            <select data-testid="homepage-lead" value={cfg.lead} onChange={(e) => setCfg({ ...cfg, lead: e.target.value })} className={field}>
              <option value="">Auto (most recent featured)</option>
              {articles.map((a) => <option key={a.slug} value={a.slug}>{a.title}</option>)}
            </select>
          </div>

          <div>
            <h2 className="mb-3 font-heading text-2xl font-medium text-foreground">Also Leading <span className="text-sm text-muted-foreground">(sidebar)</span></h2>
            <OrderedPicker testid="homepage-also" options={articles} value={cfg.also_leading} onChange={(v) => setCfg({ ...cfg, also_leading: v })} />
          </div>

          <div>
            <h2 className="mb-3 font-heading text-2xl font-medium text-foreground">Latest Reporting <span className="text-sm text-muted-foreground">(grid)</span></h2>
            <OrderedPicker testid="homepage-latest" options={articles} value={cfg.latest} onChange={(v) => setCfg({ ...cfg, latest: v })} />
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-heading text-2xl font-medium text-foreground">Section Ordering</h2>
          <p className="mb-4 text-sm text-muted-foreground">Pin and order stories at the top of each section page.</p>
          <div className="space-y-6">
            {CATEGORIES.map((cat) => {
              const catArticles = articles.filter((a) => a.category === cat.slug);
              return (
                <div key={cat.slug} className="border border-border p-4" data-testid={`section-${cat.slug}`}>
                  <p className="overline mb-3 text-accent">{cat.name}</p>
                  <OrderedPicker
                    testid={`section-picker-${cat.slug}`}
                    options={catArticles}
                    value={(cfg.sections[cat.slug] || []).filter((s) => catArticles.some((a) => a.slug === s))}
                    onChange={(v) => setSection(cat.slug, v)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
