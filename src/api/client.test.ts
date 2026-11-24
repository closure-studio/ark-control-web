import { afterEach, describe, expect, it, vi } from "vitest";
import { runningHostRun } from "@/test/hostRun.fixture";
import { createApiClient } from "./client";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("API client response envelope", () => {
  it("unwraps successful response data", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: { accounts: [] } })));

    await expect(createApiClient("token", vi.fn()).listAccounts()).resolves.toEqual({ accounts: [] });
  });

  it("reads stable error fields and signs out after an unauthorized response", async () => {
    const onUnauthorized = vi.fn();
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      error: {
        code: "unauthorized",
        message: "The session has expired.",
        details: { reason: "expired" }
      }
    }, 401)));

    await expect(createApiClient("token", onUnauthorized).listOperations(10, 0)).rejects.toMatchObject({
      code: "unauthorized",
      message: "The session has expired.",
      status: 401,
      details: { reason: "expired" }
    });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("accepts legacy bare success responses during rollout", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ accounts: [] })));

    await expect(createApiClient("token", vi.fn()).listAccounts()).resolves.toEqual({ accounts: [] });
  });

  it("repairs scheduler alarms only through an explicit POST request", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        data: {
          ensuredJobs: [
            "apk-delivery",
            "maintenance-monitor",
            "maintenance-pre-action",
            "retention"
          ]
        }
      })
    );
    vi.stubGlobal("fetch", fetcher);

    await expect(createApiClient("token", vi.fn()).ensureSchedulerAlarms()).resolves.toEqual({
      ensuredJobs: [
        "apk-delivery",
        "maintenance-monitor",
        "maintenance-pre-action",
        "retention"
      ]
    });
    expect(fetcher).toHaveBeenCalledWith(
      "/api/scheduler/ensure",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("API client release responses", () => {
  const release = {
    id: 41,
    apkFilename: "ark-production-release.apk",
    finalUrl: "https://example.com/ark.apk",
    createdAt: "2026-07-14T11:20:00.000Z"
  };
  const pagination = { limit: 25, offset: 0, count: 1 };

  it("rejects an unknown release host-run status", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      data: { runs: [{ ...runningHostRun, status: "paused" }] }
    })));

    await expect(createApiClient("token", vi.fn()).listReleaseRuns(runningHostRun.releaseId)).rejects.toMatchObject({
      name: "ApiError",
      code: "invalid_response",
      message: expect.stringContaining("runs[0].status")
    });
  });

  it("rejects an unknown release statusCounts key", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      data: { releases: [{ ...release, statusCounts: { paused: 1 } }], pagination }
    })));

    await expect(createApiClient("token", vi.fn()).listReleases(pagination.limit, pagination.offset))
      .rejects.toMatchObject({
        name: "ApiError",
        code: "invalid_response",
        message: expect.stringContaining("releases[0].statusCounts key")
      });
  });

  it("accepts empty release statusCounts", async () => {
    const data = { releases: [{ ...release, statusCounts: {} }], pagination };
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data })));

    await expect(createApiClient("token", vi.fn()).listReleases(pagination.limit, pagination.offset))
      .resolves.toEqual(data);
  });
});
