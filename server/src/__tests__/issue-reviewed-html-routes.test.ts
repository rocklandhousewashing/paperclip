import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReviewedHtmlReview } from "@paperclipai/shared";
import { errorHandler } from "../middleware/index.js";
import { buildOpenApiSpec } from "../routes/openapi.js";
import { issueReviewedHtmlRoutes } from "../routes/issue-reviewed-html.js";
import type {
  RegisterReviewedHtmlResult,
  ReviewedHtmlReviewStore,
  ReviewedHtmlStoredAttachment,
} from "../services/issue-reviewed-html-reviews.js";
import type { StorageService } from "../storage/types.js";

// All identifiers and file contents below are fictional fixtures.
const COMPANY_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const COMPANY_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ISSUE_1 = "11111111-1111-4111-8111-111111111111";
const ISSUE_2 = "22222222-2222-4222-8222-222222222222";
const ISSUE_B = "33333333-3333-4333-8333-333333333333";
const CONVERSATION_ISSUE = "44444444-4444-4444-8444-444444444444";

const HTML_ID = "a0000000-0000-4000-8000-000000000001";
const PNG_ID = "a0000000-0000-4000-8000-000000000002";
const TEXT_ID = "a0000000-0000-4000-8000-000000000003";
const BIG_ID = "a0000000-0000-4000-8000-000000000004";
const OTHER_ISSUE_HTML_ID = "a0000000-0000-4000-8000-000000000005";
const OTHER_COMPANY_HTML_ID = "a0000000-0000-4000-8000-000000000006";
const HTML_V2_ID = "a0000000-0000-4000-8000-000000000007";
const MISSING_ID = "a0000000-0000-4000-8000-0000000000ff";

const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

const HTML_BYTES = Buffer.from(
  '<!doctype html><html><head><title>Sample</title></head><body><img src="assets/logo.png"></body></html>',
);
const HTML_V2_BYTES = Buffer.from("<!doctype html><html><head></head><body><p>Second draft</p></body></html>");
const PNG_BYTES = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from("fixture")]);
const TEXT_BYTES = Buffer.from("plain notes");

let privateDeniedIssueId: string | null = null;
type Actor = Record<string, unknown>;

const BOARD: Actor = {
  type: "board",
  userId: "board-user-1",
  source: "session",
  companyIds: [COMPANY_A],
  memberships: [{ companyId: COMPANY_A, status: "active", membershipRole: "owner" }],
  isInstanceAdmin: false,
};
const VIEWER: Actor = {
  ...BOARD,
  userId: "viewer-user-1",
  memberships: [{ companyId: COMPANY_A, status: "active", membershipRole: "viewer" }],
};
const OTHER_COMPANY_BOARD: Actor = {
  ...BOARD,
  userId: "board-user-b",
  companyIds: [COMPANY_B],
  memberships: [{ companyId: COMPANY_B, status: "active", membershipRole: "owner" }],
};
const AGENT: Actor = {
  type: "agent",
  agentId: "agent-1",
  companyId: COMPANY_A,
  source: "agent_key",
  runId: "run-1",
};

function attachment(
  id: string,
  issueId: string,
  companyId: string,
  filename: string,
  contentType: string,
  bytes: Buffer,
  overrides: Partial<ReviewedHtmlStoredAttachment> = {},
): ReviewedHtmlStoredAttachment {
  return {
    id,
    companyId,
    issueId,
    objectKey: `${companyId}/issues/${issueId}/${filename}`,
    contentType,
    byteSize: bytes.length,
    sha256: sha(bytes),
    originalFilename: filename,
    ...overrides,
  };
}

class MemoryStore implements ReviewedHtmlReviewStore {
  issues = new Map([
    [ISSUE_1, { id: ISSUE_1, companyId: COMPANY_A, conversationAgentId: null }],
    [ISSUE_2, { id: ISSUE_2, companyId: COMPANY_A, conversationAgentId: null }],
    [ISSUE_B, { id: ISSUE_B, companyId: COMPANY_B, conversationAgentId: null }],
    [CONVERSATION_ISSUE, { id: CONVERSATION_ISSUE, companyId: COMPANY_A, conversationAgentId: "agent-chat-1" }],
  ]);
  attachments: ReviewedHtmlStoredAttachment[] = [];
  reviews: ReviewedHtmlReview[] = [];

  async getIssue(issueId: string) {
    return this.issues.get(issueId) ?? null;
  }
  async listIssueAttachments(companyId: string, issueId: string, ids: string[]) {
    return this.attachments.filter((a) => a.companyId === companyId && a.issueId === issueId && ids.includes(a.id));
  }
  private scoped(companyId: string, issueId: string) {
    return this.reviews.filter((r) => r.companyId === companyId && r.issueId === issueId);
  }
  async getLatest(companyId: string, issueId: string) {
    return this.scoped(companyId, issueId).sort((a, b) => b.reviewVersion - a.reviewVersion)[0] ?? null;
  }
  async getActive(companyId: string, issueId: string) {
    return this.scoped(companyId, issueId).find((r) => r.status === "active") ?? null;
  }
  async getVersion(companyId: string, issueId: string, reviewVersion: number) {
    return this.scoped(companyId, issueId).find((r) => r.reviewVersion === reviewVersion) ?? null;
  }
  async register(input: Parameters<ReviewedHtmlReviewStore["register"]>[0]): Promise<RegisterReviewedHtmlResult> {
    const latest = (await this.getLatest(input.companyId, input.issueId))?.reviewVersion ?? 0;
    if (latest !== input.expectedLatestVersion) return { kind: "stale", latestVersion: latest };
    const active = await this.getActive(input.companyId, input.issueId);
    if (active) Object.assign(active, { status: "superseded", endedAt: "2026-01-02T00:00:00.000Z" });
    const review: ReviewedHtmlReview = {
      id: `review-${latest + 1}`,
      companyId: input.companyId,
      issueId: input.issueId,
      reviewVersion: latest + 1,
      status: "active",
      trustState: "board_reviewed_bytes",
      files: input.files,
      totalBytes: input.totalBytes,
      reviewedAt: "2026-01-01T00:00:00.000Z",
      reviewedByUserId: input.reviewedByUserId,
      endedAt: null,
      endedByUserId: null,
    };
    this.reviews.push(review);
    return { kind: "created", review, supersededVersion: active?.reviewVersion ?? null };
  }
  async revoke(input: Parameters<ReviewedHtmlReviewStore["revoke"]>[0]) {
    const review = this.reviews.find(
      (r) => r.companyId === input.companyId && r.issueId === input.issueId
        && r.reviewVersion === input.reviewVersion && r.status === "active",
    );
    if (!review) return null;
    Object.assign(review, { status: "revoked", endedAt: "2026-01-03T00:00:00.000Z", endedByUserId: input.revokedByUserId });
    return review;
  }
}

function createStorage(objects: Map<string, Buffer>, options: { omitLength?: boolean } = {}) {
  return {
    provider: "local_disk",
    putFile: vi.fn(),
    getObject: vi.fn(async (_companyId: string, objectKey: string) => {
      const body = objects.get(objectKey);
      if (!body) throw new Error("missing object");
      return { stream: Readable.from([body]), contentLength: options.omitLength ? undefined : body.length };
    }),
    headObject: vi.fn(),
    deleteObject: vi.fn(),
  } as unknown as StorageService & { getObject: ReturnType<typeof vi.fn> };
}

let store: MemoryStore;
let objects: Map<string, Buffer>;
let logActivity: ReturnType<typeof vi.fn>;

function seed() {
  store = new MemoryStore();
  store.attachments = [
    attachment(HTML_ID, ISSUE_1, COMPANY_A, "page.html", "text/html", HTML_BYTES),
    attachment(PNG_ID, ISSUE_1, COMPANY_A, "logo.png", "image/png", PNG_BYTES),
    attachment(TEXT_ID, ISSUE_1, COMPANY_A, "notes.txt", "text/plain", TEXT_BYTES),
    attachment(BIG_ID, ISSUE_1, COMPANY_A, "big.html", "text/html", HTML_BYTES, { byteSize: 1024 * 1024 + 1 }),
    attachment(HTML_V2_ID, ISSUE_1, COMPANY_A, "page-v2.html", "text/html", HTML_V2_BYTES),
    attachment(OTHER_ISSUE_HTML_ID, ISSUE_2, COMPANY_A, "other.html", "text/html", HTML_BYTES),
    attachment(OTHER_COMPANY_HTML_ID, ISSUE_B, COMPANY_B, "foreign.html", "text/html", HTML_BYTES),
  ];
  objects = new Map(store.attachments.map((a) => [
    a.objectKey,
    a.id === PNG_ID ? PNG_BYTES : a.id === TEXT_ID ? TEXT_BYTES : a.id === HTML_V2_ID ? HTML_V2_BYTES : HTML_BYTES,
  ]));
  logActivity = vi.fn(async () => undefined);
}

function createApp(actor: Actor, storage: StorageService = createStorage(objects)) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).actor = actor;
    next();
  });
  app.use("/api", issueReviewedHtmlRoutes({} as any, storage, { store, logActivity: logActivity as any, canReadIssue: async (_req, issue) => issue.id !== privateDeniedIssueId }));
  app.use(errorHandler);
  return app;
}

function registerBody(overrides: Record<string, unknown> = {}) {
  return {
    companyId: COMPANY_A,
    expectedLatestVersion: 0,
    confirmExactBytesReviewed: true,
    html: { attachmentId: HTML_ID, sha256: sha(HTML_BYTES) },
    assets: [{ attachmentId: PNG_ID, sha256: sha(PNG_BYTES) }],
    ...overrides,
  };
}

describe("board-reviewed HTML registry routes", () => {
  beforeEach(() => { privateDeniedIssueId = null; seed(); });

  describe("authority", () => {
    it("hides private tasks from a same-company board user without issue access", async () => {
      privateDeniedIssueId = ISSUE_1;
      const app = createApp(BOARD);
      await request(app).get(`/api/issues/${ISSUE_1}/reviewed-html`).expect(404);
      await request(app).get(`/api/issues/${ISSUE_1}/reviewed-html/1`).expect(404);
      await request(app).post(`/api/issues/${ISSUE_1}/reviewed-html`).send(registerBody()).expect(404);
      await request(app).post(`/api/issues/${ISSUE_1}/reviewed-html/1/revoke`).send({ companyId: COMPANY_A }).expect(404);
      expect(store.reviews).toHaveLength(0);
      expect(logActivity).not.toHaveBeenCalled();
    });

    it("rejects agent registration, revocation and reads without touching the registry", async () => {
      const app = createApp(AGENT);
      const register = await request(app).post(`/api/issues/${ISSUE_1}/reviewed-html`).send(registerBody());
      expect(register.status).toBe(403);

      expect(store.reviews).toHaveLength(0);

      // A board-registered review exists; the agent still cannot revoke or read it here.
      await request(createApp(BOARD)).post(`/api/issues/${ISSUE_1}/reviewed-html`).send(registerBody()).expect(201);
      logActivity.mockClear();
      const revoke = await request(app).post(`/api/issues/${ISSUE_1}/reviewed-html/1/revoke`).send({ companyId: COMPANY_A });
      expect(revoke.status).toBe(403);
      expect(store.reviews[0]!.status).toBe("active");

      expect((await request(app).get(`/api/issues/${ISSUE_1}/reviewed-html`)).status).toBe(403);
      expect((await request(app).get(`/api/issues/${ISSUE_1}/reviewed-html/1`)).status).toBe(403);
      expect(logActivity).not.toHaveBeenCalled();
    });

    it("rejects unauthenticated callers", async () => {
      const res = await request(createApp({ type: "none" })).post(`/api/issues/${ISSUE_1}/reviewed-html`).send(registerBody());
      expect(res.status).toBe(403);
      expect(store.reviews).toHaveLength(0);
    });

    it("lets a read-only board viewer open reviews but not register them", async () => {
      const denied = await request(createApp(VIEWER)).post(`/api/issues/${ISSUE_1}/reviewed-html`).send(registerBody());
      expect(denied.status).toBe(403);
      await request(createApp(BOARD)).post(`/api/issues/${ISSUE_1}/reviewed-html`).send(registerBody()).expect(201);
      const read = await request(createApp(VIEWER)).get(`/api/issues/${ISSUE_1}/reviewed-html/1`);
      expect(read.status).toBe(200);
    });

    it("excludes Agent Chat conversation issues from registration, reads and revocation", async () => {
      const app = createApp(BOARD);
      await request(app).post(`/api/issues/${CONVERSATION_ISSUE}/reviewed-html`).send(registerBody()).expect(404);
      await request(app).get(`/api/issues/${CONVERSATION_ISSUE}/reviewed-html`).expect(404);
      await request(app).get(`/api/issues/${CONVERSATION_ISSUE}/reviewed-html/1`).expect(404);
      await request(app).post(`/api/issues/${CONVERSATION_ISSUE}/reviewed-html/1/revoke`)
        .send({ companyId: COMPANY_A }).expect(404);
      expect(store.reviews).toHaveLength(0);
      expect(logActivity).not.toHaveBeenCalled();
    });

    it("rejects bodies carrying extra fields such as paths or self-asserted trust", async () => {
      const app = createApp(BOARD);
      for (const extra of [{ path: "/etc/passwd" }, { url: "https://example.invalid/page.html" }, { trustState: "qa_verified" }]) {
        const res = await request(app).post(`/api/issues/${ISSUE_1}/reviewed-html`).send(registerBody(extra));
        expect(res.status).toBe(400);
      }
      const unconfirmed = await request(app)
        .post(`/api/issues/${ISSUE_1}/reviewed-html`)
        .send(registerBody({ confirmExactBytesReviewed: false }));
      expect(unconfirmed.status).toBe(400);
      expect(store.reviews).toHaveLength(0);
    });
  });

  describe("registration", () => {
    it("records server-hashed exact bytes as board-reviewed, not QA verified", async () => {
      const storage = createStorage(objects);
      const res = await request(createApp(BOARD, storage)).post(`/api/issues/${ISSUE_1}/reviewed-html`).send(registerBody());
      expect(res.status).toBe(201);
      expect(res.body.trustState).toBe("board_reviewed_bytes");
      expect(JSON.stringify(res.body)).not.toMatch(/qa[_ -]?verified/i);
      expect(res.body.descriptor).toEqual({
        kind: "paperclip.reviewed-html-preview",
        version: 1,
        scope: { companyId: COMPANY_A, issueId: ISSUE_1, taskId: ISSUE_1, reviewVersion: 1 },
        html: { attachmentId: HTML_ID, filename: "page.html", contentType: "text/html", byteSize: HTML_BYTES.length, sha256: sha(HTML_BYTES) },
        assets: [{
          attachmentId: PNG_ID,
          filename: "logo.png",
          contentType: "image/png",
          byteSize: PNG_BYTES.length,
          sha256: sha(PNG_BYTES),
          reference: "assets/logo.png",
        }],
      });
      expect(storage.getObject).toHaveBeenCalledTimes(2);
      expect(logActivity).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        action: "issue.reviewed_html_registered",
        actorType: "user",
        actorId: "board-user-1",
        entityId: ISSUE_1,
      }));
    });

    it("rejects a companyId that does not match the issue", async () => {
      const res = await request(createApp(BOARD))
        .post(`/api/issues/${ISSUE_1}/reviewed-html`)
        .send(registerBody({ companyId: COMPANY_B }));
      expect(res.status).toBe(422);
    });

    it("hides other companies' issues behind the same 404 as missing issues", async () => {
      const foreign = await request(createApp(OTHER_COMPANY_BOARD)).post(`/api/issues/${ISSUE_1}/reviewed-html`).send(registerBody());
      expect(foreign.status).toBe(404);
      const missing = await request(createApp(BOARD))
        .post("/api/issues/99999999-9999-4999-8999-999999999999/reviewed-html")
        .send(registerBody());
      expect(missing.status).toBe(404);
      expect(foreign.body).toEqual(missing.body);
    });

    it("rejects attachments from another issue, another company, or that do not exist", async () => {
      const app = createApp(BOARD);
      for (const attachmentId of [OTHER_ISSUE_HTML_ID, OTHER_COMPANY_HTML_ID, MISSING_ID]) {
        const res = await request(app)
          .post(`/api/issues/${ISSUE_1}/reviewed-html`)
          .send(registerBody({ html: { attachmentId, sha256: sha(HTML_BYTES) }, assets: [] }));
        expect(res.status).toBe(422);
        expect(res.body.code).toBe("reviewed_html_attachment_not_on_issue");
      }
      const mixed = await request(app)
        .post(`/api/issues/${ISSUE_1}/reviewed-html`)
        .send(registerBody({ assets: [{ attachmentId: OTHER_ISSUE_HTML_ID, sha256: sha(HTML_BYTES) }] }));
      expect(mixed.status).toBe(422);
      expect(store.reviews).toHaveLength(0);
    });

    it("rejects wrong MIME, oversize files, oversize bundles and duplicate listings", async () => {
      const app = createApp(BOARD);
      const textAsPage = await request(app)
        .post(`/api/issues/${ISSUE_1}/reviewed-html`)
        .send(registerBody({ html: { attachmentId: TEXT_ID, sha256: sha(TEXT_BYTES) }, assets: [] }));
      expect(textAsPage.status).toBe(422);

      const pageAsAsset = await request(app)
        .post(`/api/issues/${ISSUE_1}/reviewed-html`)
        .send(registerBody({ assets: [{ attachmentId: HTML_V2_ID, sha256: sha(HTML_V2_BYTES) }] }));
      expect(pageAsAsset.status).toBe(422);

      const tooBig = await request(app)
        .post(`/api/issues/${ISSUE_1}/reviewed-html`)
        .send(registerBody({ html: { attachmentId: BIG_ID, sha256: sha(HTML_BYTES) }, assets: [] }));
      expect(tooBig.status).toBe(422);

      const duplicate = await request(app)
        .post(`/api/issues/${ISSUE_1}/reviewed-html`)
        .send(registerBody({ assets: [{ attachmentId: HTML_ID, sha256: sha(HTML_BYTES) }] }));
      expect(duplicate.status).toBe(422);

      const assetIds = Array.from({ length: 5 }, (_, index) => `b0000000-0000-4000-8000-00000000000${index}`);
      for (const [index, id] of assetIds.entries()) {
        store.attachments.push(attachment(id, ISSUE_1, COMPANY_A, `tile-${index}.png`, "image/png", PNG_BYTES, {
          byteSize: 1024 * 1024 - 1,
          sha256: sha(Buffer.from(`tile-${index}`)),
        }));
      }
      const bundle = await request(app)
        .post(`/api/issues/${ISSUE_1}/reviewed-html`)
        .send(registerBody({ assets: assetIds.map((id, index) => ({ attachmentId: id, sha256: sha(Buffer.from(`tile-${index}`)) })) }));
      expect(bundle.status).toBe(422);
      expect(bundle.body.error).toMatch(/limit/);
      expect(store.reviews).toHaveLength(0);
    });

    it("rejects a reviewed hash that differs from the stored attachment", async () => {
      const res = await request(createApp(BOARD))
        .post(`/api/issues/${ISSUE_1}/reviewed-html`)
        .send(registerBody({ html: { attachmentId: HTML_ID, sha256: "0".repeat(64) } }));
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("reviewed_html_hash_mismatch");
    });

    it("rejects stored bytes that were tampered with, same length or longer", async () => {
      const htmlKey = store.attachments.find((a) => a.id === HTML_ID)!.objectKey;
      const sameLength = Buffer.from(HTML_BYTES);
      sameLength[sameLength.length - 2] = 0x21;
      objects.set(htmlKey, sameLength);
      const swapped = await request(createApp(BOARD)).post(`/api/issues/${ISSUE_1}/reviewed-html`).send(registerBody());
      expect(swapped.status).toBe(409);
      expect(swapped.body.code).toBe("reviewed_html_bytes_mismatch");

      objects.set(htmlKey, Buffer.concat([HTML_BYTES, Buffer.from("<script>1</script>")]));
      const longer = await request(createApp(BOARD, createStorage(objects, { omitLength: true })))
        .post(`/api/issues/${ISSUE_1}/reviewed-html`)
        .send(registerBody());
      expect(longer.status).toBe(409);
      expect(store.reviews).toHaveLength(0);
    });

    it("fails closed when storage cannot be read", async () => {
      objects.clear();
      const res = await request(createApp(BOARD)).post(`/api/issues/${ISSUE_1}/reviewed-html`).send(registerBody());
      expect(res.status).toBe(422);
      expect(store.reviews).toHaveLength(0);
    });

    it("rejects a stale expectedLatestVersion", async () => {
      const app = createApp(BOARD);
      await request(app).post(`/api/issues/${ISSUE_1}/reviewed-html`).send(registerBody()).expect(201);
      const stale = await request(app).post(`/api/issues/${ISSUE_1}/reviewed-html`).send(registerBody());
      expect(stale.status).toBe(409);
      expect(stale.body).toMatchObject({ code: "reviewed_html_stale_version", latestVersion: 1 });
      expect(store.reviews).toHaveLength(1);
    });
  });

  describe("versioned links", () => {
    it("supersedes the previous version so old links fail instead of showing new bytes", async () => {
      const app = createApp(BOARD);
      await request(app).post(`/api/issues/${ISSUE_1}/reviewed-html`).send(registerBody()).expect(201);
      const second = await request(app)
        .post(`/api/issues/${ISSUE_1}/reviewed-html`)
        .send(registerBody({
          expectedLatestVersion: 1,
          html: { attachmentId: HTML_V2_ID, sha256: sha(HTML_V2_BYTES) },
          assets: [],
        }));
      expect(second.status).toBe(201);
      expect(second.body.descriptor.scope.reviewVersion).toBe(2);

      const oldLink = await request(app).get(`/api/issues/${ISSUE_1}/reviewed-html/1`);
      expect(oldLink.status).toBe(410);
      expect(oldLink.body).toMatchObject({ code: "reviewed_html_superseded", reviewVersion: 1, activeVersion: 2 });
      expect(JSON.stringify(oldLink.body)).not.toContain(HTML_V2_ID);

      const current = await request(app).get(`/api/issues/${ISSUE_1}/reviewed-html/2`);
      expect(current.status).toBe(200);
      expect(current.headers["cache-control"]).toBe("no-store");
      expect(current.body.descriptor.html.attachmentId).toBe(HTML_V2_ID);

      const summary = await request(app).get(`/api/issues/${ISSUE_1}/reviewed-html`);
      expect(summary.body).toMatchObject({ activeVersion: 2, latestVersion: 2, trustState: "board_reviewed_bytes" });
    });

    it("revokes only the active version and makes its link fail", async () => {
      const app = createApp(BOARD);
      await request(app).post(`/api/issues/${ISSUE_1}/reviewed-html`).send(registerBody()).expect(201);
      const revoked = await request(app).post(`/api/issues/${ISSUE_1}/reviewed-html/1/revoke`).send({ companyId: COMPANY_A });
      expect(revoked.status).toBe(200);
      expect(logActivity).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ action: "issue.reviewed_html_revoked" }));

      const link = await request(app).get(`/api/issues/${ISSUE_1}/reviewed-html/1`);
      expect(link.status).toBe(410);
      expect(link.body).toMatchObject({ code: "reviewed_html_revoked", activeVersion: null });

      const again = await request(app).post(`/api/issues/${ISSUE_1}/reviewed-html/1/revoke`).send({ companyId: COMPANY_A });
      expect(again.status).toBe(409);
      const wrongCompany = await request(app).post(`/api/issues/${ISSUE_1}/reviewed-html/1/revoke`).send({ companyId: COMPANY_B });
      expect(wrongCompany.status).toBe(422);
    });

    it("binds a version to its issue: another issue's link and unknown versions return 404", async () => {
      const app = createApp(BOARD);
      await request(app).post(`/api/issues/${ISSUE_1}/reviewed-html`).send(registerBody()).expect(201);
      expect((await request(app).get(`/api/issues/${ISSUE_2}/reviewed-html/1`)).status).toBe(404);
      expect((await request(app).get(`/api/issues/${ISSUE_1}/reviewed-html/7`)).status).toBe(404);
      expect((await request(app).get(`/api/issues/${ISSUE_1}/reviewed-html/0`)).status).toBe(400);
      expect((await request(app).get(`/api/issues/${ISSUE_1}/reviewed-html/1abc`)).status).toBe(400);
      expect((await request(createApp(OTHER_COMPANY_BOARD)).get(`/api/issues/${ISSUE_1}/reviewed-html/1`)).status).toBe(404);
    });

    it("fails closed when a reviewed attachment is deleted or its record changes", async () => {
      const app = createApp(BOARD);
      await request(app).post(`/api/issues/${ISSUE_1}/reviewed-html`).send(registerBody()).expect(201);
      store.attachments = store.attachments.filter((a) => a.id !== PNG_ID);
      const deleted = await request(app).get(`/api/issues/${ISSUE_1}/reviewed-html/1`);
      expect(deleted.status).toBe(409);
      expect(deleted.body.code).toBe("reviewed_html_attachments_changed");
    });
  });

  describe("no alternate write surface", () => {
    const serverSrc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

    function sourceFiles(dir: string): string[] {
      return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return entry.name === "__tests__" ? [] : sourceFiles(full);
        return entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts") ? [full] : [];
      });
    }

    it("only the dedicated service touches the registry table", () => {
      const touching = sourceFiles(serverSrc)
        .filter((file) => /issueReviewedHtmlReviews|issue_reviewed_html_reviews/.test(fs.readFileSync(file, "utf8")))
        .map((file) => path.relative(serverSrc, file));
      expect(touching).toEqual(["services/issue-reviewed-html-reviews.ts"]);
    });

    it("only the board-only route file uses the registry service", () => {
      const users = sourceFiles(serverSrc)
        .filter((file) => fs.readFileSync(file, "utf8").includes("issue-reviewed-html-reviews.js"))
        .map((file) => path.relative(serverSrc, file));
      expect(users).toEqual(["routes/issue-reviewed-html.ts"]);
    });

    it("an agent-authored attachment manifest on the issue does not produce a review", async () => {
      // Agents may upload attachments (including JSON that claims a review);
      // the registry is still empty until a board actor registers bytes.
      store.attachments.push(attachment(
        "a0000000-0000-4000-8000-0000000000aa",
        ISSUE_1,
        COMPANY_A,
        "review-manifest.json",
        "application/json",
        Buffer.from(JSON.stringify({ reviewVersion: 1, html: HTML_ID, sha256: sha(HTML_BYTES), trustState: "qa_verified" })),
      ));
      const app = createApp(BOARD);
      expect((await request(app).get(`/api/issues/${ISSUE_1}/reviewed-html`)).body.activeVersion).toBeNull();
      expect((await request(app).get(`/api/issues/${ISSUE_1}/reviewed-html/1`)).status).toBe(404);
    });

    it("documents every reviewed-html operation as board-only", () => {
      const spec = buildOpenApiSpec() as any;
      const operations = [
        spec.paths["/api/issues/{issueId}/reviewed-html"].get,
        spec.paths["/api/issues/{issueId}/reviewed-html"].post,
        spec.paths["/api/issues/{issueId}/reviewed-html/{reviewVersion}"].get,
        spec.paths["/api/issues/{issueId}/reviewed-html/{reviewVersion}/revoke"].post,
      ];
      for (const operation of operations) {
        expect(operation["x-paperclip-authorization"]).toMatchObject({ actor: "board" });
      }
    });
  });
});
