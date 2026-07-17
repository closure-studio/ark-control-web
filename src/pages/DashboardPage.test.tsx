// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { DashboardPage } from "@/pages/DashboardPage";
import type { DashboardResponse } from "@/types";

const dashboard = {
  generatedAt: "2026-07-14T12:00:00.000Z",
  summary: {
    accounts: { total: 1, enabled: 1 },
    vps: {
      total: 3,
      watcherEnabled: 2
    },
    watcher: {
      lastProcessedApkFilename: "ark-production-release.apk",
      hasNonTerminalHostRuns: true,
      nonTerminalHostRunCount: 1
    }
  },
  recentReleases: [
    {
      id: 41,
      apkFilename: "ark-production-release.apk",
      finalUrl: "https://example.com/ark.apk",
      createdAt: "2026-07-14T11:20:00.000Z",
      statusCounts: { succeeded: 4, running: 1, failed: 1 }
    }
  ],
  recentOperations: [
    {
      id: 1,
      batchId: "batch-1",
      hostId: 1,
      accountId: 7,
      accountName: "Production account",
      projectId: "ark-production-control-plane",
      zone: "us-central1-c",
      instanceName: "ark-vps-production-primary",
      action: "start",
      status: "succeeded",
      message: null,
      googleOperationName: "operation-1",
      createdAt: "2026-07-14T11:50:00.000Z",
      completedAt: "2026-07-14T11:51:00.000Z"
    }
  ]
} satisfies DashboardResponse;

function dashboardResponse() {
  return new Response(JSON.stringify({ data: dashboard }), {
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
    vi.stubGlobal("fetch", vi.fn(async () => dashboardResponse()));

    renderDashboard();

    expect(await screen.findByRole("heading", { name: "Control plane overview" })).toBeInTheDocument();
    expect(screen.getByText("Verification in progress")).toBeInTheDocument();
    expect(screen.getByLabelText("67% of managed VPS targeted by Watcher")).toBeInTheDocument();
    expect(screen.queryByText("Last successful check")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recent releases" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recent operations" })).toBeInTheDocument();
    expect(screen.queryByText("Pending 0")).not.toBeInTheDocument();
  });

  it("recovers when a failed initial request is retried", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        error: { code: "dashboard_unavailable", message: "Dashboard unavailable" }
      }), {
        headers: { "content-type": "application/json" },
        status: 503
      }))
      .mockResolvedValueOnce(dashboardResponse());
    vi.stubGlobal("fetch", fetchMock);

    renderDashboard();

    expect(await screen.findByRole("alert")).toHaveTextContent("Dashboard unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "Control plane overview" })).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
