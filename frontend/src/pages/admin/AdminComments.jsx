import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { adminListComments, adminUpdateComment, adminDeleteComment } from "@/lib/adminApi";

const FILTERS = [
  { key: "pending_review", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "", label: "All" },
];

const STATUS_STYLE = {
  pending_review: "border-accent text-accent",
  approved: "border-foreground bg-foreground text-background",
  rejected: "border-muted-foreground text-muted-foreground line-through",
};

export default function AdminComments() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("pending_review");
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["admin-comments", filter],
    queryFn: () => adminListComments(filter || undefined),
  });

  const act = async (c, status) => {
    try {
      await adminUpdateComment(c.id, status);
      toast.success(`Comment ${status.replace("_", " ")}`);
      qc.invalidateQueries({ queryKey: ["admin-comments"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch {
      toast.error("Could not update comment");
    }
  };

  const remove = async (c) => {
    if (!window.confirm("Delete this comment permanently?")) return;
    try {
      await adminDeleteComment(c.id);
      toast.success("Comment deleted");
      qc.invalidateQueries({ queryKey: ["admin-comments"] });
    } catch {
      toast.error("Could not delete comment");
    }
  };

  return (
    <div className="p-8 md:p-12" data-testid="admin-comments">
      <p className="overline text-accent">Moderation</p>
      <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight text-foreground">Comments</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">All community comments are held for review before publishing. Approve, reject, or remove — defamatory content should never go live.</p>

      <div className="mt-8 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            data-testid={`comments-filter-${f.key || "all"}`}
            onClick={() => setFilter(f.key)}
            className={`border px-4 py-2 text-xs font-medium transition-colors ${filter === f.key ? "border-accent bg-accent text-accent-foreground" : "border-border text-foreground hover:bg-muted"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {isLoading ? (
          <p className="font-mono text-sm text-muted-foreground">Loading…</p>
        ) : comments.length === 0 ? (
          <p className="border border-border bg-muted p-8 text-center font-mono text-sm text-muted-foreground">No comments in this view.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} data-testid={`admin-comment-${c.id}`} className="border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest ${STATUS_STYLE[c.status] || ""}`}>
                  {c.status.replace("_", " ")}
                </span>
                <span className="font-heading text-lg font-medium text-foreground">{c.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-3 leading-relaxed text-foreground">{c.body}</p>
              <p className="mt-2 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" /> on “{c.article_title}”
              </p>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                <button data-testid={`comment-approve-${c.id}`} onClick={() => act(c, "approved")} className="flex items-center gap-1.5 bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-accent">
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
                <button data-testid={`comment-reject-${c.id}`} onClick={() => act(c, "rejected")} className="flex items-center gap-1.5 border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted">
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
                <button data-testid={`comment-delete-${c.id}`} onClick={() => remove(c)} className="ml-auto flex items-center gap-1.5 border border-border px-4 py-2 text-xs font-medium text-accent hover:bg-muted">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
