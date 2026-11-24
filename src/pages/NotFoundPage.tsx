import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Panel } from "@/components/ui/Panel";

export function NotFoundPage() {
  return (
    <Panel className="mx-auto mt-8 max-w-sm px-6 py-10 text-center sm:mt-16">
      <h2 className="text-2xl font-semibold tracking-tight">Page not found</h2>
      <Link className="btn btn-outline btn-primary btn-sm mt-5" to="/dashboard">
        <ArrowLeft aria-hidden="true" size={16} />
        Dashboard
      </Link>
    </Panel>
  );
}
