import { Navigate, Route, Routes } from "react-router-dom";
import type { ApiClient } from "@/api/client";
import { AccountsPage } from "@/pages/AccountsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ReleasesPage } from "@/pages/ReleasesPage";
import { VpsPage } from "@/pages/VpsPage";

export function AppRouter({ api }: { api: ApiClient }) {
  return (
    <Routes>
      <Route element={<Navigate replace to="/dashboard" />} path="/" />
      <Route element={<DashboardPage api={api} />} path="/dashboard" />
      <Route element={<VpsPage api={api} />} path="/vps" />
      <Route element={<AccountsPage api={api} />} path="/accounts" />
      <Route element={<ReleasesPage api={api} />} path="/releases" />
      <Route element={<NotFoundPage />} path="*" />
    </Routes>
  );
}
