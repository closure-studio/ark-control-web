import { MapPin, ServerCog } from "lucide-react";
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
import { ModalFormActions } from "@/components/ui/ModalFormActions";
import { PresetButton } from "@/components/ui/PresetButton";
import type { GcpAccount, ProvisionVpsInput, VpsProvisioningModel } from "@/types";

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
          <label className="fieldset gap-1.5 p-0">
            <span className="label p-0 text-xs font-bold text-base-content">CPU cores (vCPU)</span>
            <input
              className="input w-full text-sm tabular-nums"
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
            {VPS_CPU_PRESETS.map((cores) => (
              <PresetButton
                aria-label={`${cores} vCPU`}
                disabled={busy}
                key={cores}
                onClick={() => setCpuCount(cores)}
                pressed={form.cpuCount === cores}
              >
                {cores}C
              </PresetButton>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <label className="fieldset gap-1.5 p-0">
            <span className="label p-0 text-xs font-bold text-base-content">Memory (GB)</span>
            <input
              className="input w-full text-sm tabular-nums"
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
            {validMemoryPresets.map((gb) => (
              <PresetButton
                disabled={busy}
                key={gb}
                onClick={() => setForm((current) => ({ ...current, memoryGb: gb }))}
                pressed={form.memoryGb === gb}
              >
                {gb} GB
              </PresetButton>
            ))}
          </div>
          <span className="text-xs tabular-nums text-muted">
            Range for {form.cpuCount} vCPU: {memoryBounds.min}–{memoryBounds.max} GB
          </span>
        </div>
      </div>

      <div className="grid gap-2 border-t border-base-300 pt-5">
        <label className="fieldset gap-1.5 p-0">
          <span className="label p-0 text-xs font-bold text-base-content">Boot disk size (GB)</span>
          <input
            className="input w-full text-sm tabular-nums"
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
            {VPS_DISK_PRESETS.map((sizeGb) => (
              <PresetButton
                disabled={busy}
                key={sizeGb}
                onClick={() => setForm((current) => ({ ...current, diskSizeGb: sizeGb }))}
                pressed={form.diskSizeGb === sizeGb}
              >
                {sizeGb} GB
              </PresetButton>
            ))}
          </div>
          <span className="text-xs text-muted">
            Hyperdisk Balanced · Ubuntu 22.04 ARM64
          </span>
        </div>
      </div>

      <div
        aria-labelledby="vm-provisioning-model-label"
        className="grid gap-2.5 border-t border-base-300 pt-5"
        role="group"
      >
        <span className="text-xs font-bold text-base-content" id="vm-provisioning-model-label">
          VM provisioning model
        </span>
        <div className="grid gap-3 sm:grid-cols-2">
          {PROVISION_MODEL_OPTIONS.map((option) => (
            <PresetButton
              className="h-auto w-full min-w-0 flex-col items-start gap-1 p-3.5 text-left whitespace-normal"
              disabled={busy}
              key={option.value}
              onClick={() =>
                setForm((current) => ({ ...current, provisioningModel: option.value }))
              }
              pressed={form.provisioningModel === option.value}
            >
              <span className="text-sm font-bold">{option.title}</span>
              <span className="text-xs leading-5 text-muted">{option.description}</span>
            </PresetButton>
          ))}
        </div>
      </div>

      <ModalFormActions
        busy={busy}
        disabled={!valid}
        idleIcon={<ServerCog aria-hidden="true" size={16} />}
        onCancel={onCancel}
      >
        Create VPS
      </ModalFormActions>
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
    <FormModal busy={busy} kind="form" onClose={onClose} open={account !== null} title="Create VPS">
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
