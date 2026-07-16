// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { VpsPage } from "@/pages/VpsPage";

const host = {
  id: 1,
  name: "primary-host",
  address: "192.0.2.10",
  port: 22,
  username: "root",
  watcherEnabled: true,
  createdAt: "2026-07-14T10:00:00.000Z",
  updatedAt: "2026-07-14T11:00:00.000Z"
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status
  });
}

function renderVpsPage(fetcher: typeof fetch) {
  vi.stubGlobal("fetch", fetcher);
  const api = createApiClient("test-token", vi.fn());
  return render(<VpsPage api={api} />);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("VpsPage", () => {
  it("renders the standalone SSH host contract without cloud controls", async () => {
    renderVpsPage(vi.fn(async () => jsonResponse({ vps: [host] })));

    expect(await screen.findAllByText("primary-host")).toHaveLength(2);
    expect(screen.getAllByText("root@192.0.2.10:22")).toHaveLength(2);
    expect(screen.queryByRole("combobox", { name: "Source" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Cloud status" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start primary-host" })).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Edit primary-host" })[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByText("Verify command")).not.toBeInTheDocument();
  });

  it("shows the backend error when SSH verification fails", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith("/api/vps/1/verify")) {
        return jsonResponse({ error: "ssh_unavailable", message: "SSH service unavailable" }, 502);
      }
      return jsonResponse({ vps: [host] });
    });
    renderVpsPage(fetcher);

    const verifyButtons = await screen.findAllByRole("button", { name: "Verify primary-host" });
    fireEvent.click(verifyButtons[0]);

    expect(await screen.findByText("SSH service unavailable")).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith(
      "/api/vps/1/verify",
      expect.objectContaining({ method: "POST" })
    );
  });
});
