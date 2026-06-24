import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Clock,
  Sparkles, Play, RefreshCw, Rss,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminListArticles,
  adminDeleteArticle,
  adminRunScraper,
  adminScraperStatus,
} from "@/lib/adminApi";

const FILTERS = ["all", "live", "draft", "scheduled", "ai-drafts"];

function statusBadge(a) {
  if (a.is_ai_draft) {
    return (
      <span
        data-testid={`ai-draft-badge-${a.slug}`}
        className="inline-flex items-center gap-1 border border-accent/60 bg-accent/10 px-1.5 font-mono text-[0.6rem] uppercase tracking-widest text-accent"
      >
        <Sparkles className="h-2.5 w-2.5" /> AI Draft
      </span>
    );
  }
  if (a.publish_at && new Date(a.publish_at) > new Date()) {
    return (
      <span
        data-testid={`scheduled-badge-${a.slug}`}
        className="inline-flex items-center gap-1 border border-accent px-1.5 font-mono text-[0.6rem] uppercase tracking-widest text-accent"
      >
        <Clock className="h-3 w-3" /> Scheduled {new Date(a.publish_at).toLocaleDateString()}
      </span>
    );
  }
  if (a.is_published !== false) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
        <Eye className="h-3 w-3" /> Live
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[0.6rem] uppercase tracking-widest text-accent">
      <EyeOff className="h-3 w-3" /> Draft
    </span>
  );
}

function filterArticles(articles, filter) {
  switch (filter) {
    case "live":
      return articles.filter(
        (a) => a.is_published !== false && !a.is_ai_draft &&
          !(a.publish_at && new Date(a.publish_at) > new Date())
      );
    case "draft":
      return articles.filter((a) => a.is_published === false && !a.is_ai_draft);
    case "scheduled":
      return articles.filter((a) => a.publish_at && new Date(a.publish_at) > new Date());
    case "ai-drafts":
      return articles.filter((a) => a.is_ai_draft);
    default:
      return articles;
  }
}

export default function AdminArticles() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [scraperResult, setScraperResult] = useState(null);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: adminListArticles,
  });

  const { data: scraperStatus } = useQuery({
    queryKey: ["scraper-status"],
    queryFn: adminScraperStatus,
    refetchInterval: 5000, // poll every 5s to detect when scraper finishes
  });

  const scraperMutation = useMutation({
    mutationFn: adminRunScraper,
    onMutate: () => {
      toast.loading("Scraper running — fetching from 20+ sources…", { id: "scraper" });
    },
    onSuccess: (data) => {
      toast.dismiss("scraper");
      setScraperResult(data);
      const msg = `✦ Scraper done: ${data.ingested} new drafts ingested, ${data.skipped} skipped`;
      toast.success(msg, { duration: 8000 });
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      qc.invalidateQueries({ queryKey: ["scraper-status"] });
      if (data.ingested > 0) setFilter("ai-drafts");
    },
    onError: (err) => {
      toast.dismiss("scraper");
      const msg = err.response?.data?.detail || "Scraper failed";
      toast.error(msg);
    },
  });

  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.title}"? This cannot be undone.`)) return;
    try {
      await adminDeleteArticle(a.id);
      toast.success("Article deleted");
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
    } catch {
      toast.error("Could not delete article");
    }
  };

  const filtered = filterArticles(articles, filter);
  const aiDraftCount = articles.filter((a) => a.is_ai_draft).length;
  const isScraperRunning = scraperMutation.isPending || scraperStatus?.running;

  return (
    <div className="p-8 md:p-12" data-testid="admin-articles">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="overline text-accent">Content</p>
          <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight text-foreground">Articles</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Run Scraper Button */}
          <button
            data-testid="run-scraper-btn"
            onClick={() => scraperMutation.mutate()}
            disabled={isScraperRunning}
            className="flex items-center gap-2 border border-accent/60 bg-accent/5 px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/15 disabled:opacity-50"
          >
            {isScraperRunning
              ? <RefreshCw className="h-4 w-4 animate-spin" />
              : <Rss className="h-4 w-4" />}
            {isScraperRunning ? "Scraping…" : "▶ Run Scraper"}
          </button>
          <Link
            to="/admin/articles/new"
            data-testid="new-article-button"
            className="flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent"
          >
            <Plus className="h-4 w-4" /> New article
          </Link>
        </div>
      </div>

      {/* ── Scraper Status Bar ── */}
      {scraperStatus && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border border-border/50 bg-muted/30 px-4 py-2.5 font-mono text-xs text-muted-foreground">
          <span className={`flex items-center gap-1.5 ${scraperStatus.groq_configured ? "text-green-600" : "text-amber-500"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${scraperStatus.groq_configured ? "bg-green-500" : "bg-amber-400"}`} />
            {scraperStatus.groq_configured ? "Groq connected" : "GROQ_API_KEY not set"}
          </span>
          <span>·</span>
          <span>{scraperStatus.sources_count} sources configured</span>
          {scraperStatus.last_run && (
            <>
              <span>·</span>
              <span>Last run: {new Date(scraperStatus.last_run.timestamp).toLocaleString()} — {scraperStatus.last_run.ingested} ingested</span>
            </>
          )}
          {scraperStatus.running && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1 text-accent">
                <RefreshCw className="h-3 w-3 animate-spin" /> Running now…
              </span>
            </>
          )}
        </div>
      )}

      {/* ── Filter Tabs ── */}
      <div className="mt-6 flex flex-wrap gap-0 border-b border-border">
        {FILTERS.map((f) => {
          const count = f === "all" ? articles.length
            : f === "ai-drafts" ? aiDraftCount
            : filterArticles(articles, f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              data-testid={`filter-${f}`}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors
                ${filter === f
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {f === "ai-drafts" && <Sparkles className="h-3 w-3" />}
              {f.replace("-", " ")}
              {count > 0 && (
                <span className={`rounded-sm px-1 py-0.5 text-[0.55rem] ${f === "ai-drafts" && aiDraftCount > 0 ? "bg-accent text-primary-foreground" : "bg-muted"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── AI Drafts Notice ── */}
      {filter === "ai-drafts" && aiDraftCount > 0 && (
        <div className="mt-4 flex items-start gap-3 border border-accent/30 bg-accent/5 p-4">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {aiDraftCount} AI-generated {aiDraftCount === 1 ? "draft" : "drafts"} awaiting editorial review
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              These were written by Groq using site memory from past BlacUSA coverage. Review, edit, then toggle "Published" to make them live.
            </p>
          </div>
        </div>
      )}

      {/* ── Article List ── */}
      <div className="mt-4 border border-border">
        {isLoading ? (
          <p className="p-6 font-mono text-sm text-muted-foreground">Loading…</p>
        ) : (
          filtered.map((a) => (
            <div
              key={a.id}
              data-testid={`admin-article-row-${a.slug}`}
              className={`flex items-center justify-between gap-4 border-b border-border px-5 py-4 last:border-b-0
                ${a.is_ai_draft ? "bg-accent/3" : ""}`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="overline text-accent">{a.category}</span>
                  {statusBadge(a)}
                  {a.scraped_source && (
                    <span className="inline-flex items-center gap-1 bg-muted px-1.5 font-mono text-[0.6rem] text-muted-foreground">
                      <Rss className="h-2.5 w-2.5" /> via {a.scraped_source}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate font-heading text-xl font-medium text-foreground">{a.title}</p>
                <p className="font-mono text-xs text-muted-foreground">{a.author} · /{a.slug}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  to={`/admin/articles/${a.id}`}
                  data-testid={`edit-article-${a.slug}`}
                  className="flex h-9 w-9 items-center justify-center border border-border hover:bg-muted"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => remove(a)}
                  data-testid={`delete-article-${a.slug}`}
                  className="flex h-9 w-9 items-center justify-center border border-border text-accent hover:bg-muted"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="p-8 text-center">
            <p className="font-mono text-sm text-muted-foreground">
              {filter === "ai-drafts"
                ? "No AI drafts yet. Click \"▶ Run Scraper\" to fetch and generate drafts from 20+ sources."
                : "No articles in this filter."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
