import { and, desc, eq, inArray } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { assets, issueAttachments, issueReviewedHtmlReviews, issues } from "@paperclipai/db";
import {
  REVIEWED_HTML_TRUST_STATE,
  type ReviewedHtmlReview,
  type ReviewedHtmlReviewFiles,
  type ReviewedHtmlReviewStatus,
} from "@paperclipai/shared";

/**
 * Persistence for board-reviewed HTML attachment bytes. This module is the only
 * writer of `issue_reviewed_html_reviews`; the board-only reviewed-html routes
 * are its only caller. Do not expose these methods through generic issue,
 * document, comment or work-product surfaces.
 */

export interface ReviewedHtmlStoredAttachment {
  id: string;
  companyId: string;
  issueId: string;
  objectKey: string;
  contentType: string;
  byteSize: number;
  sha256: string;
  originalFilename: string | null;
}

export type RegisterReviewedHtmlResult =
  | { kind: "created"; review: ReviewedHtmlReview; supersededVersion: number | null }
  | { kind: "stale"; latestVersion: number };

export interface ReviewedHtmlReviewStore {
  getIssue(issueId: string): Promise<{ id: string; companyId: string; conversationAgentId: string | null } | null>;
  /** Only attachments that belong to exactly this issue and company. */
  listIssueAttachments(companyId: string, issueId: string, attachmentIds: string[]): Promise<ReviewedHtmlStoredAttachment[]>;
  getLatest(companyId: string, issueId: string): Promise<ReviewedHtmlReview | null>;
  getActive(companyId: string, issueId: string): Promise<ReviewedHtmlReview | null>;
  getVersion(companyId: string, issueId: string, reviewVersion: number): Promise<ReviewedHtmlReview | null>;
  register(input: {
    companyId: string;
    issueId: string;
    expectedLatestVersion: number;
    files: ReviewedHtmlReviewFiles;
    totalBytes: number;
    reviewedByUserId: string;
  }): Promise<RegisterReviewedHtmlResult>;
  revoke(input: {
    companyId: string;
    issueId: string;
    reviewVersion: number;
    revokedByUserId: string;
  }): Promise<ReviewedHtmlReview | null>;
}

type ReviewRow = typeof issueReviewedHtmlReviews.$inferSelect;

function toReview(row: ReviewRow): ReviewedHtmlReview {
  return {
    id: row.id,
    companyId: row.companyId,
    issueId: row.issueId,
    reviewVersion: row.reviewVersion,
    status: row.status as ReviewedHtmlReviewStatus,
    trustState: REVIEWED_HTML_TRUST_STATE,
    files: row.files,
    totalBytes: row.totalBytes,
    reviewedAt: row.reviewedAt.toISOString(),
    reviewedByUserId: row.reviewedByUserId,
    endedAt: row.endedAt ? row.endedAt.toISOString() : null,
    endedByUserId: row.endedByUserId,
  };
}

export function issueReviewedHtmlReviewService(db: Db): ReviewedHtmlReviewStore {
  const t = issueReviewedHtmlReviews;
  const scoped = (companyId: string, issueId: string) => and(eq(t.companyId, companyId), eq(t.issueId, issueId));

  return {
    getIssue: async (issueId) =>
      db
        .select({ id: issues.id, companyId: issues.companyId, conversationAgentId: issues.conversationAgentId })
        .from(issues)
        .where(eq(issues.id, issueId))
        .then((rows) => rows[0] ?? null),

    listIssueAttachments: async (companyId, issueId, attachmentIds) => {
      if (attachmentIds.length === 0) return [];
      return db
        .select({
          id: issueAttachments.id,
          companyId: issueAttachments.companyId,
          issueId: issueAttachments.issueId,
          objectKey: assets.objectKey,
          contentType: assets.contentType,
          byteSize: assets.byteSize,
          sha256: assets.sha256,
          originalFilename: assets.originalFilename,
        })
        .from(issueAttachments)
        .innerJoin(assets, eq(issueAttachments.assetId, assets.id))
        .where(
          and(
            eq(issueAttachments.companyId, companyId),
            eq(issueAttachments.issueId, issueId),
            eq(assets.companyId, companyId),
            inArray(issueAttachments.id, attachmentIds),
          ),
        );
    },

    getLatest: async (companyId, issueId) =>
      db
        .select()
        .from(t)
        .where(scoped(companyId, issueId))
        .orderBy(desc(t.reviewVersion))
        .limit(1)
        .then((rows) => (rows[0] ? toReview(rows[0]) : null)),

    getActive: async (companyId, issueId) =>
      db
        .select()
        .from(t)
        .where(and(scoped(companyId, issueId), eq(t.status, "active")))
        .then((rows) => (rows[0] ? toReview(rows[0]) : null)),

    getVersion: async (companyId, issueId, reviewVersion) =>
      db
        .select()
        .from(t)
        .where(and(scoped(companyId, issueId), eq(t.reviewVersion, reviewVersion)))
        .then((rows) => (rows[0] ? toReview(rows[0]) : null)),

    register: async (input) =>
      db.transaction(async (tx) => {
        // Serialize registrations per issue; the unique indexes are the backstop.
        await tx
          .select({ id: issues.id })
          .from(issues)
          .where(and(eq(issues.id, input.issueId), eq(issues.companyId, input.companyId)))
          .for("update");
        const latest = await tx
          .select({ reviewVersion: t.reviewVersion })
          .from(t)
          .where(scoped(input.companyId, input.issueId))
          .orderBy(desc(t.reviewVersion))
          .limit(1)
          .then((rows) => rows[0]?.reviewVersion ?? 0);
        if (latest !== input.expectedLatestVersion) {
          return { kind: "stale" as const, latestVersion: latest };
        }

        const now = new Date();
        const superseded = await tx
          .update(t)
          .set({ status: "superseded", endedAt: now, endedByUserId: input.reviewedByUserId, updatedAt: now })
          .where(and(scoped(input.companyId, input.issueId), eq(t.status, "active")))
          .returning({ reviewVersion: t.reviewVersion });
        const [created] = await tx
          .insert(t)
          .values({
            companyId: input.companyId,
            issueId: input.issueId,
            reviewVersion: latest + 1,
            status: "active",
            trustState: REVIEWED_HTML_TRUST_STATE,
            htmlAttachmentId: input.files.html.attachmentId,
            files: input.files,
            totalBytes: input.totalBytes,
            reviewedAt: now,
            reviewedByUserId: input.reviewedByUserId,
            createdAt: now,
            updatedAt: now,
          })
          .returning();
        return {
          kind: "created" as const,
          review: toReview(created!),
          supersededVersion: superseded[0]?.reviewVersion ?? null,
        };
      }),

    revoke: async (input) => {
      const now = new Date();
      const [row] = await db
        .update(t)
        .set({ status: "revoked", endedAt: now, endedByUserId: input.revokedByUserId, updatedAt: now })
        .where(
          and(
            scoped(input.companyId, input.issueId),
            eq(t.reviewVersion, input.reviewVersion),
            eq(t.status, "active"),
          ),
        )
        .returning();
      return row ? toReview(row) : null;
    },
  };
}
