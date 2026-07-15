import { cx } from "@/utils";

const ERROR_STATUSES: ReadonlySet<string> = new Set(["error", "failed", "timed_out"]);
const NEUTRAL_STATUSES: ReadonlySet<string> = new Set(["disabled", "skipped", "suspended", "terminated"]);
const SUCCESS_STATUSES: ReadonlySet<string> = new Set(["enabled", "running", "succeeded", "success"]);
const WARNING_STATUSES: ReadonlySet<string> = new Set(["pending", "provisioning", "staging", "stopping", "submitted"]);

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const status = (value ?? "unknown").toLowerCase();
  const tone =
    SUCCESS_STATUSES.has(status)
      ? "badge-success"
      : ERROR_STATUSES.has(status)
        ? "badge-error"
        : WARNING_STATUSES.has(status)
          ? "badge-warning"
          : NEUTRAL_STATUSES.has(status)
            ? "badge-neutral"
            : "badge-ghost";
  return <span className={cx("badge badge-sm badge-soft font-bold", tone)}>{value ?? "Unknown"}</span>;
}
