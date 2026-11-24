import type { AccountInput, ProvisionVpsInput, VpsProvisioningModel } from "@/types";

export const COPY_FEEDBACK_DURATION_MS = 1_800;
export const EMPTY_COUNT = 0;
export const NEW_ACCOUNT_TARGET = "new";

const DEFAULT_GCP_ZONE = "us-central1-c";
export const COMMON_GCP_ZONES = [
  "us-central1-c",
  "us-west1-b",
  "asia-east1-b",
  "europe-west1-b"
] as const;

export const EMPTY_ACCOUNT_INPUT: AccountInput = {
  name: "",
  projectId: "",
  serviceAccountEmail: "",
  workloadIdentityProvider: "",
  defaultZone: DEFAULT_GCP_ZONE
};

export const PROVISION_MODEL_SPOT: VpsProvisioningModel = "SPOT";
export const PROVISION_MODEL_STANDARD: VpsProvisioningModel = "STANDARD";

const DEFAULT_VPS_CPU_COUNT = 6;
const DEFAULT_VPS_MEMORY_GB = 16;
const DEFAULT_VPS_DISK_SIZE_GB = 100;

export const MIN_VPS_CPU_COUNT = 1;
export const MAX_VPS_CPU_COUNT = 64;
const MIN_VPS_MEMORY_GB_PER_CPU = 2;
const MAX_VPS_MEMORY_GB_PER_CPU = 8;
export const MIN_VPS_DISK_SIZE_GB = 10;
export const MAX_VPS_DISK_SIZE_GB = 4096;
const MIB_PER_GB = 1024;

const CPU_PRESET_SMALL = 2;
const CPU_PRESET_MEDIUM = 4;
const CPU_PRESET_DEFAULT = 6;
const CPU_PRESET_LARGE = 8;
const CPU_PRESET_XLARGE = 16;

const MEMORY_PRESET_4GB = 4;
const MEMORY_PRESET_8GB = 8;
const MEMORY_PRESET_12GB = 12;
const MEMORY_PRESET_16GB = 16;
const MEMORY_PRESET_24GB = 24;
const MEMORY_PRESET_32GB = 32;
const MEMORY_PRESET_48GB = 48;
const MEMORY_PRESET_64GB = 64;

const DISK_PRESET_60GB = 60;
const DISK_PRESET_100GB = 100;
const DISK_PRESET_200GB = 200;
const DISK_PRESET_500GB = 500;

export const VPS_CPU_PRESETS = [
  CPU_PRESET_SMALL,
  CPU_PRESET_MEDIUM,
  CPU_PRESET_DEFAULT,
  CPU_PRESET_LARGE,
  CPU_PRESET_XLARGE
] as const;

export const VPS_MEMORY_PRESETS = [
  MEMORY_PRESET_4GB,
  MEMORY_PRESET_8GB,
  MEMORY_PRESET_12GB,
  MEMORY_PRESET_16GB,
  MEMORY_PRESET_24GB,
  MEMORY_PRESET_32GB,
  MEMORY_PRESET_48GB,
  MEMORY_PRESET_64GB
] as const;

export const VPS_DISK_PRESETS = [
  DISK_PRESET_60GB,
  DISK_PRESET_100GB,
  DISK_PRESET_200GB,
  DISK_PRESET_500GB
] as const;

export const DEFAULT_PROVISION_VPS_INPUT: ProvisionVpsInput = {
  cpuCount: DEFAULT_VPS_CPU_COUNT,
  memoryGb: DEFAULT_VPS_MEMORY_GB,
  provisioningModel: PROVISION_MODEL_SPOT,
  diskSizeGb: DEFAULT_VPS_DISK_SIZE_GB
};

export function memoryBoundsForCpu(cpuCount: number): { min: number; max: number } {
  const safeCpu = Math.min(MAX_VPS_CPU_COUNT, Math.max(MIN_VPS_CPU_COUNT, Math.trunc(cpuCount)));
  return {
    min: safeCpu * MIN_VPS_MEMORY_GB_PER_CPU,
    max: safeCpu * MAX_VPS_MEMORY_GB_PER_CPU
  };
}

export function clampMemoryForCpu(memoryGb: number, cpuCount: number): number {
  const { min, max } = memoryBoundsForCpu(cpuCount);
  if (!Number.isFinite(memoryGb)) return min;
  return Math.min(max, Math.max(min, Math.trunc(memoryGb)));
}

export function formatN4aMachineType(cpuCount: number, memoryGb: number): string {
  return `n4a-custom-${cpuCount}-${memoryGb * MIB_PER_GB}`;
}

export function isValidProvisionInput(input: ProvisionVpsInput): boolean {
  if (
    !Number.isInteger(input.cpuCount) ||
    input.cpuCount < MIN_VPS_CPU_COUNT ||
    input.cpuCount > MAX_VPS_CPU_COUNT
  ) {
    return false;
  }
  const { min, max } = memoryBoundsForCpu(input.cpuCount);
  if (!Number.isInteger(input.memoryGb) || input.memoryGb < min || input.memoryGb > max) {
    return false;
  }
  if (
    !Number.isInteger(input.diskSizeGb) ||
    input.diskSizeGb < MIN_VPS_DISK_SIZE_GB ||
    input.diskSizeGb > MAX_VPS_DISK_SIZE_GB
  ) {
    return false;
  }
  return true;
}

export function hasEmbeddedAdminToken(adminToken?: string): boolean {
  const trimmed = adminToken?.trim() ?? "";
  return trimmed !== "" && !/[\r\n]/u.test(trimmed);
}
