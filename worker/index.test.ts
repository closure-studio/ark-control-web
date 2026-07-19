import { describe, expect, it, vi } from "vitest";
import worker, { type Env } from "./index";

function fetcher(fetch: (request: Request) => Promise<Response>): Fetcher {
  return { fetch } as Fetcher;
}

describe("web worker", () => {
  it("forwards API requests through the API service binding", async () => {
    const apiFetch = vi.fn(async (request: Request) =>
      Response.json({ method: request.method, url: request.url })
    );
    const assetsFetch = vi.fn(async () => new Response("asset"));
    const env: Env = {
      API: fetcher(apiFetch),
      ASSETS: fetcher(assetsFetch)
    };
    const request = new Request("https://ark-control-web.dltest.workers.dev/api/operations", {
      headers: { authorization: "Bearer test-token" }
    });

    const response = await worker.fetch(request as Parameters<typeof worker.fetch>[0], env);

    expect(response.status).toBe(200);
    expect(apiFetch).toHaveBeenCalledOnce();
    expect(apiFetch.mock.calls[0][0]).toBe(request);
    expect(assetsFetch).not.toHaveBeenCalled();
  });
});
