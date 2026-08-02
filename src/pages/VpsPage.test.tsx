// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { VpsPage } from "@/pages/VpsPage";

const host = {
  id: 1,
  name: "primary-host",
  address: "192.0.2.10",
  port: 22,
  username: "root",
  role: "redroid",
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
    expect(screen.getAllByText("ReDroid").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByRole("combobox", { name: "Source" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Cloud status" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start primary-host" })).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Edit primary-host" })[0]);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).queryByRole("combobox", { name: "VPS role" })).not.toBeInTheDocument();
    expect(within(dialog).getByText("ReDroid")).toBeInTheDocument();
    expect(screen.queryByText("Verify command")).not.toBeInTheDocument();
  });

  it("submits the selected role when creating a host", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
      init?.method === "POST"
        ? jsonResponse({ vps: { ...host, role: "arkhost" } })
        : jsonResponse({ vps: [] })
    );
    renderVpsPage(fetcher);

    await screen.findByText("No VPS records match");
    fireEvent.click(screen.getByRole("button", { name: "VPS" }));
    const dialog = screen.getByRole("dialog");
    const role = within(dialog).getByRole("combobox", { name: "VPS role" });
    expect(role).toHaveValue("redroid");
    expect(within(dialog).getByText("Include this host in APK delivery runs.")).toBeInTheDocument();

    fireEvent.change(role, { target: { value: "arkhost" } });
    expect(within(dialog).getByText("Include this host in maintenance pre-actions.")).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText("Name"), { target: { value: "maintenance-host" } });
    fireEvent.change(within(dialog).getByLabelText("Address"), { target: { value: "192.0.2.20" } });
    fireEvent.change(within(dialog).getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(fetcher).toHaveBeenCalledWith(
        "/api/vps",
        expect.objectContaining({ method: "POST" })
      )
    );
    const createCall = fetcher.mock.calls.find(([, init]) => init?.method === "POST");
    expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({
      name: "maintenance-host",
      address: "192.0.2.20",
      role: "arkhost",
      watcherEnabled: true
    });
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
