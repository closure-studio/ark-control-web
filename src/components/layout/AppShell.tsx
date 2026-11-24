import {
  Gauge,
  KeyRound,
  LogOut,
  Menu,
  PackageCheck,
  Server,
  ShieldCheck,
  SquareTerminal
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cx } from "@/utils";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: Gauge },
  { path: "/vps", label: "VPS", icon: Server },
  { path: "/accounts", label: "Accounts", icon: KeyRound },
  { path: "/releases", label: "Releases", icon: PackageCheck }
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const current = navItems.find((item) => pathname.startsWith(item.path)) ?? navItems[0];

  return (
    <div className="drawer min-h-screen bg-base-200 lg:drawer-open">
      <input
        aria-label="Navigation drawer"
        checked={drawerOpen}
        className="drawer-toggle"
        id="navigation-drawer"
        onChange={(event) => setDrawerOpen(event.target.checked)}
        type="checkbox"
      />
      <div className="drawer-content flex min-h-screen min-w-0 flex-col">
        <a
          className="sr-only focus:not-sr-only focus:btn focus:absolute focus:left-3 focus:top-3 focus:z-50"
          href="#main-content"
        >
          Skip to content
        </a>
        <header className="app-topbar glass-chrome navbar sticky top-0 z-30 min-h-16 px-3 shadow-xs sm:px-5">
          <div className="navbar-start min-w-0 gap-2">
            <button
              aria-label="Open navigation"
              className="btn btn-square btn-ghost btn-sm lg:hidden"
              onClick={() => setDrawerOpen(true)}
              type="button"
            >
              <Menu aria-hidden="true" size={20} />
            </button>
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <div className="grid size-9 shrink-0 place-items-center rounded-field border border-base-content/25 bg-base-100 text-info shadow-2xs">
                <SquareTerminal aria-hidden="true" size={18} />
              </div>
              <span className="font-bold">Ark Control</span>
              <span className="hidden text-base-content/30 sm:inline">/</span>
              <span className="hidden truncate font-medium text-base-content/60 sm:inline">
                {current.label}
              </span>
            </div>
          </div>
          <div className="navbar-end">
            <div className="badge badge-success badge-outline h-8 gap-2 px-3 font-bold">
              <span className="status status-success status-xs" />
              Authorized
            </div>
          </div>
        </header>
        <main
          aria-label="Application content"
          className="min-w-0 flex-1 p-4 sm:p-5 lg:p-7"
          id="main-content"
        >
          <div className="mx-auto w-full max-w-[1480px]">{children}</div>
        </main>
      </div>

      <div className="drawer-side z-40">
        <label aria-label="Close navigation" className="drawer-overlay" htmlFor="navigation-drawer" />
        <aside className="flex min-h-full w-64 flex-col border-r border-neutral-content/15 bg-neutral text-neutral-content">
          <header className="flex h-16 min-h-16 items-center gap-3 border-b border-neutral-content/12 px-5">
            <div className="grid size-9 shrink-0 place-items-center rounded-field border border-base-content/25 bg-base-100 text-info shadow-2xs">
              <ShieldCheck aria-hidden="true" size={19} />
            </div>
            <strong className="truncate text-[0.9375rem] font-black leading-none">
              Ark Control
            </strong>
          </header>

          <nav aria-label="Primary navigation" className="grow overflow-y-auto p-3">
            <p className="mb-2 px-3 text-[0.65rem] font-bold uppercase text-neutral-content/55">
              Workspace
            </p>
            <ul className="menu menu-sm w-full gap-1 p-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li className="w-full" key={item.path}>
                    <NavLink
                      className={({ isActive }) =>
                        cx(
                          "min-h-10.5 w-full gap-2.5 rounded-field border text-[0.8125rem] font-bold transition-colors",
                          isActive
                            ? "border-info/55 bg-info/18 text-neutral-content shadow-[inset_3px_0_0_var(--color-info)]"
                            : "border-transparent text-neutral-content/85 hover:border-neutral-content/20 hover:bg-neutral-content/10 hover:text-neutral-content"
                        )
                      }
                      onClick={() => setDrawerOpen(false)}
                      to={item.path}
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cx(
                              "grid size-7.5 shrink-0 place-items-center rounded-field border bg-base-100",
                              isActive
                                ? "border-info/60 text-info"
                                : "border-base-content/25 text-base-content"
                            )}
                          >
                            <Icon aria-hidden="true" size={16} />
                          </span>
                          <span>{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-neutral-content/12 p-3">
            <button
              className="btn btn-ghost btn-sm w-full justify-start border-0 text-neutral-content/75 shadow-none hover:bg-neutral-content/10 hover:text-neutral-content"
              onClick={signOut}
              type="button"
            >
              <LogOut aria-hidden="true" size={17} />
              Sign out
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
