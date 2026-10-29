import { describe, expect, it } from "vitest";
import type { AiConnectionBinding } from "@paperclipai/shared";
import { hasManagedAiBindingChanged, hasManagedAiSelectionChanged } from "../services/managed-ai-binding-change.js";

describe("hasManagedAiBindingChanged", () => {
  const responsibleUserBinding: AiConnectionBinding = {
    provider: "anthropic",
    method: "subscription",
    mode: "responsible_user",
  };
  const sharedBinding: AiConnectionBinding = {
    provider: "anthropic",
    method: "subscription",
    mode: "shared",
    connectionId: "11111111-1111-4111-8111-111111111111",
    grantId: "22222222-2222-4222-8222-222222222222",
  };

  it("does not revalidate a responsible-user binding reordered by jsonb", () => {
    const jsonbRoundTripOrder = {
      mode: "responsible_user",
      method: "subscription",
      provider: "anthropic",
    };

    expect(hasManagedAiBindingChanged(jsonbRoundTripOrder, responsibleUserBinding)).toBe(false);
  });

  it("does not revalidate a shared binding reordered by jsonb", () => {
    const jsonbRoundTripOrder = {
      mode: "shared",
      method: "subscription",
      grantId: "22222222-2222-4222-8222-222222222222",
      provider: "anthropic",
      connectionId: "11111111-1111-4111-8111-111111111111",
    };

    expect(hasManagedAiBindingChanged(jsonbRoundTripOrder, sharedBinding)).toBe(false);
  });

  it("still revalidates a real connection change", () => {
    const previous = {
      mode: "shared",
      method: "subscription",
      grantId: "22222222-2222-4222-8222-222222222222",
      provider: "anthropic",
      connectionId: "33333333-3333-4333-8333-333333333333",
    };

    expect(hasManagedAiBindingChanged(previous, sharedBinding)).toBe(true);
  });

  it("still revalidates a malformed persisted binding", () => {
    expect(hasManagedAiBindingChanged({ provider: "anthropic" }, responsibleUserBinding)).toBe(true);
  });
  it("compares router bindings canonically", () => {
    const connectionId = "33333333-3333-4333-8333-333333333333";
    expect(hasManagedAiBindingChanged({ connectionId, mode: "router" }, { mode: "router", connectionId })).toBe(false);
    expect(hasManagedAiBindingChanged({ connectionId, mode: "router" }, {
      mode: "router", connectionId: "44444444-4444-4444-8444-444444444444",
    })).toBe(true);
  });

});

describe("hasManagedAiSelectionChanged", () => {
  it.each([
    ["claude_local", { model: "old" }, "claude_local", { model: "new" }],
    ["claude_local", { model: "same" }, "codex_local", { model: "same" }],
    ["paperclip_runner", { provider: "codex", model: "same" }, "paperclip_runner", { provider: "openai_dot", model: "same" }],
    ["paperclip_runner", { provider: "acpx", acpxAgent: "claude" }, "paperclip_runner", { provider: "acpx", acpxAgent: "codex" }],
  ] as const)("rechecks a changed effective selection (%s)", (previousType, previous, nextType, next) => {
    expect(hasManagedAiSelectionChanged(previousType, previous, nextType, next)).toBe(true);
  });

  it("ignores unrelated config after selection defaults are applied", () => {
    expect(hasManagedAiSelectionChanged("claude_local", { model: "same", maxTurns: 3 },
      "claude_local", { maxTurns: 8, model: "same", env: { FIXTURE: "value" } })).toBe(false);
  });

  it("ignores unused runner selector fields", () => {
    expect(hasManagedAiSelectionChanged("claude_local", { provider: "unused", acpxAgent: "claude" },
      "claude_local", { provider: "other", acpxAgent: "codex" })).toBe(false);
    expect(hasManagedAiSelectionChanged("paperclip_runner", { provider: "codex", acpxAgent: "claude" },
      "paperclip_runner", { provider: "codex", acpxAgent: "codex" })).toBe(false);
  });
});
