import { useEffect, useRef } from "react";
import type { ApiClient } from "@/api/client";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/pages/LoginPage";
import { AppRouter } from "@/routers/AppRouter";

export function App() {
  const { token, api } = useAuth();
  const reconciledApi = useRef<ApiClient | null>(null);

  useEffect(() => {
    if (!api) {
      reconciledApi.current = null;
      return;
    }
    if (reconciledApi.current === api) return;
    reconciledApi.current = api;
    void api.reconcileVps().catch(() => undefined);
  }, [api]);

  if (!token || !api) return <LoginPage />;

  return (
    <AppShell>
      <AppRouter api={api} />
    </AppShell>
  );
}
