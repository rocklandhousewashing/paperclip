import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import express from "express";
import request from "supertest";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  agents, agentWakeupRequests, companies, companyMemberships, createDb,
  heartbeatRuns, issueComments, issues,
} from "@paperclipai/db";
import { agentRoutes } from "../routes/agents.js";
import { errorHandler } from "../middleware/error-handler.js";
import { getEmbeddedPostgresTestSupport, startEmbeddedPostgresTestDatabase } from "./helpers/embedded-postgres.js";

const support = await getEmbeddedPostgresTestSupport();
const describePostgres = support.supported ? describe : describe.skip;

describePostgres("wakeup issue alias through the real queue", () => {
  let db: ReturnType<typeof createDb>;
  let tempDb: Awaited<ReturnType<typeof startEmbeddedPostgresTestDatabase>>;

  beforeAll(async () => {
    tempDb = await startEmbeddedPostgresTestDatabase("pc457-r2-wakeup-");
    db = createDb(tempDb.connectionString);
  }, 30_000);

  afterAll(async () => { await tempDb?.cleanup(); });

  async function seed() {
    const companyId = randomUUID();
    const agentId = randomUUID();
    const issueId = randomUUID();
    const userId = `operator-${randomUUID()}`;
    await db.insert(companies).values({
      id: companyId, name: "Wake fixture", issuePrefix: `W${companyId.slice(0, 6).toUpperCase()}`,
      defaultResponsibleUserId: userId,
    });
    await db.insert(companyMemberships).values({
      companyId, principalType: "user", principalId: userId, membershipRole: "owner", status: "active",
    });
    await db.insert(agents).values({
      id: agentId, companyId, name: "Wake fixture agent", role: "ceo", status: "idle",
      adapterType: "process", adapterConfig: {},
      runtimeConfig: { heartbeat: { maxConcurrentRuns: 1 } },
    });
    // Occupy the only run slot: admission persists real queue rows but never
    // dispatches an adapter or contacts a provider.
    await db.insert(heartbeatRuns).values({
      companyId, agentId, status: "running", responsibleUserId: userId,
      contextSnapshot: { taskKey: "occupied-fixture-slot" },
    });
    await db.insert(issues).values({
      id: issueId, companyId, title: "Wake target", status: "todo", assigneeAgentId: agentId,
      createdByUserId: userId,
    });
    const commentId = randomUUID();
    await db.insert(issueComments).values({ id: commentId, companyId, issueId, authorUserId: userId, body: "Please follow up." });
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.actor = { type: "board", userId, source: "local_implicit", isInstanceAdmin: true, companyIds: [companyId] };
      next();
    });
    app.use("/api", agentRoutes(db));
    app.use(errorHandler);
    return { app, companyId, agentId, issueId, commentId };
  }

  async function wake(app: express.Express, agentId: string, body: Record<string, unknown>) {
    const server = createServer(app);
    try {
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Missing loopback address");
      return await request(`http://127.0.0.1:${address.port}`).post(`/api/agents/${agentId}/wakeup`).send(body);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  }

  it.each(["bridge", "owner_room_intake", "payload", "equal"])("persists issue context for %s", async (shape) => {
    const { app, companyId, agentId, issueId, commentId } = await seed();
    const body = shape === "owner_room_intake"
      ? { issueId, reason: "owner_room_message", idempotencyKey: `owner-room:${commentId}`, payload: { issueId, commentId } }
      : shape === "bridge"
        ? { issueId, reason: "bridge" }
        : shape === "equal" ? { issueId, payload: { issueId } } : { payload: { issueId } };
    const res = await wake(app, agentId, body);
    expect(res.status, JSON.stringify(res.body)).toBe(202);
    const [run] = await db.select().from(heartbeatRuns).where(eq(heartbeatRuns.id, res.body.id));
    expect(run).toMatchObject({ companyId, agentId, status: "queued", contextSnapshot: { issueId, taskId: issueId, taskKey: issueId } });
    const [receipt] = await db.select().from(agentWakeupRequests).where(eq(agentWakeupRequests.id, run!.wakeupRequestId!));
    expect(receipt).toMatchObject({ companyId, agentId, payload: { issueId } });
    if (shape === "owner_room_intake") {
      expect(run!.contextSnapshot).toMatchObject({ commentId, wakeCommentId: commentId });
      expect(receipt).toMatchObject({ idempotencyKey: body.idempotencyKey, payload: { issueId, commentId } });
    }
  });

  it.each(["top-level", "payload"])("does not queue another company's issue through %s", async (shape) => {
    const target = await seed();
    const foreign = await seed();
    const res = await wake(target.app, target.agentId, shape === "top-level"
      ? { issueId: foreign.issueId, reason: "bridge" }
      : { payload: { issueId: foreign.issueId }, reason: "bridge" });
    expect(res.status).toBe(202);
    expect(res.body.status).toBe("skipped");
    const runs = await db.select().from(heartbeatRuns).where(eq(heartbeatRuns.agentId, target.agentId));
    expect(runs).toHaveLength(1);
    expect(runs[0]!.contextSnapshot).not.toHaveProperty("issueId");
  });
});
