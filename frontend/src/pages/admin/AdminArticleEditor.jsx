import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Sparkles, RefreshCw, Check, X, Tag, FileText, Wand2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import {
  adminListArticles,
  adminCreateArticle,
  adminUpdateArticle,
  adminAiDraftFromHeadline,
  adminAiGenerateDek,
  adminAiSuggestTags,
  adminAiImproveParagraph,
} from "@/lib/adminApi";
import { formatApiError } from "@/lib/auth";
import { ImageUploadField } from "@/components/ImageUploadField";

const CATEGORIES = [
  "politics", "health-equity", "criminal-justice",
  "environmental-racism", "solutions", "rural",
];

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const isoToLocal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EMPTY = {
  slug: "", title: "", dek: "", category: "politics", author: "BlacUSA Staff",
  author_role: "Staff Reporter", read_minutes: 5, is_solutions: false, is_featured: false,
  is_published: true, publish_at: "", image: "", content_warning: "", tags: "", body: "",
};

// ── AI Suggestion Chip ─────────────────────────────────────────────────────────
function AiSuggestionBox({ label, content, onAccept, onDiscard }) {
  if (!content) return null;
  return (
    <div className="mt-2 border border-accent/40 bg-card/60 p-3" data-testid="ai-suggestion-box">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-widest text-accent">
          <Sparkles className="h-3 w-3" /> {label}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onAccept}
            data-testid="ai-accept"
            className="flex items-center gap-1 bg-accent px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <Check className="h-3 w-3" /> Accept
          </button>
          <button
            type="button"
            onClick={onDiscard}
            data-testid="ai-discard"
            className="flex items-center gap-1 border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            <X className="h-3 w-3" /> Discard
          </button>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-xs text-foreground">{content}</p>
    </div>
  );
}

// ── Internal Reference Chips ───────────────────────────────────────────────────
function InternalRefChips({ refs, onInsert }) {
  if (!refs || refs.length === 0) return null;
  return (
    <div className="mt-3 border border-border/50 bg-muted/30 p-3">
      <p className="mb-2 flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
        <BookOpen className="h-3 w-3" /> AI referenced past coverage
      </p>
      <div className="flex flex-wrap gap-2">
        {refs.map((slug) => (
          <button
            key={slug}
            type="button"
            onClick={() => onInsert(slug)}
            className="border border-accent/40 px-2.5 py-1 font-mono text-[0.65rem] text-accent hover:bg-accent/10 transition-colors"
            title={`Insert reference to /${slug}`}
          >
            /{slug}
          </button>
        ))}
      </div>
      <p className="mt-1.5 font-mono text-[0.6rem] text-muted-foreground">
        Click a reference to append a "We previously reported…" paragraph
      </p>
    </div>
  );
}

// ── AI Spinner ─────────────────────────────────────────────────────────────────
function AiButton({ onClick, loading, icon: Icon, children, testid, variant = "ghost" }) {
  const base = variant === "primary"
    ? "flex items-center gap-2 bg-accent px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
    : "flex items-center gap-1.5 border border-accent/50 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-widest text-accent hover:bg-accent/10 disabled:opacity-40 transition-colors";
  return (
    <button type="button" onClick={onClick} disabled={loading} data-testid={testid} className={base}>
      {loading
        ? <RefreshCw className="h-3 w-3 animate-spin" />
        : <Icon className="h-3 w-3" />}
      {children}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminArticleEditor() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: articles = [] } = useQuery({ queryKey: ["admin-articles"], queryFn: adminListArticles });
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [isAiDraft, setIsAiDraft] = useState(false);

  // AI state
  const [aiLoading, setAiLoading] = useState({ draft: false, dek: false, tags: false, improve: false });
  const [aiSuggestions, setAiSuggestions] = useState({ dek: null, tags: null, improve: null });
  const [internalRefs, setInternalRefs] = useState([]);

  const field = "w-full border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent";
  const lbl = "overline mb-2 block text-muted-foreground";

  useEffect(() => {
    if (!isNew && articles.length) {
      const a = articles.find((x) => x.id === id);
      if (a) {
        setForm({
          ...a,
          content_warning: a.content_warning || "",
          publish_at: isoToLocal(a.publish_at),
          tags: (a.tags || []).join(", "),
          body: (a.body || []).join("\n\n"),
        });
        setSlugTouched(true);
        if (a.is_ai_draft) setIsAiDraft(true);
        if (a.ai_internal_refs?.length) setInternalRefs(a.ai_internal_refs);
      }
    }
  }, [isNew, id, articles]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onTitle = (v) => {
    set("title", v);
    if (isNew && !slugTouched) set("slug", slugify(v));
  };

  // ── AI Actions ────────────────────────────────────────────────────────────────
  const handleDraftFromHeadline = async () => {
    if (!form.title.trim()) { toast.error("Enter a headline first"); return; }
    setAiLoading((l) => ({ ...l, draft: true }));
    try {
      const result = await adminAiDraftFromHeadline(form.title, form.category);
      setForm((f) => ({
        ...f,
        dek: result.dek || f.dek,
        tags: Array.isArray(result.tags) ? result.tags.join(", ") : f.tags,
        body: Array.isArray(result.body) ? result.body.join("\n\n") : f.body,
        content_warning: result.content_warning || f.content_warning,
      }));
      if (result.internal_refs?.length) setInternalRefs(result.internal_refs);
      if (!slugTouched && isNew) set("slug", slugify(form.title));
      setIsAiDraft(true);
      toast.success("AI draft generated — review and edit before publishing");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "AI draft failed");
    } finally {
      setAiLoading((l) => ({ ...l, draft: false }));
    }
  };

  const handleSuggestDek = async () => {
    setAiLoading((l) => ({ ...l, dek: true }));
    setAiSuggestions((s) => ({ ...s, dek: null }));
    try {
      const { dek } = await adminAiGenerateDek(form.title, form.body);
      setAiSuggestions((s) => ({ ...s, dek }));
    } catch (err) {
      toast.error("Dek suggestion failed");
    } finally {
      setAiLoading((l) => ({ ...l, dek: false }));
    }
  };

  const handleSuggestTags = async () => {
    if (!form.body.trim()) { toast.error("Add some body content first"); return; }
    setAiLoading((l) => ({ ...l, tags: true }));
    setAiSuggestions((s) => ({ ...s, tags: null }));
    try {
      const { tags } = await adminAiSuggestTags(form.body);
      setAiSuggestions((s) => ({ ...s, tags: Array.isArray(tags) ? tags.join(", ") : tags }));
    } catch (err) {
      toast.error("Tag suggestion failed");
    } finally {
      setAiLoading((l) => ({ ...l, tags: false }));
    }
  };

  const handleImprove = async () => {
    if (!form.body.trim()) { toast.error("Add some body content first"); return; }
    setAiLoading((l) => ({ ...l, improve: true }));
    setAiSuggestions((s) => ({ ...s, improve: null }));
    // Send the first paragraph or up to 600 chars
    const firstPara = form.body.split(/\n\s*\n/)[0] || form.body.slice(0, 600);
    try {
      const { text } = await adminAiImproveParagraph(firstPara);
      setAiSuggestions((s) => ({ ...s, improve: text }));
    } catch (err) {
      toast.error("Paragraph improvement failed");
    } finally {
      setAiLoading((l) => ({ ...l, improve: false }));
    }
  };

  const acceptDek = () => {
    if (aiSuggestions.dek) set("dek", aiSuggestions.dek);
    setAiSuggestions((s) => ({ ...s, dek: null }));
  };

  const acceptTags = () => {
    if (aiSuggestions.tags) set("tags", aiSuggestions.tags);
    setAiSuggestions((s) => ({ ...s, tags: null }));
  };

  const acceptImprove = () => {
    if (aiSuggestions.improve) {
      // Replace first paragraph with improved version
      const paras = form.body.split(/\n\s*\n/);
      paras[0] = aiSuggestions.improve;
      set("body", paras.join("\n\n"));
    }
    setAiSuggestions((s) => ({ ...s, improve: null }));
  };

  const insertInternalRef = (slug) => {
    const refPara = `We previously reported on this: blacusa.com/article/${slug}`;
    set("body", form.body ? form.body + "\n\n" + refPara : refPara);
    toast.success("Reference added to body");
  };

  // ── Form Submit ───────────────────────────────────────────────────────────────
  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      ...form,
      read_minutes: Number(form.read_minutes) || 1,
      content_warning: form.content_warning?.trim() || null,
      publish_at: form.publish_at ? new Date(form.publish_at).toISOString() : null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      body: form.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
    };
    try {
      if (isNew) await adminCreateArticle(payload);
      else await adminUpdateArticle(id, payload);
      toast.success(isNew ? "Article created" : "Article saved");
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      navigate("/admin/articles");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-8 md:p-12" data-testid="admin-article-editor">
      <Link to="/admin/articles" className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent">
        <ArrowLeft className="h-4 w-4" /> Back to articles
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-heading text-4xl font-medium tracking-tight text-foreground">
          {isNew ? "New article" : "Edit article"}
        </h1>
        {isAiDraft && (
          <div className="flex items-center gap-2 border border-accent/40 bg-accent/5 px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="font-mono text-xs text-accent">AI-assisted draft — review before publishing</span>
            <button type="button" onClick={() => setIsAiDraft(false)} className="ml-1 text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* ── AI Draft from Headline CTA ── */}
      <div className="mt-6 border border-accent/30 bg-gradient-to-r from-accent/5 to-transparent p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">
              ✦ AI Writing Assistant
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Enter a headline and category, then let Groq draft a full article — informed by BlacUSA's past coverage.
            </p>
          </div>
          <AiButton
            onClick={handleDraftFromHeadline}
            loading={aiLoading.draft}
            icon={Wand2}
            testid="ai-draft-btn"
            variant="primary"
          >
            {aiLoading.draft ? "Generating draft…" : "✦ Draft from Headline"}
          </AiButton>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-8 max-w-3xl space-y-5">
        <div>
          <label className={lbl}>Headline</label>
          <input data-testid="article-title" required className={field} value={form.title} onChange={(e) => onTitle(e.target.value)} placeholder="The headline of the story" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={lbl}>Slug</label>
            <input data-testid="article-slug" required className={field} value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} placeholder="story-url-slug" />
          </div>
          <div>
            <label className={lbl}>Category</label>
            <select data-testid="article-category" className={field} value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* ── Dek with AI Suggest ── */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className={lbl} style={{ marginBottom: 0 }}>Dek / Standfirst</label>
            <AiButton onClick={handleSuggestDek} loading={aiLoading.dek} icon={Sparkles} testid="ai-dek-btn">
              ✦ Suggest Dek
            </AiButton>
          </div>
          <textarea data-testid="article-dek" rows={2} className={field + " resize-none"} value={form.dek} onChange={(e) => set("dek", e.target.value)} placeholder="A one or two sentence summary" />
          <AiSuggestionBox
            label="AI Dek Suggestion"
            content={aiSuggestions.dek}
            onAccept={acceptDek}
            onDiscard={() => setAiSuggestions((s) => ({ ...s, dek: null }))}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={lbl}>Author</label>
            <input data-testid="article-author" className={field} value={form.author} onChange={(e) => set("author", e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Author role</label>
            <input className={field} value={form.author_role} onChange={(e) => set("author_role", e.target.value)} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={lbl}>Read minutes</label>
            <input type="number" min="1" className={field} value={form.read_minutes} onChange={(e) => set("read_minutes", e.target.value)} />
          </div>
          {/* ── Tags with AI Suggest ── */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className={lbl} style={{ marginBottom: 0 }}>Tags (comma separated)</label>
              <AiButton onClick={handleSuggestTags} loading={aiLoading.tags} icon={Tag} testid="ai-tags-btn">
                ✦ Suggest Tags
              </AiButton>
            </div>
            <input data-testid="article-tags" className={field} value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="voting, organizing" />
            <AiSuggestionBox
              label="AI Tag Suggestions"
              content={aiSuggestions.tags}
              onAccept={acceptTags}
              onDiscard={() => setAiSuggestions((s) => ({ ...s, tags: null }))}
            />
          </div>
        </div>

        <div>
          <label className={lbl}>Hero image</label>
          <ImageUploadField testid="article-image" value={form.image} onChange={(v) => set("image", v)} />
        </div>

        <div>
          <label className={lbl}>Content warning (optional)</label>
          <input data-testid="article-warning" className={field} value={form.content_warning} onChange={(e) => set("content_warning", e.target.value)} placeholder="e.g. This article discusses violence." />
        </div>

        {/* ── Body with AI Improve ── */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className={lbl} style={{ marginBottom: 0 }}>Body (separate paragraphs with a blank line)</label>
            <AiButton onClick={handleImprove} loading={aiLoading.improve} icon={FileText} testid="ai-improve-btn">
              ✦ Improve
            </AiButton>
          </div>
          <textarea
            data-testid="article-body"
            rows={12}
            className={field + " resize-y font-mono text-xs"}
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            placeholder={"First paragraph…\n\nSecond paragraph…"}
          />
          <AiSuggestionBox
            label="AI Improved First Paragraph"
            content={aiSuggestions.improve}
            onAccept={acceptImprove}
            onDiscard={() => setAiSuggestions((s) => ({ ...s, improve: null }))}
          />
        </div>

        {/* ── Internal Reference Chips (from RAG context) ── */}
        <InternalRefChips refs={internalRefs} onInsert={insertInternalRef} />

        <div className="flex flex-wrap gap-6 border-y border-border py-4">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" data-testid="article-published" className="h-4 w-4 accent-[hsl(var(--accent))]" checked={form.is_published} onChange={(e) => set("is_published", e.target.checked)} /> Published (live)
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" data-testid="article-featured" className="h-4 w-4 accent-[hsl(var(--accent))]" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> Featured on homepage
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" data-testid="article-solutions" className="h-4 w-4 accent-[hsl(var(--accent))]" checked={form.is_solutions} onChange={(e) => set("is_solutions", e.target.checked)} /> Solutions journalism
          </label>
        </div>

        <div className="border border-border bg-muted p-4">
          <label className={lbl}>Schedule publish (optional)</label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="datetime-local"
              data-testid="article-publish-at"
              className="border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent"
              value={form.publish_at}
              onChange={(e) => set("publish_at", e.target.value)}
            />
            {form.publish_at && (
              <button type="button" data-testid="article-publish-clear" onClick={() => set("publish_at", "")} className="text-xs font-medium text-accent hover:underline">
                Clear
              </button>
            )}
            <p className="text-xs text-muted-foreground">
              {form.publish_at && new Date(form.publish_at) > new Date()
                ? "This story stays a draft until the scheduled time, then goes live automatically."
                : "Leave empty to publish immediately (when 'Published' is on)."}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={busy} data-testid="article-save" className="bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent disabled:opacity-60">
            {busy ? "Saving…" : isNew ? "Create article" : "Save changes"}
          </button>
          <Link to="/admin/articles" className="border border-border px-7 py-3.5 text-sm font-medium text-foreground hover:bg-muted">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
