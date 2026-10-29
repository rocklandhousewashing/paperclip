import { randomUUID } from "node:crypto";
import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { companies, companyMemberships, createDb, issues } from "@paperclipai/db";
import { issueReviewedHtmlRoutes } from "../routes/issue-reviewed-html.js";
import { errorHandler } from "../middleware/index.js";
import { getEmbeddedPostgresTestSupport, startEmbeddedPostgresTestDatabase } from "./helpers/embedded-postgres.js";

const support = await getEmbeddedPostgresTestSupport();
const describePostgres = support.supported ? describe : describe.skip;
describePostgres("reviewed HTML private-task access", () => {
  let fixture: Awaited<ReturnType<typeof startEmbeddedPostgresTestDatabase>>;
  let db: ReturnType<typeof createDb>;
  const companyId = randomUUID();
  const issueId = randomUUID();
  const ownerUserId = "fictional-private-owner";
  const outsiderUserId = "fictional-company-peer";
  const storage = { getObject: vi.fn() };
  beforeAll(async () => {
    fixture = await startEmbeddedPostgresTestDatabase("paperclip-html-privacy-");
    db = createDb(fixture.connectionString);
    await db.insert(companies).values({ id: companyId, name: "Fictional", issuePrefix: "FPR" });
    await db.insert(companyMemberships).values([ownerUserId, outsiderUserId].map((principalId) => ({
      companyId, principalType: "user", principalId, status: "active", membershipRole: "operator",
    })));
    await db.insert(issues).values({ id: issueId, companyId, title: "Private fixture", visibility: "private", assigneeUserId: ownerUserId, createdByUserId: ownerUserId });
  }, 90_000);
  afterAll(async () => { await fixture?.cleanup(); });
  function app(userId: string) {
    const app = express(); app.use(express.json());
    app.use((req, _res, next) => {
      (req as any).actor = { type: "board", source: "session", userId, companyIds: [companyId], memberships: [{ companyId, status: "active", membershipRole: "operator" }], isInstanceAdmin: false };
      next();
    });
    app.use("/api", issueReviewedHtmlRoutes(db, storage as any)); app.use(errorHandler); return app;
  }
  it("uses the target ACL before exposing or mutating a same-company private review", async () => {
    const denied = app(outsiderUserId);
    await request(denied).get(`/api/issues/${issueId}/reviewed-html`).expect(404);
    await request(denied).get(`/api/issues/${issueId}/reviewed-html/1`).expect(404);
    await request(denied).post(`/api/issues/${issueId}/reviewed-html`).send({ companyId, expectedLatestVersion: 0, confirmExactBytesReviewed: true, html: { attachmentId: randomUUID(), sha256: "a".repeat(64) }, assets: [] }).expect(404);
    await request(denied).post(`/api/issues/${issueId}/reviewed-html/1/revoke`).send({ companyId }).expect(404);
    expect(storage.getObject).not.toHaveBeenCalled();
    await request(app(ownerUserId)).get(`/api/issues/${issueId}/reviewed-html`).expect(200);
  });
});
