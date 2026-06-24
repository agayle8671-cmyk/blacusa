import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, Users, Download } from "lucide-react";
import { adminSubscribers, adminMemberships } from "@/lib/adminApi";

function exportCsv(rows, cols, filename) {
  const header = cols.join(",");
  const body = rows.map((r) => cols.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminAudience() {
  const [tab, setTab] = useState("subscribers");
  const { data: subs = [] } = useQuery({ queryKey: ["admin-subs"], queryFn: adminSubscribers });
  const { data: members = [] } = useQuery({ queryKey: ["admin-members"], queryFn: adminMemberships });

  const isSubs = tab === "subscribers";
  const rows = isSubs ? subs : members;

  return (
    <div className="p-8 md:p-12" data-testid="admin-audience">
      <p className="overline text-accent">Community</p>
      <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight text-foreground">Audience</h1>

      <div className="mt-8 flex items-center justify-between">
        <div className="flex gap-2">
          <button data-testid="audience-tab-subscribers" onClick={() => setTab("subscribers")} className={`flex items-center gap-2 border px-4 py-2 text-sm font-medium ${isSubs ? "border-accent bg-accent text-accent-foreground" : "border-border text-foreground hover:bg-muted"}`}>
            <Mail className="h-4 w-4" /> Subscribers ({subs.length})
          </button>
          <button data-testid="audience-tab-members" onClick={() => setTab("members")} className={`flex items-center gap-2 border px-4 py-2 text-sm font-medium ${!isSubs ? "border-accent bg-accent text-accent-foreground" : "border-border text-foreground hover:bg-muted"}`}>
            <Users className="h-4 w-4" /> Members ({members.length})
          </button>
        </div>
        <button
          data-testid="audience-export"
          onClick={() => isSubs ? exportCsv(subs, ["email", "zip_code", "created_at"], "subscribers.csv") : exportCsv(members, ["name", "email", "tier", "created_at"], "members.csv")}
          className="flex items-center gap-2 border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="mt-6 border border-border">
        <div className={`grid ${isSubs ? "grid-cols-3" : "grid-cols-4"} gap-4 border-b border-foreground px-5 py-3`}>
          {(isSubs ? ["Email", "Zip", "Joined"] : ["Name", "Email", "Tier", "Joined"]).map((h) => (
            <span key={h} className="overline text-muted-foreground">{h}</span>
          ))}
        </div>
        {rows.length === 0 ? (
          <p className="p-6 font-mono text-sm text-muted-foreground">No records yet.</p>
        ) : (
          rows.map((r, i) => (
            <div key={i} className={`grid ${isSubs ? "grid-cols-3" : "grid-cols-4"} gap-4 border-b border-border px-5 py-3.5 text-sm text-foreground last:border-b-0`}>
              {isSubs ? (
                <>
                  <span className="truncate">{r.email}</span>
                  <span className="text-muted-foreground">{r.zip_code || "—"}</span>
                  <span className="font-mono text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                </>
              ) : (
                <>
                  <span>{r.name}</span>
                  <span className="truncate text-muted-foreground">{r.email}</span>
                  <span><span className="border border-border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest">{r.tier}</span></span>
                  <span className="font-mono text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
