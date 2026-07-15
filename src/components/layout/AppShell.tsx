import { Gauge, KeyRound, LogOut, Menu, PackageCheck, Server, ShieldCheck, SquareTerminal } from "lucide-react";
import { type ReactNode, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cx } from "@/utils";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: Gauge, eyebrow: "Control plane", title: "Operations Dashboard" },
  { path: "/vps", label: "VPS", icon: Server, eyebrow: "Infrastructure", title: "VPS Inventory" },
  { path: "/accounts", label: "Accounts", icon: KeyRound, eyebrow: "Cloud access", title: "GCP Accounts" },
  { path: "/releases", label: "Releases", icon: PackageCheck, eyebrow: "Verification", title: "Release Runs" }
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
        onChange={(event) => setDrawerOpen(event.target.checked)}
        type="checkbox"
      />
      <div className="drawer-content flex min-h-screen min-w-0 flex-col">
        <a className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:btn" href="#main-content">
          Skip to content
        </a>
        <header className="app-topbar navbar sticky top-0 z-30 min-h-16 border-b border-base-300 px-3 sm:px-5">
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
              <div className="device-icon">
                <SquareTerminal aria-hidden="true" size={18} />
              </div>
              <span className="font-bold">Ark Control</span>
              <span className="hidden text-base-content/30 sm:inline">/</span>
              <span className="hidden truncate font-medium text-base-content/60 sm:inline">{current.label}</span>
            </div>
          </div>
          <div className="navbar-end">
            <div className="badge badge-success badge-outline h-8 gap-2 px-3 font-bold">
              <span className="status status-success status-xs" />
              Authorized
            </div>
          </div>
        </header>
        <main aria-label="Application content" className="min-w-0 flex-1 p-4 sm:p-5 lg:p-7" id="main-content">
          <div className="mx-auto w-full max-w-[1480px]">{children}</div>
        </main>
      </div>

      <div className="drawer-side z-40">
        <button aria-label="Close navigation" className="drawer-overlay" onClick={() => setDrawerOpen(false)} type="button" />
        <aside className="app-sidebar flex min-h-full w-64 flex-col border-r">
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="brand-device device-icon">
                <ShieldCheck aria-hidden="true" size={21} />
              </div>
              <div className="min-w-0">
                <strong className="block truncate text-sm">Ark Control</strong>
                <p className="sidebar-muted mt-0.5 text-xs">Operator Console</p>
              </div>
            </div>
          </div>

          <nav aria-label="Primary navigation" className="grow overflow-y-auto p-3">
            <p className="sidebar-muted mb-2 px-3 text-[0.65rem] font-bold uppercase">Workspace</p>
            <ul className="menu menu-sm gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      className={({ isActive }) => cx(isActive && "active")}
                      onClick={() => setDrawerOpen(false)}
                      to={item.path}
                    >
                      <span className="nav-icon"><Icon aria-hidden="true" size={16} /></span>
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-white/10 p-3">
            <button className="sidebar-action btn btn-ghost btn-sm w-full justify-start border-0" onClick={signOut} type="button">
              <LogOut aria-hidden="true" size={17} />
              Sign out
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
