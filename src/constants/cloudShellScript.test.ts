import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { buildCloudShellScript, CLOUD_SHELL_SCRIPT } from "./cloudShellScript";

describe("Cloud Shell setup script", () => {
  it("posts to the authenticated machine account endpoint", () => {
    expect(CLOUD_SHELL_SCRIPT).toContain("/api/public/accounts");
    expect(CLOUD_SHELL_SCRIPT).toContain('read -rsp "Ark Control admin token: "');
    expect(CLOUD_SHELL_SCRIPT).toContain('authorization: Bearer ${ARK_CONTROL_ADMIN_TOKEN}');
    expect(CLOUD_SHELL_SCRIPT).toContain("unset ARK_CONTROL_ADMIN_TOKEN");
    expect(CLOUD_SHELL_SCRIPT).toContain("${PROJECT_ID}");
    expect(CLOUD_SHELL_SCRIPT).toContain("${PROJECT_NUMBER}");
    expect(CLOUD_SHELL_SCRIPT).not.toContain('"projectNumber"');
    expect(CLOUD_SHELL_SCRIPT).not.toContain(String.raw`\${`);
  });

  it("is valid Bash", () => {
    const result = spawnSync("bash", ["-n"], { input: CLOUD_SHELL_SCRIPT, encoding: "utf8" });
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
  });

  it("embeds a provided admin token without prompting", () => {
    const script = buildCloudShellScript("  admin-secret-token  ");
    expect(script).toContain("ARK_CONTROL_ADMIN_TOKEN='admin-secret-token'");
    expect(script).not.toContain('read -rsp "Ark Control admin token: "');
    expect(script).toContain('authorization: Bearer ${ARK_CONTROL_ADMIN_TOKEN}');
    expect(script).toContain("unset ARK_CONTROL_ADMIN_TOKEN");

    const syntax = spawnSync("bash", ["-n"], { input: script, encoding: "utf8" });
    expect(syntax.stderr).toBe("");
    expect(syntax.status).toBe(0);
  });

  it("safely single-quotes tokens with shell metacharacters", () => {
    const rawToken = String.raw`tok'en $(whoami) "quoted" \${VAR} ; echo hacked`;
    const script = buildCloudShellScript(rawToken);

    const syntax = spawnSync("bash", ["-n"], { input: script, encoding: "utf8" });
    expect(syntax.stderr).toBe("");
    expect(syntax.status).toBe(0);

    const assignmentLine = script
      .split("\n")
      .find((line) => line.startsWith("ARK_CONTROL_ADMIN_TOKEN="));
    expect(assignmentLine).toBeDefined();

    const evalResult = spawnSync(
      "bash",
      ["-c", `${assignmentLine ?? ""}\nprintf '%s' "$ARK_CONTROL_ADMIN_TOKEN"`],
      { encoding: "utf8" }
    );
    expect(evalResult.status).toBe(0);
    expect(evalResult.stdout).toBe(rawToken);
  });

  it("falls back to interactive prompt for blank or multiline tokens", () => {
    for (const invalidToken of ["", "   ", "line1\nline2", "line1\rline2"]) {
      const script = buildCloudShellScript(invalidToken);
      expect(script).toBe(CLOUD_SHELL_SCRIPT);
    }
  });
});
