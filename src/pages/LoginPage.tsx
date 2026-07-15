import { KeyRound, ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
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
      <section className="card w-full max-w-sm border border-base-300 bg-base-100" aria-labelledby="login-title">
        <div className="card-body gap-6 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="brand-device device-icon">
              <ShieldCheck aria-hidden="true" size={23} />
            </div>
            <div>
              <p className="page-kicker m-0">Ark Control</p>
              <h1 className="mt-1 text-xl font-bold" id="login-title">Administrator access</h1>
            </div>
          </div>
          <form className="grid gap-4" onSubmit={submit}>
            <label className="form-control grid gap-2" htmlFor="admin-token">
              <span className="label-text text-xs font-semibold">Admin token</span>
              <label className="input input-bordered flex w-full items-center gap-2">
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
            </label>
            <button className="btn btn-primary w-full" disabled={!token.trim()} type="submit">
              Sign in
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
