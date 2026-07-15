import assert from "node:assert/strict";
import test from "node:test";
import { analyzeSource } from "./check-ai-code.mjs";

test("rejects hardcoded business logic and local suppressions", () => {
  const findings = analyzeSource("sample.ts", `
    // @ts-ignore
    const status = getStatus();
    if (status === "RUNNING") run();
    setTimeout(run, 15000);
    const options = { retries: 7 };
    const matches = ["pending", "running"].includes(status);
    const endpoint = "https://example.com/api";
  `);

  assert.equal(findings.length, 6);
  assert.ok(findings.some((finding) => finding.message.includes("hardcoded string")));
  assert.ok(findings.some((finding) => finding.message.includes("membership checks")));
  assert.ok(findings.some((finding) => finding.message.includes("Magic number")));
  assert.ok(findings.some((finding) => finding.message.includes("Absolute URLs")));
  assert.ok(findings.some((finding) => finding.message.includes("suppression")));
});

test("accepts named domain values and presentation-only JSX numbers", () => {
  const findings = analyzeSource("sample.tsx", `
    const POLL_INTERVAL_MS = 15_000;
    const STATUS_RUNNING = "RUNNING";
    const status: unknown = getStatus();
    if (typeof status === "string" && status === STATUS_RUNNING) run();
    setTimeout(run, POLL_INTERVAL_MS);
    const icon = <Icon size={16} />;
  `);

  assert.deepEqual(findings, []);
});
