import { RefreshCw } from "lucide-react";

export function RefreshButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button className="btn btn-sm" disabled={loading} onClick={onClick} type="button">
      <RefreshCw aria-hidden="true" className={loading ? "animate-spin" : undefined} size={16} />
      Refresh
    </button>
  );
}
