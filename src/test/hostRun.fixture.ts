import type { HostRun } from "@/types";

const RUNNING_HOST_RUN_ID = 81;
const RELEASE_ID = 41;

export const runningHostRun: HostRun = {
  id: RUNNING_HOST_RUN_ID,
  releaseId: RELEASE_ID,
  hostId: 1,
  hostName: "ark-vps-production-primary",
  hostIp: "34.120.10.20",
  status: "running",
  startedAt: "2026-07-14T11:20:00.000Z",
  nextCheckAt: "2026-07-14T11:30:00.000Z",
  deadlineAt: "2026-07-14T12:20:00.000Z",
  lastCheckedAt: "2026-07-14T11:25:00.000Z",
  lastAiStatus: "running",
  lastAiReason: "The helper is still processing the latest APK deployment.",
  errorMessage: null,
  createdAt: "2026-07-14T11:20:00.000Z",
  updatedAt: "2026-07-14T11:25:00.000Z"
};
