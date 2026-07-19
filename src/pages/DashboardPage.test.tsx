// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { DashboardPage } from "@/pages/DashboardPage";

const accounts = [{ id: 7, name: "Production account", enabled: true }];
const vps = [
  { id: 1, name: "Primary", watcherEnabled: true },
  { id: 2, name: "Secondary", watcherEnabled: true },
  { id: 3, name: "Excluded", watcherEnabled: false }
];
const releases = [
    {
      id: 41,
      apkFilename: "ark-production-release.apk",
      finalUrl: "https://example.com/ark.apk",
      createdAt: "2026-07-14T11:20:00.000Z",
      statusCounts: { succeeded: 4, running: 1, failed: 1 }
    }
  ];
const operations = [
    {
      id: 1,
      batchId: "batch-1",
      accountId: 7,
      accountName: "Production account",
      projectId: "ark-production-control-plane",
      zone: "us-central1-c",
      instanceName: "ark-vps-production-primary",
      action: "start",
      status: "succeeded",
      message: null,
      googleOperationName: "operation-1",
      createdAt: "2026-07-14T11:50:00.000Z"
    }
  ];

function apiResponse(input: RequestInfo | URL) {
  const path = String(input);
  let data: unknown;
  if (path.startsWith("/api/accounts")) data = { accounts };
  else if (path.startsWith("/api/vps")) data = { vps };
  else if (path.startsWith("/api/releases")) {
    data = { releases, pagination: { limit: 5, offset: 0, count: 1 } };
  } else if (path.startsWith("/api/operations")) {
    data = { operations, pagination: { limit: 10, offset: 0, count: 1, total: 1 } };
  } else {
    data = { runs: [], pagination: { limit: 1, offset: 0, count: 0, total: 1 } };
  }
  return new Response(JSON.stringify({ data }), {
    headers: { "content-type": "application/json" },
    status: 200
  });
}

function renderDashboard() {
  const api = createApiClient("test-token", vi.fn());
  return render(<MemoryRouter><DashboardPage api={api} /></MemoryRouter>);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("DashboardPage", () => {
  it("prioritizes fleet health and hides empty release statuses", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => apiResponse(input));
    vi.stubGlobal("fetch", fetchMock);

    renderDashboard();

    expect(await screen.findByRole("heading", { name: "Control plane overview" })).toBeInTheDocument();
    expect(screen.getByText("Verification in progress")).toBeInTheDocument();
    expect(screen.getByLabelText("67% of managed VPS targeted by Watcher")).toBeInTheDocument();
    expect(screen.queryByText("Last successful check")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recent releases" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recent operations" })).toBeInTheDocument();
    expect(screen.queryByText("Pending 0")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(fetchMock.mock.calls.map(([input]) => String(input))).not.toContain("/api/dashboard");
  });

  it("recovers when a failed initial request is retried", async () => {
    let unavailable = true;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (!unavailable) return apiResponse(input);
      return new Response(JSON.stringify({
        error: { code: "dashboard_unavailable", message: "Dashboard unavailable" }
      }), {
        headers: { "content-type": "application/json" },
        status: 503
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderDashboard();

    expect(await screen.findByRole("alert")).toHaveTextContent("Dashboard unavailable");
    unavailable = false;
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "Control plane overview" })).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(10);
  });
});
