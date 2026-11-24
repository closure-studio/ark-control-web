import type { ReactNode } from "react";
import { cx } from "@/utils";

const TONE_VALUE_CLASSES = {
  neutral: "text-base-content",
  muted: "text-base-content/50",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  error: "text-error"
} as const;

type MetricProps = {
  icon?: ReactNode;
  label: string;
  value: number;
  detail: string;
  tone?: keyof typeof TONE_VALUE_CLASSES;
};

export function MetricContent({ icon, label, value, detail, tone = "neutral" }: MetricProps) {
  return (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="stat-title text-xs font-bold wrap-anywhere whitespace-normal text-muted">
          {label}
        </span>
        {icon ? <span className="shrink-0 text-muted">{icon}</span> : null}
      </span>
      <strong
        className={cx(
          "stat-value text-[1.75rem] leading-tight font-black wrap-anywhere whitespace-normal tabular-nums",
          TONE_VALUE_CLASSES[tone]
        )}
      >
        {value}
      </strong>
      <span className="stat-desc text-xs leading-4 wrap-anywhere whitespace-normal text-muted">
        {detail}
      </span>
    </>
  );
}

export function MetricCard(props: MetricProps) {
  return (
    <article className="flex min-w-0 flex-col gap-2.5 bg-base-100 p-5 sm:p-6">
      <MetricContent {...props} />
    </article>
  );
}
