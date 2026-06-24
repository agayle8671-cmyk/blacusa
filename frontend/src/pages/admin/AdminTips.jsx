import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { adminListTips, adminUpdateTip, adminDeleteTip } from "@/lib/adminApi";

const FILTERS = [
  { key: "", label: "All" },
  { key: "pending_review", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const STATUS_STYLE = {
  pending_review: "border-accent text-accent",
  approved: "border-foreground bg-foreground text-background",
  rejected: "border-muted-foreground text-muted-foreground line-through",
  reviewed: "border-muted-foreground text-muted-foreground",
};

export default function AdminTips() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const { data: tips = [], isLoading } = useQuery({
    queryKey: ["admin-tips", filter],
    queryFn: () => adminListTips(filter || undefined),
  });

  const act = async (tip, status) => {
    try {
      await adminUpdateTip(tip.id, status);
      toast.success(`Tip ${status.replace("_", " ")}`);
      qc.invalidateQueries({ queryKey: ["admin-tips"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch {
      toast.error("Could not update tip");
    }
  };

  const remove = async (tip) => {
    if (!window.confirm("Delete this tip permanently?")) return;
    try {
      await adminDeleteTip(tip.id);
      toast.success("Tip deleted");
      qc.invalidateQueries({ queryKey: ["admin-tips"] });
    } catch {
      toast.error("Could not delete tip");
    }
  };

  return (
    <div className="p-8 md:p-12" data-testid="admin-tips">
      <p className="overline text-accent">Moderation</p>
      <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight text-foreground">Tip Queue</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Review community tips before any are acted on. Nothing is published automatically — defamatory or unverified claims should be rejected.</p>

      <div className="mt-8 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            data-testid={`tips-filter-${f.key || "all"}`}
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
        ) : tips.length === 0 ? (
          <p className="border border-border bg-muted p-8 text-center font-mono text-sm text-muted-foreground">No tips in this view.</p>
        ) : (
          tips.map((t) => (
            <div key={t.id} data-testid={`tip-${t.id}`} className="border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest ${STATUS_STYLE[t.status] || ""}`}>
                      {t.status.replace("_", " ")}
                    </span>
                    {t.case_number && <span className="font-mono text-xs text-muted-foreground">{t.case_number}</span>}
                    {t.case_name && <span className="text-sm font-medium text-foreground">{t.case_name}</span>}
                  </div>
                  <p className="mt-3 text-base leading-relaxed text-foreground">{t.message}</p>
                  <p className="mt-3 flex items-center gap-2 font-mono text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {t.anonymous ? "Anonymous" : `${t.name || "Unnamed"}${t.contact ? ` · ${t.contact}` : ""}`}
                    {" · "}{new Date(t.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                <button data-testid={`tip-approve-${t.id}`} onClick={() => act(t, "approved")} className="flex items-center gap-1.5 bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-accent">
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
                <button data-testid={`tip-reject-${t.id}`} onClick={() => act(t, "rejected")} className="flex items-center gap-1.5 border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted">
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
                {t.status !== "pending_review" && (
                  <button onClick={() => act(t, "pending_review")} className="border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted">
                    Re-open
                  </button>
                )}
                <button data-testid={`tip-delete-${t.id}`} onClick={() => remove(t)} className="ml-auto flex items-center gap-1.5 border border-border px-4 py-2 text-xs font-medium text-accent hover:bg-muted">
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
