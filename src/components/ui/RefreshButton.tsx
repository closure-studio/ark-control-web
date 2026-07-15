import { RefreshCw } from "lucide-react";

export function RefreshButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button aria-label="Refresh" className="btn btn-square btn-sm" disabled={loading} onClick={onClick} title="Refresh" type="button">
      <RefreshCw aria-hidden="true" className={loading ? "animate-spin" : undefined} size={16} />
    </button>
  );
}
