import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/pages/LoginPage";
import { AppRouter } from "@/routers/AppRouter";

export function App() {
  const { token, api } = useAuth();

  if (!token || !api) return <LoginPage />;

  return (
    <AppShell>
      <AppRouter api={api} />
    </AppShell>
  );
}
