import { Check, Copy } from "lucide-react";
import { useMemo } from "react";
import { hasEmbeddedAdminToken } from "@/components/accounts/accountHelpers";
import { useCopyFeedback } from "@/components/accounts/useCopyFeedback";
import { FormModal } from "@/components/ui/FormModal";
import { TerminalFrame } from "@/components/ui/TerminalFrame";
import { buildCloudShellScript } from "@/constants/cloudShellScript";
import { cx } from "@/utils";

const COPY_KEY_SCRIPT = "cloudShellScript";
const SETUP_STEPS = [
  {
    step: "1.",
    title: "Open Cloud Shell",
    detail: "Select the target GCP project in Google Cloud Console."
  },
  {
    step: "2.",
    title: "Run the setup script",
    detail: "Configures IAM, OIDC Workload Identity, and registers via API."
  },
  {
    step: "3.",
    title: "Refresh accounts",
    detail: "Return here and refresh to provision ReDroid hosts."
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
    <FormModal kind="script" onClose={onClose} open={open} title="Cloud Shell setup">
      <div className="grid grid-cols-1 gap-5 p-5">
        <ol className="grid gap-4 border-b border-base-300 pb-4 sm:grid-cols-3">
          {SETUP_STEPS.map((item) => (
            <li className="grid gap-1" key={item.step}>
              <div className="flex items-baseline gap-1.5 text-xs font-bold text-base-content">
                <span className="tabular-nums text-info">{item.step}</span>
                <span>{item.title}</span>
              </div>
              <p className="text-xs leading-5 text-muted">{item.detail}</p>
            </li>
          ))}
        </ol>

        <p className="text-xs leading-5 text-base-content/70">
          <strong className="font-bold text-base-content">
            {tokenEmbedded ? "Session token embedded." : "Interactive token prompt."}
          </strong>{" "}
          {tokenEmbedded
            ? "Your active admin token is pre-filled and unset once registration completes."
            : "Cloud Shell will ask for your admin token before registering the project."}
        </p>

        <TerminalFrame
          actions={
            <button
              className={cx(
                "btn btn-xs shrink-0 gap-1.5",
                copied ? "btn-success" : "bg-base-100 text-base-content"
              )}
              onClick={() => void copyText(COPY_KEY_SCRIPT, script)}
              type="button"
            >
              {copied ? (
                <><Check aria-hidden="true" size={14} />Copied</>
              ) : (
                <><Copy aria-hidden="true" size={14} />Copy</>
              )}
            </button>
          }
          title="cloud-shell-setup.sh"
          viewportClassName="max-h-72"
        >
          <pre className="whitespace-pre [tab-size:2]"><code>{script}</code></pre>
        </TerminalFrame>
      </div>
    </FormModal>
  );
}
