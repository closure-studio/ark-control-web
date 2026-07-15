import type { HostRunStatus } from "@/types";

const statuses: Array<{ key: HostRunStatus; label: string; className: string }> = [
  { key: "succeeded", label: "Succeeded", className: "bg-success" },
  { key: "running", label: "Running", className: "bg-info" },
  { key: "pending", label: "Pending", className: "bg-warning" },
  { key: "failed", label: "Failed", className: "bg-error" },
  { key: "timed_out", label: "Timed out", className: "bg-neutral" }
];

export function StatusRail({ counts }: { counts: Partial<Record<HostRunStatus, number>> }) {
  const total = statuses.reduce((sum, item) => sum + (counts[item.key] ?? 0), 0);
  return (
    <div className="min-w-0">
      <div aria-label={`${total} host runs`} className="flex h-2.5 w-full overflow-hidden rounded bg-base-300" role="img">
        {total > 0
          ? statuses.map((item) => {
              const count = counts[item.key] ?? 0;
              return count > 0 ? (
                <span className={item.className} key={item.key} style={{ width: `${(count / total) * 100}%` }} />
              ) : null;
            })
          : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.68rem] text-base-content/60">
        {statuses.map((item) => (
          <span className="inline-flex items-center gap-1" key={item.key}>
            <span className={`size-2 rounded-sm ${item.className}`} />
            {item.label} {counts[item.key] ?? 0}
          </span>
        ))}
      </div>
    </div>
  );
}
