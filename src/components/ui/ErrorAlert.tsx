import { AlertTriangle } from "lucide-react";

export function ErrorAlert({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="alert alert-error alert-soft items-start" role="alert">
      <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
      <span className="min-w-0 grow break-words text-sm">{message}</span>
      {onRetry ? <button className="btn btn-error btn-sm" onClick={onRetry} type="button">Retry</button> : null}
    </div>
  );
}
