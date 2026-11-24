import { Check, Copy, KeyRound, ShieldAlert, Terminal } from "lucide-react";
import { useMemo } from "react";
import { hasEmbeddedAdminToken } from "@/components/accounts/accountHelpers";
import { useCopyFeedback } from "@/components/accounts/useCopyFeedback";
import { FormModal } from "@/components/ui/FormModal";
import { buildCloudShellScript } from "@/constants/cloudShellScript";
import { cx } from "@/utils";

const COPY_KEY_SCRIPT = "cloudShellScript";
const SETUP_STEPS = [
  {
    step: "1",
    title: "Open Cloud Shell",
    detail: "Select the target GCP project in Google Cloud Console."
  },
  {
    step: "2",
    title: "Paste and execute",
    detail: "Configures IAM, OIDC Workload Identity, and registers via API."
  },
  {
    step: "3",
    title: "Refresh accounts",
    detail: "Return here and refresh to start provisioning ReDroid hosts."
  }
] as const;

export function CloudShellModal({
  adminToken,
  onClose,
  open
}: {
  adminToken?: string;
  onClose: () => void;
  open: boolean;
}) {
  const { copiedKey, copyText } = useCopyFeedback();
  const script = useMemo(() => buildCloudShellScript(adminToken), [adminToken]);
  const tokenEmbedded = hasEmbeddedAdminToken(adminToken);
  const copied = copiedKey === COPY_KEY_SCRIPT;

  return (
    <FormModal onClose={onClose} open={open} title="Cloud Shell setup" width="max-w-4xl">
      <div className="grid gap-4 p-5">
        <ol className="grid gap-2.5 sm:grid-cols-3">
          {SETUP_STEPS.map((item) => (
            <li
              className="rounded-lg border border-base-300 bg-base-200/70 p-3.5"
              key={item.step}
            >
              <div className="flex items-center gap-2">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-info/15 text-[0.7rem] font-black text-info">
                  {item.step}
                </span>
                <strong className="text-xs font-extrabold text-base-content">
                  {item.title}
                </strong>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-base-content/60">
                {item.detail}
              </p>
            </li>
          ))}
        </ol>

        <div
          className={cx(
            "flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-xs",
            tokenEmbedded
              ? "border-success/30 bg-success/10 text-base-content"
              : "border-warning/35 bg-warning/10 text-base-content"
          )}
        >
          <div className="flex items-center gap-2 font-semibold">
            {tokenEmbedded ? (
              <KeyRound aria-hidden="true" className="shrink-0 text-success" size={15} />
            ) : (
              <ShieldAlert aria-hidden="true" className="shrink-0 text-warning" size={15} />
            )}
            <span>
              {tokenEmbedded
                ? "Active session admin token is embedded for one-paste onboarding and unset on completion."
                : "No session token provided — the script will prompt interactively for your admin token."}
            </span>
          </div>
        </div>

        <div className="accounts-terminal overflow-hidden rounded-xl border border-base-content/20 bg-neutral text-neutral-content">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-content/75">
              <Terminal aria-hidden="true" className="text-info" size={14} />
              <span className="font-mono">cloud-shell-setup.sh</span>
            </div>
            <button
              className={cx(
                "btn btn-xs gap-1.5 border-white/20",
                copied
                  ? "bg-success text-success-content"
                  : "bg-white/10 text-neutral-content hover:bg-white/20"
              )}
              onClick={() => void copyText(COPY_KEY_SCRIPT, script)}
              type="button"
            >
              {copied ? <Check aria-hidden="true" size={14} /> : <Copy aria-hidden="true" size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="control-code control-scrollbar max-h-[55vh] overflow-auto p-4 text-xs leading-relaxed text-neutral-content">
            <code>{script}</code>
          </pre>
        </div>
      </div>
    </FormModal>
  );
}
