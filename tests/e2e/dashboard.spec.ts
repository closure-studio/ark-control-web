import { expect, test, type Locator, type Page } from "@playwright/test";

const LONG_CONTENT_REPEATS = 60;
const SCROLL_TOLERANCE_PX = 1;

const releases = [
  {
    id: 41,
    apkFilename: "ark-production-release-2026.07.14-arm64.apk",
    finalUrl: "https://example.com/ark.apk",
    createdAt: "2026-07-14T11:20:00.000Z",
    statusCounts: { succeeded: 4, running: 1, failed: 1 }
  },
  {
    id: 40,
    apkFilename: "ark-production-release-2026.07.13-arm64.apk",
    finalUrl: "https://example.com/ark-previous.apk",
    createdAt: "2026-07-13T11:20:00.000Z",
    statusCounts: { succeeded: 6 }
  }
];

const vps = [
  {
    id: 1,
    name: "ark-vps-production-primary",
    address: "34.120.10.20",
    port: 22,
    username: "root",
    role: "redroid",
    watcherEnabled: true,
    createdAt: "2026-07-10T10:00:00.000Z",
    updatedAt: "2026-07-14T11:50:00.000Z"
  },
  {
    id: 2,
    name: "ark-vps-stopped-worker",
    address: "34.120.10.21",
    port: 22,
    username: "root",
    role: "redroid",
    watcherEnabled: false,
    createdAt: "2026-07-10T10:00:00.000Z",
    updatedAt: "2026-07-14T11:40:00.000Z"
  },
  {
    id: 3,
    name: "external-verification-host-with-long-name",
    address: "vps-long-hostname.example.net",
    port: 2222,
    username: "operator",
    role: "arkhost",
    watcherEnabled: true,
    createdAt: "2026-07-10T10:00:00.000Z",
    updatedAt: "2026-07-14T11:30:00.000Z"
  }
];

const accounts = [
  {
    id: 7,
    name: "Production control account",
    projectId: "ark-production-control-plane",
    serviceAccountEmail: "ark-control-vps@ark-production-control-plane.iam.gserviceaccount.com",
    workloadIdentityProvider: "//iam.googleapis.com/projects/123456789012/locations/global/workloadIdentityPools/ark-control/providers/cloudflare",
    defaultZone: "us-central1-c",
    enabled: true,
    createdAt: "2026-07-10T10:00:00.000Z",
    updatedAt: "2026-07-14T11:30:00.000Z"
  }
];

const runs = [
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
    hostName: "external-verification-host-with-long-name",
    hostIp: "vps-long-hostname.example.net",
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
  }
];

async function mockApi(page: Page, seedToken = true) {
  if (seedToken) {
    await page.addInitScript(() => localStorage.setItem("ark-control-admin-token", "visual-test-token"));
  }
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route) => {
    const url = new URL(route.request().url());
    let body: unknown = {};
    if (url.pathname === "/api/vps") body = { vps };
    else if (url.pathname === "/api/scheduler/ensure") {
      body = {
        ensuredJobs: [
          "apk-delivery",
          "maintenance-monitor",
          "maintenance-pre-action",
          "retention"
        ]
      };
    }
    else if (url.pathname === "/api/vps/2/verify") body = { result: { connected: true, stdout: "ok", stderr: "", exitCode: 0, signal: null, success: true, timedOut: false } };
    else if (url.pathname === "/api/accounts") body = { accounts };
    else if (url.pathname === "/api/accounts/7/vps") {
      body = {
        vps: {
          ...vps[0],
          id: 99,
          name: "ark-vps-provisioned"
        },
        operation: {
          accountId: 7,
          projectId: accounts[0].projectId,
          zone: accounts[0].defaultZone,
          instanceName: "ark-vps-provisioned",
          action: "create",
          status: "succeeded"
        }
      };
    }
    else if (url.pathname === "/api/releases") body = { releases, pagination: { limit: 25, offset: 0, count: releases.length } };
    else if (url.pathname === "/api/operations") body = { operations: [{ id: 1, batchId: "batch-1", accountId: 7, accountName: accounts[0].name, projectId: accounts[0].projectId, zone: "us-central1-c", instanceName: vps[0].name, action: "start", status: "succeeded", message: null, googleOperationName: "operation-1", createdAt: "2026-07-14T11:50:00.000Z" }], pagination: { limit: 10, offset: 0, count: 1, total: 1 } };
    else if (url.pathname === "/api/releases/41/host-runs") body = { runs };
    else if (url.pathname.startsWith("/api/releases/")) body = { runs: [] };
    else if (url.pathname === "/api/host-runs") body = { runs: [runs[0]], pagination: { limit: 1, offset: 0, count: 1, total: 1 } };
    else if (url.pathname === "/api/host-runs/81/log") body = { lastLogTail: "[12:00:01] deployment running\n[12:00:03] waiting for helper", lastCheckedAt: "2026-07-14T12:00:03.000Z", updatedAt: "2026-07-14T12:00:03.000Z" };
    await route.fulfill({
      contentType: "application/json",
      status: 200,
      body: JSON.stringify({ data: body })
    });
  });
}

const routes = [
  { path: "/dashboard", heading: "Dashboard" },
  { path: "/vps", heading: "VPS Inventory" },
  { path: "/accounts", heading: "GCP Accounts" },
  { path: "/releases", heading: "Releases" }
];

for (const viewport of [
  { name: "concept", width: 1586, height: 992 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 }
]) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });
    for (const route of routes) {
      test(`${route.heading} renders without page overflow`, async ({ page }, testInfo) => {
        await mockApi(page);
        await page.goto(route.path);
        await expect(page.getByRole("main").getByRole("heading", { level: 1, name: route.heading, exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Refresh", exact: true })).toBeEnabled();
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
        await page.screenshot({ fullPage: true, path: testInfo.outputPath(`${viewport.name}-${route.path.slice(1)}.png`) });
      });
    }
  });
}

async function expectTerminalScrollsToEnd(dialog: Locator) {
  const box = dialog.locator(".modal-box");
  const viewport = dialog.getByRole("code").locator("xpath=ancestor::pre/..");
  await expect(viewport).toHaveCSS("overflow-x", /^(auto|scroll)$/);
  const scroll = await viewport.evaluate((element) => {
    const { clientWidth, scrollWidth } = element;
    element.scrollLeft = scrollWidth;
    return { clientWidth, scrollWidth, scrollLeft: element.scrollLeft };
  });
  expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
  expect(scroll.scrollLeft).toBeGreaterThan(0);
  expect(Math.abs(scroll.scrollLeft + scroll.clientWidth - scroll.scrollWidth)).toBeLessThanOrEqual(SCROLL_TOLERANCE_PX);

  const bounds = await box.evaluate((element) => {
    const { left, right, top, bottom } = element.getBoundingClientRect();
    return {
      left, right, top, bottom,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth
    };
  });
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(bounds.viewportWidth);
  expect(bounds.top).toBeGreaterThanOrEqual(-SCROLL_TOLERANCE_PX);
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.viewportHeight + SCROLL_TOLERANCE_PX);
  expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth + SCROLL_TOLERANCE_PX);
}

test.describe("mobile dialogs", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("scrolls past a long delete title to confirm at 320×480", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    const account = { ...accounts[0], name: `Production-${"control-".repeat(LONG_CONTENT_REPEATS)}account` };
    let deleted = false;
    await mockApi(page);
    await page.route("**/api/accounts", (route) =>
      route.fulfill({ json: { data: { accounts: deleted ? [] : [account] } } })
    );
    await page.route(`**/api/accounts/${account.id}`, async (route) => {
      deleted = route.request().method() === "DELETE";
      await route.fulfill({ json: { data: { deleted } } });
    });
    await page.goto("/accounts");
    await page.getByRole("button", { name: `Delete ${account.name}`, exact: true }).click();

    const dialog = page.getByRole("dialog", { name: `Delete ${account.name}` });
    const box = dialog.locator(".modal-box");
    const confirmation = dialog.getByRole("textbox", { name: /^Enter .* to continue$/ });
    const submit = dialog.getByRole("button", { name: "Delete", exact: true });
    await expect(box).toHaveCSS("overflow-y", /^(auto|scroll)$/);
    await expect(submit).toBeDisabled();
    await confirmation.scrollIntoViewIfNeeded();
    await expect(confirmation).toBeInViewport({ ratio: 1 });
    await confirmation.fill(account.name);
    await expect(submit).toBeEnabled();
    await submit.scrollIntoViewIfNeeded();
    await expect(submit).toBeInViewport({ ratio: 1 });
    expect(await box.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await submit.click();

    await expect(page.getByText(`${account.name} was deleted.`, { exact: true })).toBeVisible();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("heading", { name: account.name, exact: true })).toHaveCount(0);
  });

  test("keeps a long Cloud Shell script line scrollable inside the modal", async ({ page }) => {
    const token = `${"visual-test-token-".repeat(LONG_CONTENT_REPEATS)}end`;
    await mockApi(page, false);
    await page.addInitScript((value) => localStorage.setItem("ark-control-admin-token", value), token);
    await page.goto("/accounts");
    await page.getByRole("button", { name: "Cloud setup" }).click();

    const dialog = page.getByRole("dialog", { name: "Cloud Shell setup" });
    await expect(dialog.getByRole("code")).toContainText(`ARK_CONTROL_ADMIN_TOKEN='${token}'`);
    await expectTerminalScrollsToEnd(dialog);
  });

  test("keeps an unwrapped run log line scrollable inside the modal", async ({ page }) => {
    const run = runs[0];
    const line = `${"deployment-output-".repeat(LONG_CONTENT_REPEATS)}end`;
    await mockApi(page);
    await page.route(`**/api/host-runs/${run.id}/log`, (route) =>
      route.fulfill({ json: { data: { lastLogTail: line, lastCheckedAt: run.lastCheckedAt, updatedAt: run.updatedAt } } })
    );
    await page.goto("/releases");
    await page.getByRole("button").filter({ has: page.getByText(run.hostName, { exact: true }) }).click();
    const inspector = page.getByRole("complementary", { name: `Diagnostic inspector for ${run.hostName}` });
    await inspector.getByRole("button", { name: "Full terminal", exact: true }).click();

    const dialog = page.getByRole("dialog", { name: `Run log: ${run.hostName}` });
    await expect(dialog.getByText(line, { exact: true })).toBeVisible();
    const wrap = dialog.getByRole("button", { name: "Wrap", exact: true });
    await wrap.click();
    await expect(wrap).toHaveAttribute("aria-pressed", "false");
    await expectTerminalScrollsToEnd(dialog);
  });
});

test.describe("core interactions", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("dashboard keeps its light theme and metric colors in dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await mockApi(page);
    await page.goto("/dashboard");

    const metrics = page.getByRole("article");
    const managedVpsValue = metrics
      .filter({ has: page.getByText("Managed VPS", { exact: true }) })
      .getByRole("strong");
    const activeRunsValue = metrics
      .filter({ has: page.getByText("Active runs", { exact: true }) })
      .getByRole("strong");

    await expect.soft(page.locator(":root")).toHaveCSS("color-scheme", "light");
    await expect.soft(managedVpsValue).toHaveCSS("color", "rgb(0, 107, 115)");
    await expect.soft(activeRunsValue).toHaveCSS("color", "rgb(135, 83, 0)");
  });

  test("navigation, filtering, and run logs work without console errors", async ({ page }, testInfo) => {
    const browserErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => browserErrors.push(error.message));

    await mockApi(page);
    await page.goto("/dashboard");
    await expect(page).toHaveTitle("Ark Control");
    await expect(page).toHaveURL(/\/dashboard$/);

    const navigationWidths = await page
      .getByRole("navigation", { name: "Primary navigation" })
      .getByRole("link")
      .evaluateAll((links) => links.map((link) => link.getBoundingClientRect().width));
    expect(new Set(navigationWidths).size).toBe(1);
    expect(navigationWidths[0]).toBeGreaterThan(200);

    const repairRequest = page.waitForRequest((request) =>
      request.url().endsWith("/api/scheduler/ensure")
    );
    await page.getByRole("button", { name: "Repair alarms" }).click();
    expect((await repairRequest).method()).toBe("POST");
    await expect(
      page.getByText(
        "Scheduler alarms ensured for APK delivery, maintenance monitor, maintenance pre-action, retention."
      )
    ).toBeVisible();

    await page.getByRole("link", { name: "VPS", exact: true }).click();
    await expect(page).toHaveURL(/\/vps$/);
    await page.getByRole("combobox", { name: "VPS role" }).selectOption("arkhost");
    await expect(
      page.getByText("external-verification-host-with-long-name", { exact: true }).first()
    ).toBeVisible();
    await expect(page.getByText("ark-vps-production-primary", { exact: true })).toHaveCount(0);
    await page.getByRole("combobox", { name: "VPS role" }).selectOption("all");
    await page.getByPlaceholder("Search VPS").fill("stopped");
    const vpsTable = page.locator("table").first();
    await expect(vpsTable.getByText("ark-vps-stopped-worker", { exact: true })).toBeVisible();
    await expect(vpsTable.getByText("ark-vps-production-primary", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Verify ark-vps-stopped-worker" }).click();
    await expect(page.getByText("ark-vps-stopped-worker: SSH verification succeeded.")).toBeVisible();

    await page.getByRole("link", { name: "Accounts", exact: true }).click();
    await expect(page).toHaveURL(/\/accounts$/);
    await page.getByRole("button", { name: "Cloud setup" }).click();
    const cloudShellDialog = page.getByRole("dialog");
    await expect(cloudShellDialog).toBeVisible();
    await expect(cloudShellDialog.getByText("ARK_CONTROL_ADMIN_TOKEN='visual-test-token'")).toBeVisible();
    await expect(cloudShellDialog.getByText('read -rsp "Ark Control admin token: "')).toHaveCount(0);
    const cloudShellBox = cloudShellDialog.locator(".modal-box");
    const cloudShellMetrics = await cloudShellBox.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      width: element.getBoundingClientRect().width
    }));
    expect(cloudShellMetrics.scrollWidth).toBeLessThanOrEqual(cloudShellMetrics.clientWidth + 1);
    expect(cloudShellMetrics.width).toBeLessThanOrEqual(770);
    await page.screenshot({ path: testInfo.outputPath("desktop-cloud-shell-dialog.png") });
    await cloudShellDialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.getByRole("button", { name: "Create VPS in Production control account" }).click();
    const provisionDialog = page.getByRole("dialog");
    await expect(provisionDialog).toBeVisible();
    await expect(provisionDialog.getByLabel("CPU cores (vCPU)")).toHaveValue("6");
    await expect(provisionDialog.getByLabel("Memory (GB)")).toHaveValue("16");
    await expect(provisionDialog.getByLabel("Boot disk size (GB)")).toHaveValue("100");
    await expect(provisionDialog.getByText("n4a-custom-6-16384")).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("desktop-create-vps-dialog.png") });
    const provisionRequest = page.waitForRequest((request) =>
      request.url().endsWith("/api/accounts/7/vps")
    );
    await provisionDialog.getByRole("button", { name: "Create VPS" }).click();
    expect(JSON.parse((await provisionRequest).postData() ?? "{}")).toEqual({
      cpuCount: 6,
      memoryGb: 16,
      provisioningModel: "SPOT",
      diskSizeGb: 100
    });
    await expect(page.getByText("ark-vps-provisioned was created as a ReDroid host.")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.getByRole("link", { name: "Releases", exact: true }).click();
    await expect(page).toHaveURL(/\/releases$/);
    await page.getByRole("button", { name: /Attention/i }).click();
    await expect(
      page.getByRole("heading", { name: "external-verification-host-with-long-name" })
    ).toBeVisible();
    await expect(page.getByText("ark-vps-production-primary")).toHaveCount(0);
    await page.getByRole("button", { name: /All/i }).click();
    await page.getByRole("button", { name: "Matrix" }).click();
    await expect(page.getByRole("table")).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("desktop-releases-matrix.png") });
    await page.getByRole("button", { name: "Inspector" }).click();
    await page.getByRole("button", { name: "Log", exact: true }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Run log: ark-vps-production-primary" })).toBeVisible();
    await expect(page.getByText("deployment running", { exact: false })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("desktop-run-log-dialog.png") });
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    expect(browserErrors).toEqual([]);
  });

  test("top bar remains glassy and fixed while scrolling", async ({ page }) => {
    await mockApi(page);
    await page.setViewportSize({ width: 1440, height: 420 });
    await page.goto("/releases");
    await expect(page.getByRole("heading", { level: 1, name: "Releases" })).toBeVisible();

    const topbar = page.locator(".app-topbar");
    const styles = await topbar.evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        position: computed.position,
        backgroundColor: computed.backgroundColor,
        backdropFilter: computed.backdropFilter
      };
    });
    expect(styles.position).toBe("sticky");
    expect(styles.backgroundColor).toContain("/ 0.88)");
    expect(styles.backdropFilter).toContain("blur(18px)");
    expect((await topbar.boundingBox())?.y).toBe(0);

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    expect((await topbar.boundingBox())?.y).toBe(0);
    expect(await topbar.evaluate((element) => getComputedStyle(element).backdropFilter)).toBe(styles.backdropFilter);
  });

  test("administrator token opens the authenticated dashboard", async ({ page }) => {
    await mockApi(page, false);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Administrator access" })).toBeVisible();
    const tokenInput = page.getByLabel("Admin token");
    await tokenInput.focus();
    await expect(tokenInput).toBeFocused();
    expect(await tokenInput.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("none");
    await tokenInput.fill("visual-test-token");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
  });
});
