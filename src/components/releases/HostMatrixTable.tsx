import { AlertTriangle, FileText } from "lucide-react";
import { HostRunBadge } from "@/components/releases/HostRunBadge";
import {
  ACTIVE_RUN_STATUSES,
  formatElapsedDuration
} from "@/components/releases/releaseHelpers";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { HostRun } from "@/types";
import { formatDateTime } from "@/utils";

export function HostMatrixTable({
  onInspect,
  onOpenLog,
  runs
}: {
  onInspect: (run: HostRun) => void;
  onOpenLog: (run: HostRun) => void;
  runs: HostRun[];
}) {
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="table table-sm min-w-[60rem]">
          <thead>
            <tr className="bg-base-200/70 text-[0.68rem] uppercase text-base-content/60">
              <th className="px-5 py-3">Host</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">AI review</th>
              <th className="px-5 py-3">Timing</th>
              <th className="px-5 py-3">Diagnostics</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-300">
            {runs.map((run) => {
              const elapsed = formatElapsedDuration(
                run.startedAt,
                run.lastCheckedAt ?? run.updatedAt
              );
              const isActive = ACTIVE_RUN_STATUSES.has(run.status);

              return (
                <tr className="transition-colors hover:bg-info/6" key={run.id}>
                  <td className="max-w-56 px-5 py-3.5 align-top">
                    <button
                      className="text-left hover:underline"
                      onClick={() => onInspect(run)}
                      type="button"
                    >
                      <strong className="block break-words text-sm">{run.hostName}</strong>
                    </button>
                    <span className="mt-0.5 block break-all font-mono text-xs text-base-content/55">
                      {run.hostIp}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 align-top">
                    <HostRunBadge status={run.status} />
                  </td>
                  <td className="max-w-72 px-5 py-3.5 align-top whitespace-normal">
                    <StatusBadge value={run.lastAiStatus} />
                    {run.lastAiReason ? (
                      <p className="mt-1.5 break-words text-xs leading-5 text-base-content/70">
                        {run.lastAiReason}
                      </p>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 align-top text-xs text-base-content/65">
                    <div className="grid gap-1">
                      <span>Checked {formatDateTime(run.lastCheckedAt)}</span>
                      {elapsed ? (
                        <span className="font-semibold tabular-nums text-base-content/80">
                          Elapsed {elapsed}
                        </span>
                      ) : null}
                      {isActive && run.nextCheckAt ? (
                        <span className="font-semibold text-info">
                          Next {formatDateTime(run.nextCheckAt)}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="max-w-64 px-5 py-3.5 align-top whitespace-normal text-xs">
                    {run.errorMessage ? (
                      <span className="flex items-start gap-1.5 font-medium text-error">
                        <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={13} />
                        <span className="break-words">{run.errorMessage}</span>
                      </span>
                    ) : (
                      <span className="text-base-content/45">No errors</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right align-top">
                    <button
                      className="btn btn-sm gap-1.5 bg-base-100"
                      onClick={() => onOpenLog(run)}
                      type="button"
                    >
                      <FileText aria-hidden="true" size={14} />
                      Log
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-base-300 lg:hidden">
        {runs.map((run) => (
          <article className="grid gap-2.5 p-4" key={run.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="break-words text-sm font-extrabold">{run.hostName}</h3>
                <p className="mt-0.5 break-all font-mono text-xs text-base-content/55">
                  {run.hostIp}
                </p>
              </div>
              <HostRunBadge status={run.status} />
            </div>
            {run.lastAiReason ? (
              <p className="break-words text-xs leading-5 text-base-content/75">
                {run.lastAiReason}
              </p>
            ) : null}
            {run.errorMessage ? (
              <p className="break-words text-xs font-medium text-error">{run.errorMessage}</p>
            ) : null}
            <div className="flex items-center justify-between gap-2 border-t border-base-300 pt-2.5 text-xs text-base-content/55">
              <span>{formatDateTime(run.lastCheckedAt)}</span>
              <button
                className="btn btn-sm gap-1.5 bg-base-100"
                onClick={() => onOpenLog(run)}
                type="button"
              >
                <FileText aria-hidden="true" size={14} />
                Log
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
