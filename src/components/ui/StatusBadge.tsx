import { cx } from "@/utils";

export const STATUS_BADGE_BASE_CLASS_NAME = "badge badge-sm badge-soft font-bold";

const STATUS_BADGE_CLASSES: ReadonlyMap<string, string> = new Map([
  ["enabled", "badge-success"],
  ["running", "badge-success"],
  ["succeeded", "badge-success"],
  ["success", "badge-success"],
  ["error", "badge-error"],
  ["failed", "badge-error"],
  ["timed_out", "badge-error"],
  ["pending", "badge-warning"],
  ["provisioning", "badge-warning"],
  ["staging", "badge-warning"],
  ["stopping", "badge-warning"],
  ["submitted", "badge-warning"],
  ["disabled", "badge-neutral"],
  ["skipped", "badge-neutral"],
  ["suspended", "badge-neutral"],
  ["terminated", "badge-neutral"]
]);

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const label = value ?? "Unknown";
  const tone = STATUS_BADGE_CLASSES.get(label.toLowerCase()) ?? "badge-ghost";
  return <span className={cx(STATUS_BADGE_BASE_CLASS_NAME, tone)}>{label}</span>;
}
