import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getInsight } from "@/mock/insights";

const ACCENT = "#8C271E"; // dignified crimson
const NEUTRAL = "#9a948c"; // muted contrast

const compact = (n) => {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return `${n}`;
};

const fullNum = (n) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 1 });

const ChartTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload || !payload.length) return null;
  const v = payload[0].value;
  return (
    <div className="wm border border-border bg-card px-3 py-2 text-[12px] shadow-md">
      <div className="font-mono text-muted-foreground">{label}</div>
      <div className="font-bold text-foreground">
        {unit === "$" ? "$" : ""}
        {fullNum(v)}
        {unit && unit !== "$" ? ` ${unit}` : ""}
      </div>
    </div>
  );
};

export const SpotlightDialog = ({ open, onOpenChange, slug, fallbackTitle }) => {
  const insight = getInsight(slug);
  if (!insight) return null;

  const unit = (insight.history && insight.history.unit) ||
    (insight.comparison && insight.comparison.unit) || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="wm max-w-lg rounded-none border-border"
        data-testid={`spotlight-${slug}`}
      >
        <DialogHeader>
          <p className="overline text-accent">Disparity Spotlight</p>
          <DialogTitle className="wm text-left text-[22px] font-bold leading-tight text-foreground">
            {insight.title || fallbackTitle}
          </DialogTitle>
        </DialogHeader>

        <p className="wm text-[14px] leading-relaxed text-muted-foreground">
          {insight.summary}
        </p>

        {/* Historical trend */}
        {insight.history && (
          <div className="mt-2">
            <p className="overline mb-2 text-muted-foreground">
              {insight.history.label}
            </p>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={insight.history.data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#777", fontFamily: "JetBrains Mono" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={compact}
                    tick={{ fontSize: 11, fill: "#777", fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                    width={42}
                  />
                  <Tooltip content={<ChartTooltip unit={insight.history.unit} />} cursor={{ stroke: ACCENT, strokeDasharray: "3 3" }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={ACCENT}
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: ACCENT }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Comparison */}
        {insight.comparison && (
          <div className="mt-2">
            <p className="overline mb-2 text-muted-foreground">
              {insight.comparison.label}
            </p>
            <div
              className="w-full"
              style={{ height: insight.comparison.rows.length * 46 + 24 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={insight.comparison.rows}
                  margin={{ top: 4, right: 56, left: 4, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={150}
                    tick={{ fontSize: 12, fill: "hsl(var(--foreground))", fontFamily: "Noto Sans" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip unit={insight.comparison.unit} />} cursor={{ fill: "hsl(var(--muted))" }} />
                  <Bar dataKey="value" barSize={22} label={{
                    position: "right",
                    formatter: (v) => `${insight.comparison.unit === "$" ? "$" : ""}${fullNum(v)}${insight.comparison.unit && insight.comparison.unit !== "$" ? insight.comparison.unit : ""}`,
                    fontSize: 12,
                    fill: "#444",
                    fontFamily: "JetBrains Mono",
                  }}>
                    {insight.comparison.rows.map((r, i) => (
                      <Cell key={i} fill={r.accent ? ACCENT : NEUTRAL} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <p className="wm mt-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
          Source: {insight.source}
        </p>
      </DialogContent>
    </Dialog>
  );
};
