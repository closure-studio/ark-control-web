import { describe, expect, it } from "vitest";
import { cx, formatDateTime, messageForError } from "./index";

describe("client utilities", () => {
  it("combines conditional classes", () => {
    expect(cx("btn", false, undefined, "btn-sm")).toBe("btn btn-sm");
  });

  it("keeps invalid timestamps readable", () => {
    expect(formatDateTime("not-a-date")).toBe("not-a-date");
    expect(formatDateTime(null)).toBe("Not available");
  });

  it("normalizes unknown errors", () => {
    expect(messageForError(new Error("failed"))).toBe("failed");
    expect(messageForError(null, "fallback")).toBe("fallback");
  });
});
