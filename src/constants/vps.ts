import type { VpsRole } from "@/types";

export const VPS_ROLE_ARKHOST: VpsRole = "arkhost";
export const VPS_ROLE_REDROID: VpsRole = "redroid";

export const VPS_ROLE_DETAILS: Record<VpsRole, { label: string; automation: string }> = {
  [VPS_ROLE_REDROID]: {
    label: "ReDroid",
    automation: "Include this host in APK delivery runs."
  },
  [VPS_ROLE_ARKHOST]: {
    label: "ArkHost",
    automation: "Include this host in maintenance pre-actions."
  }
};

export const VPS_ROLE_OPTIONS = [VPS_ROLE_REDROID, VPS_ROLE_ARKHOST] as const;
