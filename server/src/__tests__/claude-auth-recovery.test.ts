import { describe, expect, it, vi } from "vitest";
import type { Db, agents, heartbeatRuns } from "@paperclipai/db";
import { classifyContinuationFailure } from "../services/recovery/service.js";
import { classifyRunLiveness } from "../services/run-liveness.js";
import { createHeartbeatRetries, readTransientRecoveryContractFromRun, type HeartbeatRetryDependencies } from "../services/heartbeat/retries.js";

describe("Claude auth failures require explicit repair", () => {
  it.each([false, true])("blocks liveness with repair-card state %s", authenticationRepairRequested => {
    const result = classifyRunLiveness({ runStatus: "failed", issue: null, errorCode: "claude_auth_required", authenticationRepairRequested });
    expect(result.livenessState).toBe("blocked");
  });
  it("has no automatic continuation even before liveness is persisted", () => {
    expect(classifyContinuationFailure({ errorCode: "claude_auth_required", livenessState: "failed" } as Parameters<typeof classifyContinuationFailure>[0]))
      .toMatchObject({ kind: "non_retryable", maxAttempts: 0 });
  });
  it("ignores misleading transient or quota result metadata", () => {
    for (const errorFamily of ["transient_upstream", "provider_quota"]) {
      expect(readTransientRecoveryContractFromRun({ errorCode: "claude_auth_required", resultJson: { errorFamily } })).toBeNull();
    }
  });
  it.each([undefined, "max_turns_continuation", "interaction_continuation_infra_retry"])("refuses retry %s before any database or provider effect", async retryReason => {
    const access = vi.fn(() => { throw new Error("Unexpected database access"); });
    const retries = createHeartbeatRetries(new Proxy({}, { get: access }) as Db, {} as HeartbeatRetryDependencies);
    const result = await retries.scheduleBoundedRetryForRun(
      { errorCode: "claude_auth_required", issueId: "issue" } as typeof heartbeatRuns.$inferSelect,
      {} as typeof agents.$inferSelect, { retryReason },
    );
    expect(result).toMatchObject({ outcome: "not_scheduled", issueId: "issue" });
    expect(access).not.toHaveBeenCalled();
  });
});
