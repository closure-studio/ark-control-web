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
    vps: { total: 0, watcherEnabled: 0 },
    watcher: {
      lastProcessedApkFilename: null,
      hasNonTerminalHostRuns: false,
      nonTerminalHostRunCount: 0
    }
  },
  recentReleases: [],
  recentOperations: []
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
    vi.stubGlobal("fetch", vi.fn(async () => {
      return new Response(JSON.stringify(dashboard), {
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
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("/api/dashboard", expect.any(Object));
  });
});
