import {
  Gauge,
  KeyRound,
  LogOut,
  Menu,
  PackageCheck,
  Server,
  ShieldCheck
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
      <div className="drawer-content tactical-grid flex min-h-screen min-w-0 flex-col">
        <a
          className="sr-only focus:not-sr-only focus:btn focus:absolute focus:left-3 focus:top-3 focus:z-50"
          href="#main-content"
        >
          Skip to content
        </a>
        <header className="app-topbar glass-chrome navbar sticky top-0 z-30 min-h-16 px-3 sm:px-5">
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
              <span className="font-bold">Ark Control</span>
              <span className="hidden text-base-content/30 sm:inline">/</span>
              <span className="hidden truncate font-medium text-muted sm:inline">
                {current.label}
              </span>
            </div>
          </div>
          <div className="navbar-end">
            <div className="badge badge-outline">Authorized</div>
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
        <aside className="app-sidebar glass-chrome-dark flex min-h-full w-64 flex-col">
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-neutral-content/12 px-5">
            <div className="ark-brand-mark">
              <ShieldCheck aria-hidden="true" size={20} />
            </div>
            <strong className="text-base font-semibold">Ark Control</strong>
          </header>

          <nav aria-label="Primary navigation" className="grow overflow-y-auto p-3">
            <p className="mb-2 px-3 text-xs font-semibold uppercase text-neutral-content/65">
              Workspace
            </p>
            <ul className="menu w-full gap-1 p-0">
              {navItems.map(({ path, label, icon: Icon }) => (
                <li key={path}>
                  <NavLink
                    className={({ isActive }) =>
                      cx(
                        "min-h-11 content-center font-medium",
                        isActive && "menu-active underline underline-offset-4"
                      )
                    }
                    onClick={() => setDrawerOpen(false)}
                    to={path}
                  >
                    <Icon aria-hidden="true" className="opacity-75" size={16} />
                    <span>{label}</span>
                  </NavLink>
                </li>
              ))}
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
