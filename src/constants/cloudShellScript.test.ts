import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { CLOUD_SHELL_SCRIPT } from "./cloudShellScript";

describe("Cloud Shell setup script", () => {
  it("posts to the authenticated machine account endpoint", () => {
    expect(CLOUD_SHELL_SCRIPT).toContain("/api/public/accounts");
    expect(CLOUD_SHELL_SCRIPT).toContain('read -rsp "Ark Control admin token: "');
    expect(CLOUD_SHELL_SCRIPT).toContain('authorization: Bearer ${ARK_CONTROL_ADMIN_TOKEN}');
    expect(CLOUD_SHELL_SCRIPT).toContain("unset ARK_CONTROL_ADMIN_TOKEN");
    expect(CLOUD_SHELL_SCRIPT).toContain("${PROJECT_ID}");
    expect(CLOUD_SHELL_SCRIPT).not.toContain(String.raw`\${`);
  });

  it("is valid Bash", () => {
    const result = spawnSync("bash", ["-n"], { input: CLOUD_SHELL_SCRIPT, encoding: "utf8" });
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
  });
});
