import { Link } from "react-router-dom";

export const STATUS_STYLE = {
  Open: "border-accent text-accent",
  Cold: "border-muted-foreground text-muted-foreground",
  Solved: "border-foreground bg-foreground text-background",
};

export const TYPE_COLOR = {
  "Missing Person": "#2563eb",
  "Homicide": "#8C271E",
  "Civil Rights": "#7c3aed",
};

export const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest ${STATUS_STYLE[status] || ""}`}>
    {status}
  </span>
);

export const CaseRow = ({ c }) => {
  const dot = TYPE_COLOR[c.case_type] || "#666";
  return (
    <Link
      to={`/cold-cases/${c.case_number}`}
      data-testid={`case-row-${c.case_number}`}
      className="group grid grid-cols-12 items-center gap-4 border-b border-border px-2 py-5 transition-colors hover:bg-muted"
    >
      <div className="col-span-12 flex items-center gap-3 md:col-span-4">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: dot }} />
        <div>
          <p className="font-heading text-xl font-medium leading-tight tracking-tight text-foreground transition-colors group-hover:text-accent">
            {c.name}
          </p>
          <p className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
            {c.case_number}
          </p>
        </div>
      </div>
      <div className="col-span-6 md:col-span-2">
        <p className="text-sm text-foreground">{c.case_type}</p>
      </div>
      <div className="col-span-6 md:col-span-3">
        <p className="text-sm text-muted-foreground">
          {c.city}, {c.state}
        </p>
      </div>
      <div className="col-span-6 md:col-span-2">
        <p className="font-mono text-xs text-muted-foreground">{c.date_reported}</p>
      </div>
      <div className="col-span-6 flex justify-end md:col-span-1">
        <StatusBadge status={c.status} />
      </div>
    </Link>
  );
};
