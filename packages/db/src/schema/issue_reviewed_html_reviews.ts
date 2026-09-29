import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { ReviewedHtmlReviewFiles } from "@paperclipai/shared";
import { companies } from "./companies.js";
import { issues } from "./issues.js";

/**
 * Board-registered exact-byte reviews of one HTML issue attachment and its
 * listed assets. Rows are written only by the board-only reviewed-html routes;
 * re-registration supersedes the active row and inserts the next version in
 * one transaction, so an old version link can never resolve to new bytes.
 *
 * `html_attachment_id` deliberately has no foreign key: deleting the
 * attachment must not erase the review record. Reads re-check that every
 * listed attachment still exists on the issue with the recorded hash.
 */
export const issueReviewedHtmlReviews = pgTable(
  "issue_reviewed_html_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    issueId: uuid("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
    reviewVersion: integer("review_version").notNull(),
    status: text("status").notNull().default("active"),
    trustState: text("trust_state").notNull().default("board_reviewed_bytes"),
    htmlAttachmentId: uuid("html_attachment_id").notNull(),
    files: jsonb("files").$type<ReviewedHtmlReviewFiles>().notNull(),
    totalBytes: integer("total_bytes").notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull().defaultNow(),
    reviewedByUserId: text("reviewed_by_user_id").notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    endedByUserId: text("ended_by_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIssueIdx: index("issue_reviewed_html_reviews_company_issue_idx").on(table.companyId, table.issueId),
    versionUq: uniqueIndex("issue_reviewed_html_reviews_version_uq").on(
      table.companyId,
      table.issueId,
      table.reviewVersion,
    ),
    activeUq: uniqueIndex("issue_reviewed_html_reviews_active_uq")
      .on(table.companyId, table.issueId)
      .where(sql`${table.status} = 'active'`),
    statusCheck: check(
      "issue_reviewed_html_reviews_status_check",
      sql`${table.status} in ('active', 'revoked', 'superseded')`,
    ),
    trustStateCheck: check(
      "issue_reviewed_html_reviews_trust_state_check",
      sql`${table.trustState} in ('board_reviewed_bytes')`,
    ),
    reviewVersionCheck: check("issue_reviewed_html_reviews_version_check", sql`${table.reviewVersion} >= 1`),
    totalBytesCheck: check(
      "issue_reviewed_html_reviews_total_bytes_check",
      sql`${table.totalBytes} > 0 and ${table.totalBytes} <= 4194304`,
    ),
  }),
);
