import { KeyRound, ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { useAuth } from "@/contexts/AuthContext";

export function LoginPage() {
  const [token, setToken] = useState("");
  const { signIn } = useAuth();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    signIn(token);
  }

  return (
    <main className="tactical-grid grid min-h-screen place-items-center bg-base-200 p-4">
      <Panel aria-labelledby="login-title" className="flex w-full max-w-sm flex-col gap-6 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="ark-brand-mark">
            <ShieldCheck aria-hidden="true" size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Ark Control</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight" id="login-title">
              Administrator access
            </h1>
          </div>
        </div>
        <form className="grid gap-4" onSubmit={submit}>
          <fieldset className="fieldset gap-2 p-0">
            <label className="label p-0 text-xs font-semibold text-base-content" htmlFor="admin-token">
              Admin token
            </label>
            <label className="input input-primary w-full">
              <KeyRound aria-hidden="true" className="shrink-0 text-muted" size={17} />
              <input
                autoComplete="current-password"
                autoFocus
                className="min-w-0 grow"
                id="admin-token"
                onChange={(event) => setToken(event.target.value)}
                type="password"
                value={token}
              />
            </label>
          </fieldset>
          <button className="btn btn-primary w-full" disabled={!token.trim()} type="submit">
            Sign in
          </button>
        </form>
      </Panel>
    </main>
  );
}
