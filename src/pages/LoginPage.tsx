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
    <main className="grid min-h-screen place-items-center bg-base-200 p-4">
      <Panel aria-labelledby="login-title" className="w-full max-w-sm">
        <div className="flex flex-col gap-6 p-6 text-sm sm:p-8">
          <div className="flex items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-field border border-base-content/25 bg-base-200/50 text-info shadow-2xs">
              <ShieldCheck aria-hidden="true" size={23} />
            </div>
            <div>
              <p className="m-0 text-[0.6875rem] font-black uppercase leading-tight text-info">
                Ark Control
              </p>
              <h1 className="mt-1 text-xl font-black" id="login-title">
                Administrator access
              </h1>
            </div>
          </div>
          <form className="grid gap-4" onSubmit={submit}>
            <fieldset className="fieldset gap-2 p-0">
              <label className="label p-0 text-xs font-semibold text-base-content/80" htmlFor="admin-token">
                Admin token
              </label>
              <label className="input flex w-full items-center gap-2">
                <KeyRound aria-hidden="true" className="shrink-0 text-base-content/55" size={17} />
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
        </div>
      </Panel>
    </main>
  );
}
