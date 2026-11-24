import { HOST_RUN_PRESENTATION } from "@/components/releases/releaseHelpers";
import { STATUS_BADGE_BASE_CLASS_NAME } from "@/components/ui/StatusBadge";
import type { HostRunStatus } from "@/types";
import { cx } from "@/utils";

export function HostRunBadge({ status }: { status: HostRunStatus }) {
  return (
    <span className={cx(STATUS_BADGE_BASE_CLASS_NAME, HOST_RUN_PRESENTATION[status].badgeClassName)}>
      {status}
    </span>
  );
}
