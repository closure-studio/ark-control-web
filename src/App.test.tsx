// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/App";
import { AuthProvider } from "@/contexts/AuthContext";

function emptyApiResponse(input: RequestInfo | URL) {
  const path = String(input);
  if (path.startsWith("/api/accounts")) return { accounts: [] };
  if (path.startsWith("/api/vps")) return { vps: [] };
  if (path.startsWith("/api/releases")) {
    return { releases: [], pagination: { limit: 5, offset: 0, count: 0 } };
  }
  if (path.startsWith("/api/operations")) {
    return { operations: [], pagination: { limit: 10, offset: 0, count: 0, total: 0 } };
  }
  return { runs: [], pagination: { limit: 1, offset: 0, count: 0, total: 0 } };
}

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
      return new Response(JSON.stringify(emptyApiResponse(input)), {
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
    expect(fetch).toHaveBeenCalledTimes(5);
    expect(fetch).toHaveBeenCalledWith("/api/accounts", expect.any(Object));
    expect(fetch).toHaveBeenCalledWith("/api/vps", expect.any(Object));
    expect(fetch).toHaveBeenCalledWith("/api/releases?limit=5&offset=0", expect.any(Object));
    expect(fetch).toHaveBeenCalledWith("/api/operations?limit=10&offset=0", expect.any(Object));
    expect(fetch).toHaveBeenCalledWith(
      "/api/runs?state=active&limit=1&offset=0",
      expect.any(Object)
    );
  });
});
