// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { ReleasesPage } from "@/pages/ReleasesPage";

const releases = [
  {
    id: 41,
    apkFilename: "ark-production-release-2026.07.14-arm64.apk",
    finalUrl: "https://example.com/ark-41.apk",
    createdAt: "2026-07-14T11:20:00.000Z",
    statusCounts: { succeeded: 4, running: 1, failed: 1 }
  },
  {
    id: 40,
    apkFilename: "ark-production-release-2026.07.13-arm64.apk",
    finalUrl: "https://example.com/ark-40.apk",
    createdAt: "2026-07-13T11:20:00.000Z",
    statusCounts: { succeeded: 6 }
  }
];

const runsRelease41 = [
  {
    id: 81,
    releaseId: 41,
    hostId: 1,
    hostName: "ark-vps-production-primary",
    hostIp: "34.120.10.20",
    status: "running",
    startedAt: "2026-07-14T11:20:00.000Z",
    nextCheckAt: "2026-07-14T11:30:00.000Z",
    deadlineAt: "2026-07-14T12:20:00.000Z",
    lastCheckedAt: "2026-07-14T11:25:00.000Z",
    lastAiStatus: "running",
    lastAiReason: "The helper is still processing the latest APK deployment.",
    errorMessage: null,
    createdAt: "2026-07-14T11:20:00.000Z",
    updatedAt: "2026-07-14T11:25:00.000Z"
  },
  {
    id: 82,
    releaseId: 41,
    hostId: 3,
    hostName: "external-verification-host",
    hostIp: "vps.example.net",
    status: "failed",
    startedAt: "2026-07-14T11:20:00.000Z",
    nextCheckAt: null,
    deadlineAt: null,
    lastCheckedAt: "2026-07-14T11:25:00.000Z",
    lastAiStatus: "failed",
    lastAiReason: "Expected process output was not present in the captured log tail.",
    errorMessage: "Verification command exited with status 1 after deployment.",
    createdAt: "2026-07-14T11:20:00.000Z",
    updatedAt: "2026-07-14T11:25:00.000Z"
  },
  {
    id: 83,
    releaseId: 41,
    hostId: 4,
    hostName: "ark-vps-healthy-node",
    hostIp: "34.120.10.25",
    status: "succeeded",
    startedAt: "2026-07-14T11:20:00.000Z",
    nextCheckAt: null,
    deadlineAt: null,
    lastCheckedAt: "2026-07-14T11:24:00.000Z",
    lastAiStatus: "success",
    lastAiReason: "APK deployed and verified cleanly.",
    errorMessage: null,
    createdAt: "2026-07-14T11:20:00.000Z",
    updatedAt: "2026-07-14T11:24:00.000Z"
  }
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function createReleasesFetchMock() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("/api/releases?")) {
      return Response.json({
        data: { releases, pagination: { limit: 25, offset: 0, count: releases.length } }
      });
    }
    if (url === "/api/releases/41/host-runs") {
      return Response.json({ data: { runs: runsRelease41 } });
    }
    if (url === "/api/releases/40/host-runs") {
      return Response.json({ data: { runs: [] } });
    }
    if (url === "/api/host-runs/81/log") {
      return Response.json({
        data: {
          lastLogTail: "[11:21:00] downloading apk\n[11:25:00] helper running",
          lastCheckedAt: "2026-07-14T11:25:00.000Z",
          updatedAt: "2026-07-14T11:25:00.000Z"
        }
      });
    }
    if (url === "/api/host-runs/82/log") {
      return Response.json({
        data: {
          lastLogTail: "[11:24:01] installing apk\n[11:25:00] ERROR verification failed",
          lastCheckedAt: "2026-07-14T11:25:00.000Z",
          updatedAt: "2026-07-14T11:25:00.000Z"
        }
      });
    }
    if (url === "/api/host-runs/83/log") {
      return Response.json({
        data: {
          lastLogTail: "[11:24:00] verified ok",
          lastCheckedAt: "2026-07-14T11:24:00.000Z",
          updatedAt: "2026-07-14T11:24:00.000Z"
        }
      });
    }
    return Response.json({ data: {} });
  });
}

describe("ReleasesPage", () => {
  it("renders mission control timeline, docked inspector, KPI filtering, matrix view, and search", async () => {
    vi.stubGlobal("fetch", createReleasesFetchMock());
    const api = createApiClient("test-token", vi.fn());

    render(<ReleasesPage api={api} />);

    expect(
      await screen.findByRole("heading", { name: releases[0].apkFilename })
    ).toBeInTheDocument();
    expect(await screen.findByText("[11:25:00] helper running")).toBeInTheDocument();
    expect(screen.getByText("67% succeeded (4 of 6 hosts)")).toBeInTheDocument();
    expect(screen.getByText("Live · 15s")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Attention/i }));
    expect(await screen.findByText("[11:25:00] ERROR verification failed")).toBeInTheDocument();
    expect(screen.queryByText("ark-vps-production-primary")).not.toBeInTheDocument();
    expect(screen.queryByText("ark-vps-healthy-node")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /All/i }));
    fireEvent.click(screen.getByRole("button", { name: "Matrix" }));
    expect(screen.getByRole("table")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Inspector" }));

    fireEvent.change(screen.getByLabelText("Search host runs"), {
      target: { value: "34.120.10.25" }
    });
    expect(screen.getAllByText("ark-vps-healthy-node").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("external-verification-host")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search host runs"), {
      target: { value: "does-not-exist" }
    });
    expect(screen.getByText("No matching host runs")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getAllByText("ark-vps-production-primary").length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByRole("button", { name: /2026\.07\.13/i }));
    expect(await screen.findByText("No host runs")).toBeInTheDocument();
  });

  it("opens full terminal log modal with line search, errors-only filter, wrap toggle, and copy", async () => {
    vi.stubGlobal("fetch", createReleasesFetchMock());
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText }
    });
    const api = createApiClient("test-token", vi.fn());

    render(<ReleasesPage api={api} />);
    await screen.findByText("external-verification-host");

    fireEvent.click(screen.getByRole("button", { name: "Copy URL" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(releases[0].finalUrl));

    const logButtons = screen.getAllByRole("button", { name: "Log" });
    fireEvent.click(logButtons[1]);

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Run log: external-verification-host" })
    ).toBeInTheDocument();
    expect(
      await within(dialog).findByText("[11:25:00] ERROR verification failed")
    ).toBeInTheDocument();
    expect(within(dialog).getByText("2 lines")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Errors only (1)" }));
    expect(within(dialog).queryByText("[11:24:01] installing apk")).not.toBeInTheDocument();
    expect(within(dialog).getByText("1 of 2 lines")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Errors only (1)" }));

    fireEvent.change(within(dialog).getByLabelText("Filter log output"), {
      target: { value: "installing" }
    });
    expect(within(dialog).getByText("[11:24:01] installing apk")).toBeInTheDocument();
    expect(within(dialog).queryByText("[11:25:00] ERROR verification failed")).not.toBeInTheDocument();

    const wrapButton = within(dialog).getByRole("button", { name: "Wrap" });
    expect(wrapButton).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(wrapButton);
    expect(wrapButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(within(dialog).getByRole("button", { name: "Copy log" }));
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Copied" })).toBeInTheDocument()
    );
    expect(writeText).toHaveBeenCalledWith(
      "[11:24:01] installing apk\n[11:25:00] ERROR verification failed"
    );

    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("surfaces API errors for releases, host runs, and run logs with retry support", async () => {
    let failReleases = true;
    let failRuns = true;
    let failLog = true;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith("/api/releases?")) {
          if (failReleases) {
            failReleases = false;
            return new Response(
              JSON.stringify({ error: { code: "db_down", message: "Releases store offline" } }),
              { status: 500, headers: { "content-type": "application/json" } }
            );
          }
          return Response.json({
            data: { releases: [releases[0]], pagination: { limit: 25, offset: 0, count: 1 } }
          });
        }
        if (url === "/api/releases/41/host-runs") {
          if (failRuns) {
            failRuns = false;
            return new Response(
              JSON.stringify({ error: { code: "runs_error", message: "Host runs unavailable" } }),
              { status: 500, headers: { "content-type": "application/json" } }
            );
          }
          return Response.json({ data: { runs: [runsRelease41[0]] } });
        }
        if (url === "/api/host-runs/81/log") {
          if (failLog) {
            failLog = false;
            return new Response(
              JSON.stringify({ error: { code: "log_error", message: "Log storage timeout" } }),
              { status: 500, headers: { "content-type": "application/json" } }
            );
          }
          return Response.json({
            data: {
              lastLogTail: null,
              lastCheckedAt: null,
              updatedAt: "2026-07-14T11:25:00.000Z"
            }
          });
        }
        return Response.json({ data: {} });
      })
    );

    const api = createApiClient("test-token", vi.fn());
    render(<ReleasesPage api={api} />);

    expect(await screen.findByText("Releases store offline")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Host runs unavailable")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Log storage timeout")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("No stored log output yet.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Log" }));
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByText("No stored log output.")).toBeInTheDocument();
  });
});
