// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/App";
import { AuthProvider } from "@/contexts/AuthContext";

const dashboard = {
  generatedAt: "2026-07-14T00:00:00.000Z",
  summary: {
    accounts: { total: 0, enabled: 0 },
    vps: { total: 0, gcp: 0, manual: 0, running: 0, stopped: 0, unavailable: 0, watcherEnabled: 0 },
    watcher: {
      lastProcessedApkFilename: null,
      lastSuccessfulCheckAt: null,
      lastCheckError: null,
      hasNonTerminalHostRuns: false,
      nonTerminalHostRunCount: 0
    }
  },
  recentReleases: [],
  recentOperations: [],
  errors: []
};

describe("unified application authentication", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value)
    });
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input);
      const body = path.includes("/api/vps/reconcile")
        ? { linked: [], conflicts: [], errors: [] }
        : dashboard;
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it("stores the admin token and opens the single dashboard", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AuthProvider><App /></AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Admin token"), { target: { value: "secret-token" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument());
    expect(localStorage.getItem("ark-control-admin-token")).toBe("secret-token");
  });
});
