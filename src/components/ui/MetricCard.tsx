import type { ReactNode } from "react";

export function MetricCard({ icon, label, value, detail, tone = "neutral" }: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "success" | "warning" | "error";
}) {
  const toneClass = {
    neutral: "border-info/40 bg-info/10 text-info",
    success: "border-success/45 bg-success/10 text-success",
    warning: "border-accent/50 bg-accent/10 text-accent",
    error: "border-error/45 bg-error/10 text-error"
  }[tone];
  const valueClass = {
    neutral: "text-info",
    success: "text-success",
    warning: "text-accent",
    error: "text-error"
  }[tone];
  return (
    <article className="metric-card card min-w-0 border border-base-300 bg-base-100">
      <div className="card-body gap-2.5 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-base-content/60 sm:text-sm">{label}</span>
          <span className={`grid size-9 shrink-0 place-items-center rounded border sm:size-10 ${toneClass}`}>{icon}</span>
        </div>
        <strong className={`break-words text-3xl font-black leading-tight ${valueClass}`}>{value}</strong>
        <span className="text-[0.7rem] leading-4 text-base-content/55 sm:text-xs">{detail}</span>
      </div>
    </article>
  );
}
