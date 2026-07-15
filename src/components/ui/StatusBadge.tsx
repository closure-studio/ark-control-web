import { cx } from "@/utils";

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const status = (value ?? "unknown").toLowerCase();
  const tone =
    ["running", "succeeded", "success", "enabled"].includes(status)
      ? "badge-success"
      : ["failed", "timed_out", "error"].includes(status)
        ? "badge-error"
        : ["pending", "staging", "provisioning", "submitted", "stopping"].includes(status)
          ? "badge-warning"
          : ["terminated", "suspended", "disabled", "skipped"].includes(status)
            ? "badge-neutral"
            : "badge-ghost";
  return <span className={cx("badge badge-sm badge-soft font-bold", tone)}>{value ?? "Unknown"}</span>;
}
