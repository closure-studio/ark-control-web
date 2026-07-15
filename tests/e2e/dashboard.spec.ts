import { expect, test, type Page } from "@playwright/test";

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
    verifyCommand: "docker ps --format '{{.Names}}'",
    watcherEnabled: true,
    source: "gcp",
    cloud: {
      provider: "gcp",
      accountId: 7,
      accountName: "Production control account",
      projectId: "ark-production-control-plane",
      zone: "us-central1-c",
      instanceName: "ark-vps-production-primary",
      status: "RUNNING",
      machineType: "n4a-custom-8-16384",
      internalIps: ["10.128.0.2"],
      externalIps: ["34.120.10.20"],
      error: null
    },
    createdAt: "2026-07-10T10:00:00.000Z",
    updatedAt: "2026-07-14T11:50:00.000Z"
  },
  {
    id: 2,
    name: "ark-vps-stopped-worker",
    address: "34.120.10.21",
    port: 22,
    username: "root",
    verifyCommand: null,
    watcherEnabled: false,
    source: "gcp",
    cloud: {
      provider: "gcp",
      accountId: 7,
      accountName: "Production control account",
      projectId: "ark-production-control-plane",
      zone: "us-central1-c",
      instanceName: "ark-vps-stopped-worker",
      status: "TERMINATED",
      machineType: "n4a-custom-8-16384",
      internalIps: ["10.128.0.3"],
      externalIps: [],
      error: null
    },
    createdAt: "2026-07-10T10:00:00.000Z",
    updatedAt: "2026-07-14T11:40:00.000Z"
  },
  {
    id: 3,
    name: "external-verification-host-with-long-name",
    address: "vps-long-hostname.example.net",
    port: 2222,
    username: "operator",
    verifyCommand: "uptime",
    watcherEnabled: true,
    source: "manual",
    cloud: null,
    createdAt: "2026-07-10T10:00:00.000Z",
    updatedAt: "2026-07-14T11:30:00.000Z"
  }
];

const accounts = [
  {
    id: 7,
    name: "Production control account",
    projectId: "ark-production-control-plane",
    projectNumber: "123456789012",
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
    if (url.pathname === "/api/dashboard") {
      body = {
        generatedAt: "2026-07-14T12:00:00.000Z",
        summary: {
          accounts: { total: 1, enabled: 1 },
          vps: { total: 3, gcp: 2, manual: 1, running: 1, stopped: 1, unavailable: 0, watcherEnabled: 2 },
          watcher: { lastProcessedApkFilename: releases[0].apkFilename, lastSuccessfulCheckAt: "2026-07-14T11:55:00.000Z", lastCheckError: null, hasNonTerminalHostRuns: true, nonTerminalHostRunCount: 1 }
        },
        recentReleases: releases,
        recentOperations: [{ id: 1, batchId: "batch-1", hostId: 1, accountId: 7, accountName: accounts[0].name, projectId: accounts[0].projectId, zone: "us-central1-c", instanceName: vps[0].name, action: "start", status: "succeeded", message: null, googleOperationName: "operation-1", createdAt: "2026-07-14T11:50:00.000Z", completedAt: "2026-07-14T11:51:00.000Z" }],
        errors: []
      };
    } else if (url.pathname === "/api/vps") body = { vps, errors: [] };
    else if (url.pathname === "/api/vps/reconcile") body = { linked: [], conflicts: [], errors: [] };
    else if (url.pathname === "/api/accounts") body = { accounts };
    else if (url.pathname === "/api/releases") body = { releases, pagination: { limit: 25, offset: 0, count: releases.length } };
    else if (url.pathname === "/api/releases/41/runs") body = { runs };
    else if (url.pathname.startsWith("/api/releases/")) body = { runs: [] };
    else if (url.pathname === "/api/runs/81/log") body = { lastLogTail: "[12:00:01] deployment running\n[12:00:03] waiting for helper", lastCheckedAt: "2026-07-14T12:00:03.000Z", updatedAt: "2026-07-14T12:00:03.000Z" };
    await route.fulfill({ contentType: "application/json", status: 200, body: JSON.stringify(body) });
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

test.describe("core interactions", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("navigation, filtering, and run logs work without console errors", async ({ page }) => {
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

    await page.getByRole("link", { name: "VPS", exact: true }).click();
    await expect(page).toHaveURL(/\/vps$/);
    await page.getByPlaceholder("Search VPS").fill("stopped");
    const vpsTable = page.locator("table").first();
    await expect(vpsTable.getByText("ark-vps-stopped-worker", { exact: true })).toBeVisible();
    await expect(vpsTable.getByText("ark-vps-production-primary", { exact: true })).toHaveCount(0);

    await page.getByRole("link", { name: "Releases", exact: true }).click();
    await expect(page).toHaveURL(/\/releases$/);
    await page.getByRole("button", { name: "Log", exact: true }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Run log: ark-vps-production-primary" })).toBeVisible();
    await expect(page.getByText("deployment running", { exact: false })).toBeVisible();
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
