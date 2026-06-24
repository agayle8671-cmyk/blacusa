import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { adminListCases, adminCreateCase, adminUpdateCase } from "@/lib/adminApi";
import { formatApiError } from "@/lib/auth";
import { ImageUploadField } from "@/components/ImageUploadField";

const TYPES = ["Missing Person", "Homicide", "Civil Rights"];
const STATUSES = ["Open", "Cold", "Solved"];

const EMPTY = {
  case_number: "", name: "", age: "", sex: "", race: "Black", case_type: "Missing Person",
  status: "Open", date_reported: "", city: "", state: "", lat: "", lng: "",
  agency: "", agency_phone: "", summary: "", family_note: "", image: "",
};

export default function AdminCaseEditor() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: cases = [] } = useQuery({ queryKey: ["admin-cases"], queryFn: adminListCases });
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isNew && cases.length) {
      const c = cases.find((x) => x.id === id);
      if (c) setForm({ ...EMPTY, ...c, age: c.age ?? "", lat: c.lat ?? "", lng: c.lng ?? "" });
    }
  }, [isNew, id, cases]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      ...form,
      age: form.age === "" ? null : Number(form.age),
      lat: form.lat === "" ? null : Number(form.lat),
      lng: form.lng === "" ? null : Number(form.lng),
    };
    try {
      if (isNew) await adminCreateCase(payload);
      else await adminUpdateCase(id, payload);
      toast.success(isNew ? "Case created" : "Case saved");
      qc.invalidateQueries({ queryKey: ["admin-cases"] });
      navigate("/admin/cases");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent";
  const lbl = "overline mb-2 block text-muted-foreground";

  return (
    <div className="p-8 md:p-12" data-testid="admin-case-editor">
      <Link to="/admin/cases" className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent">
        <ArrowLeft className="h-4 w-4" /> Back to cases
      </Link>
      <h1 className="mt-4 font-heading text-4xl font-medium tracking-tight text-foreground">{isNew ? "New cold case" : "Edit cold case"}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Publish responsibly. Only include details with appropriate consent and verification, in line with our trauma-informed standards.</p>

      <form onSubmit={onSubmit} className="mt-8 max-w-3xl space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={lbl}>Case number</label>
            <input data-testid="case-number" required className={field} value={form.case_number} onChange={(e) => set("case_number", e.target.value)} placeholder="BUS-2024-0001" />
          </div>
          <div>
            <label className={lbl}>Full name</label>
            <input data-testid="case-name" required className={field} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className={lbl}>Type</label>
            <select data-testid="case-type" className={field} value={form.case_type} onChange={(e) => set("case_type", e.target.value)}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Status</label>
            <select data-testid="case-status" className={field} value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Date reported</label>
            <input data-testid="case-date" type="date" className={field} value={form.date_reported} onChange={(e) => set("date_reported", e.target.value)} />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <div><label className={lbl}>Age</label><input type="number" className={field} value={form.age} onChange={(e) => set("age", e.target.value)} /></div>
          <div><label className={lbl}>Sex</label><input className={field} value={form.sex} onChange={(e) => set("sex", e.target.value)} /></div>
          <div><label className={lbl}>Race</label><input className={field} value={form.race} onChange={(e) => set("race", e.target.value)} /></div>
        </div>
        <div className="grid gap-5 sm:grid-cols-4">
          <div className="sm:col-span-2"><label className={lbl}>City</label><input data-testid="case-city" className={field} value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
          <div><label className={lbl}>State</label><input className={field} value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="GA" /></div>
          <div className="grid grid-cols-2 gap-2 sm:col-span-1">
            <div><label className={lbl}>Lat</label><input data-testid="case-lat" type="number" step="any" className={field} value={form.lat} onChange={(e) => set("lat", e.target.value)} /></div>
            <div><label className={lbl}>Lng</label><input data-testid="case-lng" type="number" step="any" className={field} value={form.lng} onChange={(e) => set("lng", e.target.value)} /></div>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label className={lbl}>Investigating agency</label><input className={field} value={form.agency} onChange={(e) => set("agency", e.target.value)} /></div>
          <div><label className={lbl}>Agency phone</label><input className={field} value={form.agency_phone} onChange={(e) => set("agency_phone", e.target.value)} /></div>
        </div>
        <div>
          <label className={lbl}>Circumstance summary</label>
          <textarea data-testid="case-summary" rows={4} className={field + " resize-none"} value={form.summary} onChange={(e) => set("summary", e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Family note (optional)</label>
          <textarea rows={2} className={field + " resize-none"} value={form.family_note} onChange={(e) => set("family_note", e.target.value)} placeholder="How the family wishes their loved one remembered." />
        </div>
        <div>
          <label className={lbl}>Portrait (optional — use a family-approved image)</label>
          <ImageUploadField testid="case-image" value={form.image} onChange={(v) => set("image", v)} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={busy} data-testid="case-save" className="bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent disabled:opacity-60">
            {busy ? "Saving…" : isNew ? "Create case" : "Save changes"}
          </button>
          <Link to="/admin/cases" className="border border-border px-7 py-3.5 text-sm font-medium text-foreground hover:bg-muted">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
