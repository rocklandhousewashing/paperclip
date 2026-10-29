import { describe, expect, it } from "vitest";
import { runnerApiRestriction } from "../services/native-runtime/runner-api-policy.js";

describe("owner revision runner boundary", () => {
  it("rejects generic lifecycle mutation through either documented issue parameter", () => {
    for (const path of ["/api/issues/{id}/owner-revision-request", "/api/issues/{issueId}/owner-revision-request"]) {
      expect(runnerApiRestriction("POST", path)).toMatch(/cannot bypass runner lifecycle/);
    }
    expect(runnerApiRestriction("GET", "/api/issues/{id}/documents/{key}")).toBeNull();
  });
});
