import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Phone, MapPin, Calendar, Shield } from "lucide-react";
import { getColdCase } from "@/lib/api";
import { StatusBadge, TYPE_COLOR } from "@/components/CaseRow";
import { CaseMap } from "@/components/CaseMap";

const Field = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 border-b border-border py-4">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
    <div>
      <p className="overline text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  </div>
);

export default function CaseDetail() {
  const { caseNumber } = useParams();
  const { data: c, isLoading } = useQuery({ queryKey: ["case", caseNumber], queryFn: () => getColdCase(caseNumber) });

  if (isLoading) return <div className="px-6 py-32 text-center font-mono text-sm text-muted-foreground">Loading…</div>;
  if (!c) return null;

  return (
    <div className="bg-background pb-24" data-testid="case-detail-page">
      <div className="mx-auto max-w-container px-6 pt-12 md:px-12">
        <Link to="/cold-cases" className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to database
        </Link>
      </div>

      <div className="mx-auto mt-8 grid max-w-container gap-12 px-6 md:px-12 lg:grid-cols-12">
        {/* Left: identity + record */}
        <div className="lg:col-span-7">
          {c.image && (
            <div className="mb-6 overflow-hidden border border-border" data-testid="case-portrait">
              <img src={c.image} alt={c.name} className="img-editorial aspect-[3/2] w-full object-cover" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ background: TYPE_COLOR[c.case_type] || "#666" }} />
            <span className="overline text-accent">{c.case_type}</span>
            <StatusBadge status={c.status} />
          </div>
          <h1 className="mt-4 font-heading text-5xl font-medium leading-[1.0] tracking-tight text-foreground sm:text-7xl">
            {c.name}
          </h1>
          <p className="mt-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Case {c.case_number}
          </p>

          <div className="mt-10">
            <h2 className="overline mb-3 text-muted-foreground">Circumstance</h2>
            <p className="text-lg leading-[1.8] text-foreground">{c.summary}</p>
          </div>

          {c.family_note && (
            <div className="mt-8 border-l-2 border-accent bg-muted p-6">
              <p className="font-heading text-2xl italic leading-snug text-foreground">“{c.family_note}”</p>
              <p className="mt-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">— Shared by the family</p>
            </div>
          )}

          <div className="mt-10">
            <CaseMap cases={[c]} height={320} />
          </div>
        </div>

        {/* Right: data panel */}
        <aside className="lg:col-span-5">
          <div className="border border-border bg-muted p-6 md:p-8 lg:sticky lg:top-[140px]">
            <h2 className="overline mb-2 text-muted-foreground">Record</h2>
            <div className="grid grid-cols-2 gap-x-6">
              <Field icon={Shield} label="Age" value={`${c.age}`} />
              <Field icon={Shield} label="Sex" value={c.sex} />
            </div>
            <Field icon={Calendar} label="Reported" value={c.date_reported} />
            <Field icon={MapPin} label="Location" value={`${c.city}, ${c.state}`} />
            <Field icon={Shield} label="Investigating Agency" value={c.agency} />
            <Field icon={Phone} label="Agency Contact" value={c.agency_phone} />

            <Link
              to={`/submit-tip?case=${c.case_number}&name=${encodeURIComponent(c.name)}`}
              data-testid="case-detail-submit-tip"
              className="mt-6 block bg-primary px-6 py-4 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-accent"
            >
              Submit a tip on this case
            </Link>
            <p className="mt-4 font-mono text-[0.65rem] leading-relaxed text-muted-foreground">
              Tips are reviewed by editorial staff before any publication. Defamatory or
              unverified content is never published. If you are in danger, call 911.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
