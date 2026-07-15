import { ArrowLeft, MapPinOff } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <MapPinOff aria-hidden="true" className="mx-auto text-base-content/45" size={42} />
        <h2 className="mt-4 text-2xl font-black">Page not found</h2>
        <Link className="btn btn-primary btn-sm mt-5" to="/dashboard"><ArrowLeft size={16} />Dashboard</Link>
      </div>
    </div>
  );
}
