import { describe, expect, it } from "vitest";
import type { AiConnectionBinding } from "@paperclipai/shared";
import { hasManagedAiBindingChanged } from "../services/managed-ai-binding-change.js";

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
