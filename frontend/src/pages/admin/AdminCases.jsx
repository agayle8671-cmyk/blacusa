import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminListCases, adminDeleteCase } from "@/lib/adminApi";
import { TYPE_COLOR, StatusBadge } from "@/components/CaseRow";

export default function AdminCases() {
  const qc = useQueryClient();
  const { data: cases = [], isLoading } = useQuery({ queryKey: ["admin-cases"], queryFn: adminListCases });

  const remove = async (c) => {
    if (!window.confirm(`Delete the record for ${c.name}? This cannot be undone.`)) return;
    try {
      await adminDeleteCase(c.id);
      toast.success("Case deleted");
      qc.invalidateQueries({ queryKey: ["admin-cases"] });
    } catch {
      toast.error("Could not delete case");
    }
  };

  return (
    <div className="p-8 md:p-12" data-testid="admin-cases">
      <div className="flex items-end justify-between">
        <div>
          <p className="overline text-accent">Public Record</p>
          <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight text-foreground">Cold Cases</h1>
        </div>
        <Link to="/admin/cases/new" data-testid="new-case-button" className="flex items-center gap-2 bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent">
          <Plus className="h-4 w-4" /> New case
        </Link>
      </div>

      <div className="mt-10 border border-border">
        {isLoading ? (
          <p className="p-6 font-mono text-sm text-muted-foreground">Loading…</p>
        ) : (
          cases.map((c) => (
            <div key={c.id} data-testid={`admin-case-row-${c.case_number}`} className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 last:border-b-0">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: TYPE_COLOR[c.case_type] || "#666" }} />
                <div>
                  <p className="font-heading text-xl font-medium text-foreground">{c.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{c.case_number} &middot; {c.case_type} &middot; {c.city}, {c.state}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={c.status} />
                <Link to={`/admin/cases/${c.id}`} data-testid={`edit-case-${c.case_number}`} className="flex h-9 w-9 items-center justify-center border border-border hover:bg-muted">
                  <Pencil className="h-4 w-4" />
                </Link>
                <button onClick={() => remove(c)} data-testid={`delete-case-${c.case_number}`} className="flex h-9 w-9 items-center justify-center border border-border text-accent hover:bg-muted">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
        {!isLoading && cases.length === 0 && <p className="p-6 font-mono text-sm text-muted-foreground">No cases yet.</p>}
      </div>
    </div>
  );
}
