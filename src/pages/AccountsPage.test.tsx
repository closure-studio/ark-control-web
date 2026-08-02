// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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
});
