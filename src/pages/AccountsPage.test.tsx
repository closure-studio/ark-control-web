// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { AccountsPage } from "@/pages/AccountsPage";

const account = {
  id: 7,
  name: "Production account",
  projectId: "ark-production",
  serviceAccountEmail: "ark-control@ark-production.iam.gserviceaccount.com",
  workloadIdentityProvider:
    "//iam.googleapis.com/projects/123456789012/locations/global/workloadIdentityPools/ark-control/providers/cloudflare",
  defaultZone: "us-central1-c",
  enabled: true,
  createdAt: "2026-07-14T10:00:00.000Z",
  updatedAt: "2026-07-14T11:00:00.000Z"
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AccountsPage", () => {
  it("renders and edits the current account contract without projectNumber", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ data: { accounts: [account] } }))
    );
    const api = createApiClient("test-token", vi.fn());

    render(<AccountsPage api={api} />);

    expect(await screen.findByRole("heading", { name: "Production account" })).toBeInTheDocument();
    expect(screen.queryByText("Project number")).not.toBeInTheDocument();
    expect(screen.getByText(account.workloadIdentityProvider)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit Production account" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByLabelText("Project number")).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText("Project ID")).toHaveValue(account.projectId);
  });

  it("embeds the active admin token into the Cloud Shell setup script and copies it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ data: { accounts: [account] } }))
    );
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText }
    });
    const api = createApiClient("session-token-123", vi.fn());

    render(<AccountsPage adminToken="session-token-123" api={api} />);
    await screen.findByRole("heading", { name: "Production account" });

    fireEvent.click(screen.getByRole("button", { name: "Cloud setup" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/ARK_CONTROL_ADMIN_TOKEN='session-token-123'/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/read -rsp "Ark Control admin token: "/)).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Copy" }));
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Copied" })).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("ARK_CONTROL_ADMIN_TOKEN='session-token-123'"));
  });

  it("falls back to interactive prompt and handles clipboard failures when no token is passed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ data: { accounts: [account] } }))
    );
    const writeText = vi.fn(async () => {
      throw new Error("clipboard denied");
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText }
    });
    const api = createApiClient("test-token", vi.fn());

    render(<AccountsPage api={api} />);
    await screen.findByRole("heading", { name: "Production account" });

    fireEvent.click(screen.getByRole("button", { name: "Cloud setup" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/read -rsp "Ark Control admin token: "/)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Copy" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(within(dialog).getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("hides duplicate project ID subtitles and keeps technical credentials inside collapsible details", async () => {
    const projectNamedAccount = {
      ...account,
      id: 9,
      name: "project-4bd64c97-f241-4a63-ac8",
      projectId: "project-4bd64c97-f241-4a63-ac8"
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ data: { accounts: [projectNamedAccount] } }))
    );
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText }
    });
    const api = createApiClient("test-token", vi.fn());

    render(<AccountsPage api={api} />);
    await screen.findByRole("heading", { name: projectNamedAccount.name });

    expect(screen.queryByRole("textbox", { name: "Search accounts" })).not.toBeInTheDocument();
    expect(screen.queryByText("Federation readiness")).not.toBeInTheDocument();
    expect(screen.getAllByText(projectNamedAccount.projectId)).toHaveLength(2);

    const summary = screen.getByText("Connection details");
    const details = summary.closest("details");
    expect(details).not.toHaveAttribute("open");
    fireEvent.click(summary);

    fireEvent.click(
      screen.getByRole("button", { name: `Copy service account for ${projectNamedAccount.name}` })
    );
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(projectNamedAccount.serviceAccountEmail));
  });

  it("renders onboarding empty state and supports quick-pick zones in manual form", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ data: { accounts: [] } }))
    );
    const api = createApiClient("test-token", vi.fn());

    render(<AccountsPage api={api} />);

    expect(await screen.findByRole("heading", { name: "Connect your first GCP project" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Register manually" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "asia-east1-b" }));
    expect(within(dialog).getByLabelText("Default zone")).toHaveValue("asia-east1-b");
  });

  it("surfaces API errors when loading or provisioning fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ data: { accounts: [account] } }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: "quota_exceeded", message: "Zone quota exhausted" } }), {
          status: 500,
          headers: { "content-type": "application/json" }
        })
      );
    vi.stubGlobal("fetch", fetchMock);
    const api = createApiClient("test-token", vi.fn());

    render(<AccountsPage api={api} />);
    await screen.findByRole("heading", { name: "Production account" });

    fireEvent.click(screen.getByRole("button", { name: "Create VPS in Production account" }));
    expect(await screen.findByText("Zone quota exhausted")).toBeInTheDocument();
  });
});
