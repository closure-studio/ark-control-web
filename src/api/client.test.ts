import { afterEach, describe, expect, it, vi } from "vitest";
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

    await expect(createApiClient("token", onUnauthorized).getDashboard()).rejects.toMatchObject({
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
});
