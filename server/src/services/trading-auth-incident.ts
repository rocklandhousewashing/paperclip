import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const TRADING_COMPANY_ID = "1efd477a-a4ab-481a-ae07-426fcb88e88c";
const SCOUT_AGENT_ID = "4cb9e4b6-30d1-417b-8f66-6e25fd98caf8";
const DEFAULT_OUTBOX = "/home/ubuntu/paperclip/home/instances/default/trading-incident-notices";
const MAX_BYTES = 16_384;

export type TradingAuthIncidentInput = {
  companyId: string;
  agentId: string;
  agentName: string;
  issueId: string;
  issueIdentifier: string;
  runId: string;
  errorCode: "claude_auth_required";
  state: "blocked" | "recovered";
  blockedTransitionAt: Date;
  generatedAt?: Date;
  outboxDir?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function assertRegularOrAbsent(filePath: string) {
  try {
    const stat = await fs.lstat(filePath);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("incident target is not a regular file");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

async function ensureSafeOutbox(outboxDir: string) {
  const parent = path.dirname(outboxDir);
  const parentStat = await fs.lstat(parent);
  if (!parentStat.isDirectory() || parentStat.isSymbolicLink()) throw new Error("incident outbox parent is unsafe");
  if (await fs.realpath(parent) !== path.resolve(parent)) throw new Error("incident outbox parent path is unsafe");
  try {
    const stat = await fs.lstat(outboxDir);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("incident outbox is unsafe");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    await fs.mkdir(outboxDir, { mode: 0o700 });
  }
}

export async function writeTradingAuthIncident(input: TradingAuthIncidentInput) {
  if (input.companyId !== TRADING_COMPANY_ID || input.agentId !== SCOUT_AGENT_ID) return null;
  if (!isUuid(input.issueId) || !isUuid(input.runId)) throw new Error("invalid trading auth incident UUID");
  if (!/^TRA-[1-9][0-9]*$/.test(input.issueIdentifier)) throw new Error("invalid trading issue identifier");
  if (!input.agentName.trim() || input.agentName.length > 80) throw new Error("invalid trading agent name");

  const generatedAt = input.generatedAt ?? new Date();
  const ageMs = generatedAt.getTime() - Date.now();
  if (!Number.isFinite(generatedAt.getTime()) || ageMs > 5_000 || ageMs < -86_400_000) {
    throw new Error("invalid trading auth incident timestamp");
  }
  const transitionIso = input.blockedTransitionAt.toISOString();
  const incidentId = createHash("sha256").update(`${input.issueId}:${transitionIso}`).digest("hex");
  const payload = {
    schema: "trading-auth-incident.v1",
    company_id: input.companyId,
    agent_id: input.agentId,
    agent_name: input.agentName.trim(),
    issue_id: input.issueId,
    issue_identifier: input.issueIdentifier,
    run_id: input.runId,
    error_code: input.errorCode,
    state: input.state,
    generated_at: generatedAt.toISOString(),
    incident_id: incidentId,
  };
  const body = `${JSON.stringify(payload)}\n`;
  if (Buffer.byteLength(body) > MAX_BYTES) throw new Error("trading auth incident exceeds size limit");

  const outboxDir = input.outboxDir ?? DEFAULT_OUTBOX;
  await ensureSafeOutbox(outboxDir);
  const target = path.join(outboxDir, `${incidentId}--${input.state}.json`);
  await assertRegularOrAbsent(target);
  const temp = path.join(outboxDir, `.${incidentId}.${randomUUID()}.tmp`);
  try {
    await fs.writeFile(temp, body, { encoding: "utf8", mode: 0o600, flag: "wx" });
    await fs.rename(temp, target);
  } finally {
    await fs.rm(temp, { force: true }).catch(() => undefined);
  }
  return { incidentId, target, payload };
}
