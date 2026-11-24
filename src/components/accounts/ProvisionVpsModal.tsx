import { LoaderCircle, MapPin, ServerCog } from "lucide-react";
import { type FormEvent, useState } from "react";
import {
  clampMemoryForCpu,
  DEFAULT_PROVISION_VPS_INPUT,
  formatN4aMachineType,
  isValidProvisionInput,
  MAX_VPS_CPU_COUNT,
  MAX_VPS_DISK_SIZE_GB,
  memoryBoundsForCpu,
  MIN_VPS_CPU_COUNT,
  MIN_VPS_DISK_SIZE_GB,
  PROVISION_MODEL_SPOT,
  PROVISION_MODEL_STANDARD,
  VPS_CPU_PRESETS,
  VPS_DISK_PRESETS,
  VPS_MEMORY_PRESETS
} from "@/components/accounts/accountHelpers";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { FormModal } from "@/components/ui/FormModal";
import type { GcpAccount, ProvisionVpsInput, VpsProvisioningModel } from "@/types";
import { cx } from "@/utils";

const PROVISION_MODEL_OPTIONS: ReadonlyArray<{
  value: VpsProvisioningModel;
  title: string;
  description: string;
}> = [
  {
    value: PROVISION_MODEL_SPOT,
    title: "Spot VM",
    description: "Lower hourly cost. Compute Engine may stop the VM when capacity is reclaimed."
  },
  {
    value: PROVISION_MODEL_STANDARD,
    title: "Standard",
    description: "Always-on capacity with automatic restart and live host migration."
  }
];

function ProvisionVpsFormContent({
  account,
  busy,
  error,
  onCancel,
  onSubmit
}: {
  account: GcpAccount;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (input: ProvisionVpsInput) => void;
}) {
  const [form, setForm] = useState<ProvisionVpsInput>(() => ({
    ...DEFAULT_PROVISION_VPS_INPUT
  }));

  const memoryBounds = memoryBoundsForCpu(form.cpuCount);
  const validMemoryPresets = VPS_MEMORY_PRESETS.filter(
    (gb) => gb >= memoryBounds.min && gb <= memoryBounds.max
  );
  const valid = isValidProvisionInput(form);
  const machinePreview = formatN4aMachineType(
    Number.isFinite(form.cpuCount)
      ? Math.max(MIN_VPS_CPU_COUNT, Math.trunc(form.cpuCount))
      : MIN_VPS_CPU_COUNT,
    Number.isFinite(form.memoryGb)
      ? Math.max(memoryBounds.min, Math.trunc(form.memoryGb))
      : memoryBounds.min
  );

  function setCpuCount(cpuCount: number) {
    setForm((current) => ({
      ...current,
      cpuCount,
      memoryGb: Number.isFinite(cpuCount)
        ? clampMemoryForCpu(current.memoryGb, cpuCount)
        : current.memoryGb
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid) return;
    onSubmit(form);
  }

  return (
    <form className="grid gap-6 p-5" onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-base-300 pb-3.5 text-xs">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
          <strong className="truncate font-bold text-base-content">{account.name}</strong>
          <span aria-hidden="true" className="text-base-content/30">
            ·
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-base-content/65">
            <MapPin aria-hidden="true" size={12} />
            {account.defaultZone}
          </span>
        </div>
        <code className="rounded border border-base-300 bg-base-200 px-2 py-0.5 text-xs font-semibold text-base-content">
          {machinePreview}
        </code>
      </div>

      {error ? <ErrorAlert message={error} /> : null}

      <div className="grid items-start gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="form-control grid gap-1.5">
            <span className="label-text text-xs font-bold">CPU cores (vCPU)</span>
            <input
              className="input input-bordered w-full tabular-nums text-sm"
              disabled={busy}
              max={MAX_VPS_CPU_COUNT}
              min={MIN_VPS_CPU_COUNT}
              onChange={(event) => setCpuCount(Number(event.target.value))}
              required
              type="number"
              value={form.cpuCount}
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {VPS_CPU_PRESETS.map((cores) => {
              const selected = form.cpuCount === cores;
              return (
                <button
                  aria-label={`${cores} vCPU`}
                  className={cx(
                    "accounts-preset-chip rounded border px-2 py-1 tabular-nums transition-colors duration-150",
                    selected
                      ? "border-info bg-base-100 text-info"
                      : "border-base-300 bg-base-200/70 text-base-content/75 hover:border-base-content/40 hover:text-base-content"
                  )}
                  disabled={busy}
                  key={cores}
                  onClick={() => setCpuCount(cores)}
                  type="button"
                >
                  {cores}C
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2">
          <label className="form-control grid gap-1.5">
            <span className="label-text text-xs font-bold">Memory (GB)</span>
            <input
              className="input input-bordered w-full tabular-nums text-sm"
              disabled={busy}
              max={memoryBounds.max}
              min={memoryBounds.min}
              onChange={(event) =>
                setForm((current) => ({ ...current, memoryGb: Number(event.target.value) }))
              }
              required
              type="number"
              value={form.memoryGb}
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {validMemoryPresets.map((gb) => {
              const selected = form.memoryGb === gb;
              return (
                <button
                  className={cx(
                    "accounts-preset-chip rounded border px-2 py-1 tabular-nums transition-colors duration-150",
                    selected
                      ? "border-info bg-base-100 text-info"
                      : "border-base-300 bg-base-200/70 text-base-content/75 hover:border-base-content/40 hover:text-base-content"
                  )}
                  disabled={busy}
                  key={gb}
                  onClick={() => setForm((current) => ({ ...current, memoryGb: gb }))}
                  type="button"
                >
                  {gb} GB
                </button>
              );
            })}
          </div>
          <span className="text-xs tabular-nums text-base-content/55">
            Range for {form.cpuCount} vCPU: {memoryBounds.min}–{memoryBounds.max} GB
          </span>
        </div>
      </div>

      <div className="grid gap-2 border-t border-base-300 pt-5">
        <label className="form-control grid gap-1.5">
          <span className="label-text text-xs font-bold">Boot disk size (GB)</span>
          <input
            className="input input-bordered w-full tabular-nums text-sm"
            disabled={busy}
            max={MAX_VPS_DISK_SIZE_GB}
            min={MIN_VPS_DISK_SIZE_GB}
            onChange={(event) =>
              setForm((current) => ({ ...current, diskSizeGb: Number(event.target.value) }))
            }
            required
            type="number"
            value={form.diskSizeGb}
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {VPS_DISK_PRESETS.map((sizeGb) => {
              const selected = form.diskSizeGb === sizeGb;
              return (
                <button
                  className={cx(
                    "accounts-preset-chip rounded border px-2 py-1 tabular-nums transition-colors duration-150",
                    selected
                      ? "border-info bg-base-100 text-info"
                      : "border-base-300 bg-base-200/70 text-base-content/75 hover:border-base-content/40 hover:text-base-content"
                  )}
                  disabled={busy}
                  key={sizeGb}
                  onClick={() => setForm((current) => ({ ...current, diskSizeGb: sizeGb }))}
                  type="button"
                >
                  {sizeGb} GB
                </button>
              );
            })}
          </div>
          <span className="text-xs text-base-content/55">
            Hyperdisk Balanced · Ubuntu 22.04 ARM64
          </span>
        </div>
      </div>

      <div
        aria-labelledby="vm-provisioning-model-label"
        className="grid gap-2.5 border-t border-base-300 pt-5"
        role="group"
      >
        <span className="label-text text-xs font-bold" id="vm-provisioning-model-label">
          VM provisioning model
        </span>
        <div className="grid gap-3 sm:grid-cols-2">
          {PROVISION_MODEL_OPTIONS.map((option) => {
            const selected = form.provisioningModel === option.value;
            return (
              <button
                aria-pressed={selected}
                className={cx(
                  "accounts-model-card flex flex-col items-start gap-1 rounded-md border p-3.5 text-left transition-colors duration-150",
                  selected
                    ? "accounts-model-card-active border-info bg-base-200/60"
                    : "border-base-300 bg-base-100 hover:border-base-content/35"
                )}
                disabled={busy}
                key={option.value}
                onClick={() =>
                  setForm((current) => ({ ...current, provisioningModel: option.value }))
                }
                type="button"
              >
                <span className="text-sm font-bold text-base-content">{option.title}</span>
                <span className="text-xs leading-5 text-base-content/60">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-base-300 pt-4">
        <button className="btn" disabled={busy} onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="btn btn-primary gap-2" disabled={busy || !valid} type="submit">
          {busy ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />
          ) : (
            <ServerCog aria-hidden="true" size={16} />
          )}
          Create VPS
        </button>
      </div>
    </form>
  );
}

export function ProvisionVpsModal({
  account,
  busy,
  error,
  onClose,
  onSubmit
}: {
  account: GcpAccount | null;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: ProvisionVpsInput) => void;
}) {
  return (
    <FormModal onClose={busy ? () => undefined : onClose} open={account !== null} title="Create VPS">
      {account ? (
        <ProvisionVpsFormContent
          account={account}
          busy={busy}
          error={error}
          key={account.id}
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      ) : null}
    </FormModal>
  );
}
