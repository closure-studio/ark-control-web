import type { ReactNode } from "react";

const TONE_ICON_CLASSES = {
  neutral: "border-info/35 bg-info/10 text-info",
  success: "border-success/40 bg-success/10 text-success",
  warning: "border-accent/45 bg-accent/10 text-accent",
  error: "border-error/40 bg-error/10 text-error"
} as const;

const TONE_VALUE_CLASSES = {
  neutral: "text-info",
  success: "text-success",
  warning: "text-accent",
  error: "text-error"
} as const;

export function MetricCard({
  icon,
  label,
  value,
  detail,
  tone = "neutral"
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "success" | "warning" | "error";
}) {
  return (
    <article className="min-w-0 border-base-300 even:border-l [&:nth-child(n+3)]:border-t">
      <div className="flex h-full flex-col gap-2.5 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-base-content/55">{label}</span>
          <span
            className={`grid size-8 shrink-0 place-items-center rounded-field border ${TONE_ICON_CLASSES[tone]}`}
          >
            {icon}
          </span>
        </div>
        <strong
          className={`break-words text-[1.75rem] font-black leading-tight tabular-nums ${TONE_VALUE_CLASSES[tone]}`}
        >
          {value}
        </strong>
        <span className="text-[0.7rem] leading-4 text-base-content/55 sm:text-xs">{detail}</span>
      </div>
    </article>
  );
}
