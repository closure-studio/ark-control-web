import { cx } from "@/utils";

export const STATUS_BADGE_BASE_CLASS_NAME = "badge badge-sm badge-soft font-bold";

export const BADGE_TONE_CLASSES = {
  success: "badge-success",
  info: "badge-info",
  warning: "badge-warning",
  error: "badge-error",
  neutral: "badge-neutral",
  ghost: "badge-ghost"
} as const;

const STATUS_BADGE_TONES: ReadonlyMap<string, keyof typeof BADGE_TONE_CLASSES> = new Map([
  ["enabled", "success"],
  ["running", "success"],
  ["succeeded", "success"],
  ["success", "success"],
  ["error", "error"],
  ["failed", "error"],
  ["timed_out", "error"],
  ["pending", "warning"],
  ["provisioning", "warning"],
  ["staging", "warning"],
  ["stopping", "warning"],
  ["submitted", "warning"],
  ["disabled", "neutral"],
  ["skipped", "neutral"],
  ["suspended", "neutral"],
  ["terminated", "neutral"]
]);

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const label = value ?? "Unknown";
  const tone = STATUS_BADGE_TONES.get(label.toLowerCase()) ?? "ghost";
  return <span className={cx(STATUS_BADGE_BASE_CLASS_NAME, BADGE_TONE_CLASSES[tone])}>{label}</span>;
}
