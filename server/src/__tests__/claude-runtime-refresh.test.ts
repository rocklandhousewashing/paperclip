import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { access, rm, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import type { Db } from "@paperclipai/db";
import { companySecrets, connectionGrants, toolConnections } from "@paperclipai/db";
import { prepareManagedAiRuntime } from "../services/ai-connection-runtime.js";

const mocks = vi.hoisted(() => ({ select: vi.fn(), credential: vi.fn(), rotate: vi.fn(), lock: vi.fn() }));
vi.mock("../services/ai-connections.js", () => ({ aiConnectionService: () => ({ select: mocks.select, credential: mocks.credential, runtimeCredential: mocks.credential }) }));
vi.mock("../services/secrets.js", () => ({ secretService: () => ({ rotate: mocks.rotate }) }));
vi.mock("../services/subscriptions.js", () => ({ subscriptionService: () => ({ register: async () => "subscription" }) }));
vi.mock("../services/subscription-refresh.js", () => ({ refreshSubscriptionConnection: async () => {} }));
vi.mock("@paperclipai/adapter-codex-local/server", () => ({ decideCodexAuthMerge: vi.fn(), withAccountHomeSecretMutationLock: mocks.lock }));

const bundle = (expiresAt: number) => JSON.stringify({ claudeAiOauth: { accessToken: `fixture-${expiresAt}`, refreshToken: `fixture-refresh-${expiresAt}`, expiresAt } });
let saved: string;
let epoch: number;
let version: number;
let connectionTime: Date;
let grant: { id: string; status: string; subjectUserId: string; credentialSecretRefs: { configPath: string; secretId: string; versionSelector: string }[] };
const homes: string[] = [];
const input = { companyId: "company", agentId: "agent", responsibleUserId: "owner", adapterType: "claude_local", binding: { provider: "anthropic", method: "subscription", mode: "responsible_user" } as const, config: {} };
const db = {
  select(fields?: Record<string, unknown>) {
    let table: unknown;
    const result = () => {
      if (table === connectionGrants) return fields ? [{ refs: grant.credentialSecretRefs, status: grant.status }] : [{ ...grant }];
      if (table === companySecrets) return [{ id: "secret", epoch, version }];
      if (table === toolConnections) return [{ updatedAt: connectionTime }];
      throw new Error("Unexpected table");
    };
    const query: any = { from(value: unknown) { table = value; return query; }, where() { return query; }, for() { return query; }, limit() { return query; }, then(resolve: (value: unknown) => void, reject: (reason: unknown) => void) { return Promise.resolve().then(result).then(resolve, reject); } };
    return query;
  },
  transaction: async (work: (tx: unknown) => Promise<unknown>) => work(db),
} as unknown as Db;

beforeEach(() => {
  vi.clearAllMocks();
  saved = bundle(100); epoch = 7; version = 1; connectionTime = new Date(1000);
  grant = { id: "grant", status: "active", subjectUserId: "owner", credentialSecretRefs: [{ configPath: "ai.credential", secretId: "secret", versionSelector: "latest" }] };
  mocks.select.mockImplementation(async () => ({ grant: { ...grant }, connection: { id: "connection", name: "Claude fixture", updatedAt: connectionTime, config: { ai: { provider: "anthropic", method: "subscription" } } }, attribution: { method: "subscription", provider: "anthropic" } }));
  mocks.credential.mockImplementation(async () => saved);
  mocks.rotate.mockImplementation(async (_id, update) => { saved = update.value; version += 1; });
  let tail = Promise.resolve();
  mocks.lock.mockImplementation((_home, _company, work) => { const pending = tail.then(work); tail = pending.then(() => {}, () => {}); return pending; });
});
afterEach(async () => { await Promise.all(homes.splice(0).map(home => rm(home, { recursive: true, force: true }))); });
async function runtime() { const value = await prepareManagedAiRuntime(db, input); homes.push(value.home); return value; }
async function refresh(value: Awaited<ReturnType<typeof runtime>>, expiry: number) { await writeFile(path.join(value.home, "provider", ".credentials.json"), bundle(expiry)); }

describe("Claude managed refresh port", () => {
  it("uses a private refresh bundle while retaining stable session identity across token refresh", async () => {
    const first = await runtime();
    expect(await readFile(path.join(first.home, "provider", ".credentials.json"), "utf8")).toBe(saved);
    expect(first.config.env.CLAUDE_CODE_OAUTH_TOKEN).toBe("");
    await refresh(first, 200); await first.cleanup();
    const second = await runtime();
    expect(second.sessionIdentity).toBe(first.sessionIdentity);
    expect(mocks.rotate).toHaveBeenCalledWith("secret", { value: bundle(200), preserveAiSessionEpoch: true }, { userId: "owner" });
    await second.cleanup();
  });
  it("serializes concurrent stale cleanup and never overwrites a newer saved refresh", async () => {
    const older = await runtime(), newer = await runtime();
    await refresh(older, 200); await refresh(newer, 300);
    await Promise.all([newer.cleanup(), older.cleanup()]);
    expect(saved).toBe(bundle(300));
    // Credential files are read before acquiring the mutation lock. Either
    // cleanup can arrive first; successful writes must still be monotonic.
    const writtenExpiries = mocks.rotate.mock.calls.map(([, update]) => JSON.parse(update.value).claudeAiOauth.expiresAt);
    expect([[300], [200, 300]]).toContainEqual(writtenExpiries);
    await expect(access(older.home)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(newer.home)).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("discards an older cleanup after the newer refresh has been saved", async () => {
    const older = await runtime(), newer = await runtime();
    await refresh(older, 200); await refresh(newer, 300);
    await newer.cleanup();
    await older.cleanup();
    expect(saved).toBe(bundle(300));
    expect(mocks.rotate).toHaveBeenCalledTimes(1);
    await expect(access(older.home)).rejects.toMatchObject({ code: "ENOENT" });
  });
  it.each(["connection", "epoch", "secret", "revoked"])("discards old lineage after %s changes even with a newer expiry", async change => {
    const stale = await runtime(); await refresh(stale, 900);
    saved = bundle(150);
    if (change === "connection") connectionTime = new Date(2000);
    if (change === "epoch") epoch += 1;
    if (change === "secret") grant.credentialSecretRefs = [{ configPath: "ai.credential", secretId: "replacement", versionSelector: "latest" }];
    if (change === "revoked") grant.status = "revoked";
    await stale.cleanup(); expect(saved).toBe(bundle(150)); expect(mocks.rotate).not.toHaveBeenCalled();
  });
  it("preserves the refreshed home if persistence fails so cleanup can retry", async () => {
    const value = await runtime(); await refresh(value, 200);
    mocks.rotate.mockRejectedValueOnce(new Error("fixture persistence failure"));
    await expect(value.cleanup()).rejects.toThrow("fixture persistence failure");
    await expect(access(value.home)).resolves.toBeUndefined();
    await value.cleanup(); expect(saved).toBe(bundle(200));
  });
  it("rejects malformed saved JSON instead of passing it as an OAuth token", async () => {
    saved = JSON.stringify({ claudeAiOauth: { accessToken: "incomplete" } });
    await expect(runtime()).rejects.toMatchObject({ details: { code: "ai_connection_credential_invalid" } });
  });
});
