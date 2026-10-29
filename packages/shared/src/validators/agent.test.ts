import { describe, expect, it } from "vitest";
import { updateAgentSchema, wakeAgentSchema } from "./agent.js";

describe("agent update schema", () => {
  it.each(["paused", "idle", "terminated"])("accepts lifecycle status request %s", status => {
    expect(updateAgentSchema.parse({ status })).toEqual({ status });
  });
  it.each(["active", "running", "error", "pending_approval"])("rejects direct status write %s", status => {
    const result = updateAgentSchema.safeParse({ name: "Renamed", status });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ["status"] }),
    ]));
  });
  it.each([{ spentMonthlyCents: 0 }, { name: "Renamed", spentMonthlyCents: 10 }])("rejects spend totals: %j", payload => {
    const result = updateAgentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ["spentMonthlyCents"] }),
    ]));
  });
  it("accepts profile and budget limit changes", () => {
    expect(updateAgentSchema.parse({ name: "Renamed", budgetMonthlyCents: 100 })).toEqual({ name: "Renamed", budgetMonthlyCents: 100 });
  });
});

describe("wakeAgentSchema", () => {
  it("validates a top-level issueId as a UUID", () => {
    for (const issueId of ["issue-1", null, 123]) {
      const result = wakeAgentSchema.safeParse({ issueId, reason: "manual" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(expect.arrayContaining([
          expect.objectContaining({ path: ["issueId"] }),
        ]));
      }
    }
  });

  it("preserves the top-level alias and the owner-room payload for route normalization", () => {
    const issueId = "33333333-3333-4333-8333-333333333333";
    const body = {
      issueId,
      reason: "owner_room_message",
      idempotencyKey: "owner-room:test-message",
      payload: { issueId, commentId: "test-comment" },
    };
    expect(wakeAgentSchema.parse(body)).toEqual({ ...body, source: "on_demand", forceFreshSession: false });
    expect(wakeAgentSchema.parse({ issueId, reason: "bridge" })).toEqual({
      issueId, reason: "bridge", source: "on_demand", forceFreshSession: false,
    });
  });

  it("keeps unscoped wakeups unchanged", () => {
    expect(wakeAgentSchema.parse({})).toEqual({ source: "on_demand", forceFreshSession: false });
    expect(wakeAgentSchema.parse({ payload: null })).toEqual({
      source: "on_demand", forceFreshSession: false, payload: null,
    });
  });

  it("preserves payload.issueId and the existing handling of unrelated fields", () => {
    expect(wakeAgentSchema.parse({ payload: { issueId: "issue-1" }, extra: "ignored" })).toEqual({
      source: "on_demand",
      payload: { issueId: "issue-1" },
      forceFreshSession: false,
    });
  });
});
