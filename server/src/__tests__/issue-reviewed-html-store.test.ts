import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { companies, createDb, issueReviewedHtmlReviews, issues } from "@paperclipai/db";
import { getEmbeddedPostgresTestSupport, startEmbeddedPostgresTestDatabase } from "./helpers/embedded-postgres.js";
import { issueReviewedHtmlReviewService } from "../services/issue-reviewed-html-reviews.js";

const support = await getEmbeddedPostgresTestSupport();
const describePostgres = support.supported ? describe : describe.skip;

// Fictional identities and bytes only. This exercises the actual PostgreSQL
// transaction lock and unique indexes, which a route MemoryStore cannot prove.
const COMPANY_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ISSUE_ID = "11111111-1111-4111-8111-111111111111";
const HTML_ID = "22222222-2222-4222-8222-222222222222";

const files = {
  html: {
    attachmentId: HTML_ID,
    filename: "page.html",
    contentType: "text/html",
    byteSize: 9,
    sha256: "a".repeat(64),
  },
  assets: [],
};

describePostgres("issue reviewed HTML store transaction", () => {
  let temporaryDb: Awaited<ReturnType<typeof startEmbeddedPostgresTestDatabase>> | null = null;
  let db!: ReturnType<typeof createDb>;

  beforeAll(async () => {
    temporaryDb = await startEmbeddedPostgresTestDatabase("paperclip-reviewed-html-");
    db = createDb(temporaryDb.connectionString);
  }, 30_000);

  afterEach(async () => {
    await db.delete(issueReviewedHtmlReviews);
    await db.delete(issues);
    await db.delete(companies);
  });

  afterAll(async () => {
    await temporaryDb?.cleanup();
  });

  it("serializes concurrent registrations and preserves one active version", async () => {
    await db.insert(companies).values({ id: COMPANY_ID, name: "Fictional", issuePrefix: "FIX" });
    await db.insert(issues).values({
      id: ISSUE_ID,
      companyId: COMPANY_ID,
      identifier: "FIX-1",
      title: "Fictional page",
      status: "todo",
      priority: "medium",
    });
    const store = issueReviewedHtmlReviewService(db);
    const input = {
      companyId: COMPANY_ID,
      issueId: ISSUE_ID,
      expectedLatestVersion: 0,
      files,
      totalBytes: 9,
      reviewedByUserId: "fictional-board-user",
    };
    const results = await Promise.all([store.register(input), store.register(input)]);
    expect(results.map((result) => result.kind).sort()).toEqual(["created", "stale"]);
    expect((await store.getActive(COMPANY_ID, ISSUE_ID))?.reviewVersion).toBe(1);
    expect(await db.select().from(issueReviewedHtmlReviews)).toHaveLength(1);

    const replacement = await store.register({ ...input, expectedLatestVersion: 1 });
    expect(replacement.kind).toBe("created");
    expect((await store.getVersion(COMPANY_ID, ISSUE_ID, 1))?.status).toBe("superseded");
    expect((await store.getActive(COMPANY_ID, ISSUE_ID))?.reviewVersion).toBe(2);
    expect((await store.revoke({
      companyId: COMPANY_ID,
      issueId: ISSUE_ID,
      reviewVersion: 2,
      revokedByUserId: "fictional-board-user",
    }))?.status).toBe("revoked");
    expect(await store.getActive(COMPANY_ID, ISSUE_ID)).toBeNull();
  });
});
