import { Code2, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ApiClient } from "@/api/client";
import { AccountCard } from "@/components/accounts/AccountCard";
import { AccountFormModal } from "@/components/accounts/AccountFormModal";
import { AccountsEmptyState } from "@/components/accounts/AccountsEmptyState";
import {
  EMPTY_COUNT,
  NEW_ACCOUNT_TARGET
} from "@/components/accounts/accountHelpers";
import { CloudShellModal } from "@/components/accounts/CloudShellModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import type { AccountInput, GcpAccount } from "@/types";
import { messageForError } from "@/utils";

type NoticeState = { tone: "success" | "error" | "info"; text: string };
type AccountFormTarget = GcpAccount | typeof NEW_ACCOUNT_TARGET | null;

export function AccountsPage({
  adminToken,
  api
}: {
  adminToken?: string;
  api: ApiClient;
}) {
  const [accounts, setAccounts] = useState<GcpAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [formTarget, setFormTarget] = useState<AccountFormTarget>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<number>>(() => new Set());
  const [deleteTarget, setDeleteTarget] = useState<GcpAccount | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [showScript, setShowScript] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.listAccounts();
      setAccounts(response.accounts);
      setError(null);
    } catch (loadError) {
      setError(messageForError(loadError, "Unable to load GCP accounts."));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  function setBusy(id: number, value: boolean) {
    setBusyIds((current) => {
      const next = new Set(current);
      if (value) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  async function save(input: AccountInput) {
    setFormBusy(true);
    setNotice(null);
    try {
      if (formTarget === NEW_ACCOUNT_TARGET) {
        await api.createAccount(input);
        setNotice({ tone: "success", text: `${input.name} was added.` });
      } else if (formTarget) {
        await api.updateAccount(formTarget.id, input);
        setNotice({ tone: "success", text: `${input.name} was updated.` });
      }
      setFormTarget(null);
      await load();
    } catch (saveError) {
      setNotice({
        tone: "error",
        text: messageForError(saveError, "Unable to save account.")
      });
    } finally {
      setFormBusy(false);
    }
  }

  async function toggle(account: GcpAccount, enabled: boolean) {
    setBusy(account.id, true);
    try {
      await api.updateAccount(account.id, { enabled });
      await load();
    } catch (toggleError) {
      setNotice({
        tone: "error",
        text: messageForError(toggleError, "Unable to update account.")
      });
    } finally {
      setBusy(account.id, false);
    }
  }

  async function provision(account: GcpAccount) {
    setBusy(account.id, true);
    setNotice({ tone: "info", text: `Creating a VPS in ${account.name}.` });
    try {
      const result = await api.provisionVps(account.id);
      setNotice({
        tone: "success",
        text: `${result.vps.name} was created as a ReDroid host.`
      });
    } catch (provisionError) {
      setNotice({
        tone: "error",
        text: messageForError(provisionError, "Unable to create GCP VPS.")
      });
    } finally {
      setBusy(account.id, false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await api.deleteAccount(deleteTarget.id);
      setNotice({ tone: "success", text: `${deleteTarget.name} was deleted.` });
      setDeleteTarget(null);
      await load();
    } catch (deleteError) {
      setNotice({
        tone: "error",
        text: messageForError(
          deleteError,
          `Unable to delete ${deleteTarget.name}.`
        )
      });
    } finally {
      setDeleteBusy(false);
    }
  }

  const editingAccount =
    formTarget === null || formTarget === NEW_ACCOUNT_TARGET ? null : formTarget;
  const formKey =
    formTarget === NEW_ACCOUNT_TARGET ? NEW_ACCOUNT_TARGET : (editingAccount?.id ?? NEW_ACCOUNT_TARGET);

  return (
    <div className="accounts-page min-w-0">
      <PageHeader
        actions={
          <>
            <RefreshButton loading={loading} onClick={() => void load()} />
            <button
              className="btn btn-sm gap-1.5"
              onClick={() => setShowScript(true)}
              type="button"
            >
              <Code2 aria-hidden="true" size={16} />
              Cloud setup
            </button>
            <button
              className="btn btn-primary btn-sm gap-1.5"
              onClick={() => setFormTarget(NEW_ACCOUNT_TARGET)}
              type="button"
            >
              <Plus aria-hidden="true" size={16} />
              Add account
            </button>
          </>
        }
        description="Workload Identity Federation credentials, default compute zones, and one-click ReDroid VPS provisioning."
        eyebrow="Cloud access"
        title="GCP Accounts"
      />

      <div className="grid gap-5">
        {notice ? (
          <Notice onClose={() => setNotice(null)} tone={notice.tone}>
            {notice.text}
          </Notice>
        ) : null}
        {error ? <ErrorAlert message={error} onRetry={() => void load()} /> : null}
        {loading && accounts.length === EMPTY_COUNT ? (
          <LoadingBlock label="Loading GCP accounts" />
        ) : null}

        {!loading && accounts.length === EMPTY_COUNT ? (
          <AccountsEmptyState
            onAddManual={() => setFormTarget(NEW_ACCOUNT_TARGET)}
            onOpenCloudSetup={() => setShowScript(true)}
          />
        ) : null}

        {accounts.length > EMPTY_COUNT ? (
          <section
            aria-label="GCP account list"
            className="grid gap-5 md:grid-cols-2"
          >
            {accounts.map((account) => (
              <AccountCard
                account={account}
                busy={busyIds.has(account.id)}
                key={account.id}
                onDelete={() => setDeleteTarget(account)}
                onEdit={() => setFormTarget(account)}
                onProvision={() => void provision(account)}
                onToggle={(enabled) => void toggle(account, enabled)}
              />
            ))}
          </section>
        ) : null}
      </div>

      <AccountFormModal
        account={editingAccount}
        busy={formBusy}
        formKey={formKey}
        onClose={() => setFormTarget(null)}
        onSubmit={(input) => void save(input)}
        open={formTarget !== null}
      />

      <CloudShellModal
        adminToken={adminToken}
        onClose={() => setShowScript(false)}
        open={showScript}
      />

      <ConfirmDialog
        busy={deleteBusy}
        confirmation={deleteTarget?.name ?? ""}
        detail={
          <>
            <p>This removes only the stored account configuration.</p>
            <p className="mt-2">
              GCP instances and standalone SSH hosts are not deleted.
            </p>
          </>
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        open={deleteTarget !== null}
        title={`Delete ${deleteTarget?.name ?? "account"}`}
      />
    </div>
  );
}
