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
    <article className="dashboard-metric min-w-0">
      <div className="flex h-full flex-col gap-2.5 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-base-content/55">{label}</span>
          <span className={`grid size-8 shrink-0 place-items-center rounded border ${toneClass}`}>{icon}</span>
        </div>
        <strong className={`break-words text-[1.75rem] font-black leading-tight ${valueClass}`}>{value}</strong>
        <span className="text-[0.7rem] leading-4 text-base-content/50 sm:text-xs">{detail}</span>
      </div>
    </article>
  );
}
