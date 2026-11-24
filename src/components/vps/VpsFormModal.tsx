import { type FormEvent, useState } from "react";
import { FormModal } from "@/components/ui/FormModal";
import { ModalFormActions } from "@/components/ui/ModalFormActions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  VPS_ROLE_DETAILS,
  VPS_ROLE_OPTIONS,
  VPS_ROLE_REDROID
} from "@/constants/vps";
import type { VpsFormInput, VpsResource } from "@/types";

const DEFAULT_SSH_PORT = 22;
const DEFAULT_SSH_USERNAME = "root";
const MAX_SSH_PORT = 65_535;
const MIN_SSH_PORT = 1;

function VpsForm({
  vps,
  busy,
  onCancel,
  onSubmit
}: {
  vps: VpsResource | null;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (input: VpsFormInput) => void;
}) {
  const [form, setForm] = useState({
    name: vps?.name ?? "",
    address: vps?.address ?? "",
    port: vps?.port ?? DEFAULT_SSH_PORT,
    username: vps?.username ?? DEFAULT_SSH_USERNAME,
    role: vps?.role ?? VPS_ROLE_REDROID,
    password: "",
    watcherEnabled: vps?.watcherEnabled ?? true
  });
  const field = (key: keyof typeof form, value: string | number | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      name: form.name,
      address: form.address,
      port: form.port,
      username: form.username,
      role: form.role,
      ...(form.password ? { password: form.password } : {}),
      watcherEnabled: form.watcherEnabled
    });
  }

  return (
    <form className="grid gap-5 p-5" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="fieldset gap-1.5 p-0">
          <span className="label p-0 text-xs font-bold text-base-content">Name</span>
          <input
            className="input w-full"
            onChange={(event) => field("name", event.target.value)}
            required
            value={form.name}
          />
        </label>
        <label className="fieldset gap-1.5 p-0">
          <span className="label p-0 text-xs font-bold text-base-content">Address</span>
          <input
            className="input w-full font-mono"
            onChange={(event) => field("address", event.target.value)}
            required
            value={form.address}
          />
        </label>
        <label className="fieldset gap-1.5 p-0">
          <span className="label p-0 text-xs font-bold text-base-content">SSH port</span>
          <input
            className="input w-full font-mono"
            max={MAX_SSH_PORT}
            min={MIN_SSH_PORT}
            onChange={(event) => field("port", Number(event.target.value))}
            required
            type="number"
            value={form.port}
          />
        </label>
        <label className="fieldset gap-1.5 p-0">
          <span className="label p-0 text-xs font-bold text-base-content">Username</span>
          <input
            className="input w-full"
            onChange={(event) => field("username", event.target.value)}
            required
            value={form.username}
          />
        </label>
        {vps === null ? (
          <label className="fieldset gap-1.5 p-0 sm:col-span-2">
            <span className="label p-0 text-xs font-bold text-base-content">Role</span>
            <select
              aria-label="VPS role"
              className="select w-full"
              onChange={(event) => field("role", event.target.value)}
              value={form.role}
            >
              {VPS_ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {VPS_ROLE_DETAILS[role].label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="grid gap-1.5 sm:col-span-2">
            <span className="text-xs font-bold text-base-content">Role</span>
            <div className="flex min-h-11 items-center rounded-field border border-base-300 bg-base-200/70 px-3">
              <StatusBadge value={VPS_ROLE_DETAILS[form.role].label} />
            </div>
          </div>
        )}
        <label className="fieldset gap-1.5 p-0 sm:col-span-2">
          <span className="label p-0 text-xs font-bold text-base-content">
            {vps ? "New password" : "Password"}
          </span>
          <input
            className="input w-full"
            onChange={(event) => field("password", event.target.value)}
            required={!vps}
            type="password"
            value={form.password}
          />
        </label>
      </div>
      <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-field border border-base-300 bg-base-200/50 px-3.5 py-2.5">
        <span>
          <strong className="block text-sm">Automation enabled</strong>
          <span className="text-xs text-muted">
            {VPS_ROLE_DETAILS[form.role].automation}
          </span>
        </span>
        <input
          checked={form.watcherEnabled}
          className="toggle toggle-success"
          onChange={(event) => field("watcherEnabled", event.target.checked)}
          type="checkbox"
        />
      </label>
      <ModalFormActions busy={busy} onCancel={onCancel}>Save</ModalFormActions>
    </form>
  );
}

export function VpsFormModal({
  busy,
  formKey,
  onClose,
  onSubmit,
  open,
  vps
}: {
  busy: boolean;
  formKey: string | number;
  onClose: () => void;
  onSubmit: (input: VpsFormInput) => void;
  open: boolean;
  vps: VpsResource | null;
}) {
  return (
    <FormModal busy={busy} kind="form" onClose={onClose} open={open} title={vps === null ? "Add VPS" : "Edit VPS"}>
      <VpsForm busy={busy} key={formKey} onCancel={onClose} onSubmit={onSubmit} vps={vps} />
    </FormModal>
  );
}
