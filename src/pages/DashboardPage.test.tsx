// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { DashboardPage } from "@/pages/DashboardPage";

const accounts = [{ id: 7, name: "Production account", enabled: true }];
const vps = [
  { id: 1, name: "Primary", role: "redroid", watcherEnabled: true },
  { id: 2, name: "Secondary", role: "redroid", watcherEnabled: true },
  { id: 3, name: "Excluded", role: "arkhost", watcherEnabled: false }
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

function apiResponse(input: RequestInfo | URL, fixtures = { accounts, vps, releases, operations, activeRunCount: 1 }) {
  const { accounts, vps, releases, operations, activeRunCount } = fixtures;
  const path = String(input);
  let data: unknown;
  if (path.startsWith("/api/accounts")) data = { accounts };
  else if (path.startsWith("/api/scheduler/ensure")) {
    data = {
      ensuredJobs: [
        "apk-delivery",
        "maintenance-monitor",
        "maintenance-pre-action",
        "retention"
      ]
    };
  }
  else if (path.startsWith("/api/vps")) data = { vps };
  else if (path.startsWith("/api/releases")) {
    data = { releases, pagination: { limit: 5, offset: 0, count: releases.length } };
  } else if (path.startsWith("/api/operations")) {
    data = { operations, pagination: { limit: 10, offset: 0, count: operations.length, total: operations.length } };
  } else {
    data = { runs: [], pagination: { limit: 1, offset: 0, count: 0, total: activeRunCount } };
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
    expect(screen.getByLabelText("67% of managed VPS enabled for automation")).toBeInTheDocument();
    expect(screen.getByText("2 ReDroid · 1 ArkHost")).toBeInTheDocument();
    expect(screen.queryByText("Last successful check")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recent releases" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recent operations" })).toBeInTheDocument();
    expect(screen.queryByText("Pending 0")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(fetchMock.mock.calls.map(([input]) => String(input))).not.toContain("/api/dashboard");
  });

  it("shows empty dashboard states and a single refresh timestamp", async () => {
    const emptyFixtures = { accounts: [], vps: [], releases: [], operations: [], activeRunCount: 0 };
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => apiResponse(input, emptyFixtures)));

    renderDashboard();

    const inventory = within(await screen.findByRole("region", { name: "SSH host inventory" }));
    expect(inventory.getByText("0%", { exact: true })).toBeVisible();
    expect(inventory.getByText("Automation coverage", { exact: true })).toHaveTextContent(/^0%\s*Automation coverage$/);
    expect(inventory.getByText("Last APK", { exact: true }).parentElement).toHaveTextContent(/^Last APK\s*None$/);
    expect(screen.getByText("No releases", { exact: true })).toBeVisible();
    expect(screen.getByText("No cloud operations", { exact: true })).toBeVisible();
    expect(screen.getAllByText(/\bUpdated\b/)).toHaveLength(1);
  });

  it("repairs scheduler alarms only when the administrator requests it", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => apiResponse(input));
    vi.stubGlobal("fetch", fetchMock);

    renderDashboard();
    await screen.findByRole("heading", { name: "Control plane overview" });
    expect(fetchMock).toHaveBeenCalledTimes(5);

    fireEvent.click(screen.getByRole("button", { name: "Repair alarms" }));

    expect(
      await screen.findByText(
        "Scheduler alarms ensured for APK delivery, maintenance monitor, maintenance pre-action, retention."
      )
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/scheduler/ensure",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("keeps dashboard data visible when scheduler repair fails", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) =>
      String(input).startsWith("/api/scheduler/ensure")
        ? new Response(
            JSON.stringify({
              error: { code: "scheduler_unavailable", message: "Scheduler unavailable" }
            }),
            { status: 503, headers: { "content-type": "application/json" } }
          )
        : apiResponse(input)
    );
    vi.stubGlobal("fetch", fetchMock);

    renderDashboard();
    await screen.findByRole("heading", { name: "Control plane overview" });
    fireEvent.click(screen.getByRole("button", { name: "Repair alarms" }));

    expect(await screen.findByText("Scheduler unavailable")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recent releases" })).toBeInTheDocument();
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
