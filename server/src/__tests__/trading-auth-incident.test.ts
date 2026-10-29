import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { writeTradingAuthIncident } from "../services/trading-auth-incident.js";

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

function input(outboxDir: string) {
  return {
    companyId: "1efd477a-a4ab-481a-ae07-426fcb88e88c",
    agentId: "4cb9e4b6-30d1-417b-8f66-6e25fd98caf8",
    agentName: "Scout",
    issueId: "18a88ce0-62ae-4d15-bd7e-550c88699fbe",
    issueIdentifier: "TRA-43",
    runId: "26bfc957-d125-4c83-b35b-fce599586f69",
    errorCode: "claude_auth_required" as const,
    state: "blocked" as const,
    blockedTransitionAt: new Date("2026-10-08T15:00:09.230Z"),
    outboxDir,
  };
}

describe("trading auth incident outbox", () => {
  it("writes a deterministic private bounded notice without provider error text", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "trading-auth-incident-"));
    roots.push(root);
    const outboxDir = path.join(root, "incident-notices");
    const result = await writeTradingAuthIncident(input(outboxDir));
    expect(result?.incidentId).toMatch(/^[0-9a-f]{64}$/);
    expect(path.basename(result!.target)).toBe(`${result!.incidentId}--blocked.json`);
    const stat = await fs.lstat(result!.target);
    expect(stat.isFile()).toBe(true);
    expect(stat.mode & 0o077).toBe(0);
    const payload = JSON.parse(await fs.readFile(result!.target, "utf8"));
    expect(payload).toMatchObject({
      schema: "trading-auth-incident.v1",
      issue_identifier: "TRA-43",
      error_code: "claude_auth_required",
      state: "blocked",
    });
    expect(JSON.stringify(payload)).not.toContain("OAuth");
  });

  it("rejects a symlink outbox and ignores companies outside the fixed trading route", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "trading-auth-incident-"));
    roots.push(root);
    const outside = path.join(root, "outside");
    await fs.mkdir(outside);
    const outboxDir = path.join(root, "incident-notices");
    await fs.symlink(outside, outboxDir);
    await expect(writeTradingAuthIncident(input(outboxDir))).rejects.toThrow("unsafe");
    await expect(writeTradingAuthIncident({ ...input(outboxDir), companyId: randomUUID() })).resolves.toBeNull();
    expect(await fs.readdir(outside)).toEqual([]);
  });
});
