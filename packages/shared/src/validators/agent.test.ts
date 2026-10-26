import { describe, expect, it } from "vitest";
import { wakeAgentSchema } from "./agent.js";

describe("wakeAgentSchema", () => {
  it("rejects a top-level issueId with the supported payload path", () => {
    for (const issueId of ["issue-1", null, 123]) {
      const result = wakeAgentSchema.safeParse({ issueId, reason: "manual" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(expect.arrayContaining([
          expect.objectContaining({ path: ["issueId"], message: "Use payload.issueId to target an issue." }),
        ]));
      }
    }
  });

  it("preserves payload.issueId and the existing handling of unrelated fields", () => {
    expect(wakeAgentSchema.parse({ payload: { issueId: "issue-1" }, extra: "ignored" })).toEqual({
      source: "on_demand",
      payload: { issueId: "issue-1" },
      forceFreshSession: false,
    });
  });
});
