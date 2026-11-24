import { RefreshCw } from "lucide-react";

export function RefreshButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      aria-label="Refresh"
      className="btn btn-square btn-sm border-base-content/20 bg-base-100 hover:bg-base-300/60"
      disabled={loading}
      onClick={onClick}
      title="Refresh"
      type="button"
    >
      <RefreshCw aria-hidden="true" className={loading ? "animate-spin" : undefined} size={16} />
    </button>
  );
}
