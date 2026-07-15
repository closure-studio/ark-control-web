import { describe, expect, it } from "vitest";
import { CLOUD_SHELL_SCRIPT } from "./cloudShellScript";

describe("Cloud Shell setup script", () => {
  it("posts to the unified public account endpoint", () => {
    expect(CLOUD_SHELL_SCRIPT).toContain("/api/public/accounts");
    expect(CLOUD_SHELL_SCRIPT).toContain("${PROJECT_ID}");
    expect(CLOUD_SHELL_SCRIPT).not.toContain(String.raw`\${`);
  });
});
