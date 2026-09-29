import { z } from "zod";

/**
 * Board-reviewed HTML attachment registry contract.
 *
 * A review records the exact bytes (attachment ids, SHA-256, sizes, MIME) of
 * one HTML attachment plus its listed assets that a board operator explicitly
 * reviewed. It is written only by board actors through the dedicated
 * `/issues/:issueId/reviewed-html` routes. The trust state is
 * `board_reviewed_bytes`: it says a board operator registered these bytes, not
 * that an independent QA process verified them.
 *
 * The attachments themselves stay ordinary issue attachments, readable by
 * anyone with issue read access (including agents on that issue).
 */

export const REVIEWED_HTML_TRUST_STATE = "board_reviewed_bytes" as const;
export type ReviewedHtmlTrustState = typeof REVIEWED_HTML_TRUST_STATE;

export const REVIEWED_HTML_REVIEW_STATUSES = ["active", "revoked", "superseded"] as const;
export type ReviewedHtmlReviewStatus = (typeof REVIEWED_HTML_REVIEW_STATUSES)[number];

/** Must match the descriptor contract in `ui/src/lib/reviewed-html-preview.ts`. */
export const REVIEWED_HTML_DESCRIPTOR_KIND = "paperclip.reviewed-html-preview" as const;
export const REVIEWED_HTML_DESCRIPTOR_VERSION = 1 as const;

export const REVIEWED_HTML_MAX_FILE_BYTES = 1024 * 1024;
export const REVIEWED_HTML_MAX_TOTAL_BYTES = 4 * 1024 * 1024;
export const REVIEWED_HTML_MAX_ASSETS = 16;

export const REVIEWED_HTML_CONTENT_TYPE = "text/html" as const;
export const REVIEWED_HTML_EXTENSIONS: readonly string[] = [".html", ".htm"];
export const REVIEWED_HTML_ASSET_EXTENSIONS: Readonly<Record<string, readonly string[]>> = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "font/ttf": [".ttf"],
};

export const REVIEWED_HTML_FILENAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const LOWERCASE_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SHA256_HEX_RE = /^[0-9a-f]{64}$/;

export interface ReviewedHtmlFile {
  attachmentId: string;
  filename: string;
  contentType: string;
  byteSize: number;
  /** Lowercase hex SHA-256 computed by the server from the stored bytes. */
  sha256: string;
}

export interface ReviewedHtmlAssetFile extends ReviewedHtmlFile {
  /** Always `assets/<filename>`; never a caller-supplied path. */
  reference: string;
}

export interface ReviewedHtmlReviewFiles {
  html: ReviewedHtmlFile;
  assets: ReviewedHtmlAssetFile[];
}

export interface ReviewedHtmlReview {
  id: string;
  companyId: string;
  issueId: string;
  reviewVersion: number;
  status: ReviewedHtmlReviewStatus;
  trustState: ReviewedHtmlTrustState;
  files: ReviewedHtmlReviewFiles;
  totalBytes: number;
  reviewedAt: string;
  reviewedByUserId: string;
  endedAt: string | null;
  endedByUserId: string | null;
}

export interface ReviewedHtmlReviewSummary {
  issueId: string;
  activeVersion: number | null;
  latestVersion: number;
  activeReviewedAt: string | null;
  trustState: ReviewedHtmlTrustState;
}

export interface ReviewedHtmlPreviewDescriptorPayload {
  kind: typeof REVIEWED_HTML_DESCRIPTOR_KIND;
  version: typeof REVIEWED_HTML_DESCRIPTOR_VERSION;
  scope: { companyId: string; issueId: string; taskId: string; reviewVersion: number };
  html: ReviewedHtmlFile;
  assets: ReviewedHtmlAssetFile[];
}

export interface ReviewedHtmlDescriptorResponse {
  trustState: ReviewedHtmlTrustState;
  reviewVersion: number;
  reviewedAt: string;
  reviewedByUserId: string;
  descriptor: ReviewedHtmlPreviewDescriptorPayload;
}

/** Returned with 410 when a link points at a revoked or superseded review. */
export interface ReviewedHtmlEndedResponse {
  error: string;
  code: "reviewed_html_revoked" | "reviewed_html_superseded";
  reviewVersion: number;
  activeVersion: number | null;
}

const reviewedFileSelectionSchema = z
  .object({
    attachmentId: z.string().regex(LOWERCASE_UUID_RE, "attachmentId must be a lowercase UUID"),
    /** The SHA-256 the board operator reviewed; must equal the server-computed hash. */
    sha256: z.string().regex(SHA256_HEX_RE, "sha256 must be 64 lowercase hex characters"),
  })
  .strict();

export const registerReviewedHtmlReviewSchema = z
  .object({
    companyId: z.string().regex(LOWERCASE_UUID_RE, "companyId must be a lowercase UUID"),
    /** Latest review version the operator saw (0 when none); stale values are rejected. */
    expectedLatestVersion: z.number().int().min(0),
    confirmExactBytesReviewed: z.literal(true),
    html: reviewedFileSelectionSchema,
    assets: z.array(reviewedFileSelectionSchema).max(REVIEWED_HTML_MAX_ASSETS).default([]),
  })
  .strict();

export type RegisterReviewedHtmlReview = z.infer<typeof registerReviewedHtmlReviewSchema>;

export const revokeReviewedHtmlReviewSchema = z
  .object({
    companyId: z.string().regex(LOWERCASE_UUID_RE, "companyId must be a lowercase UUID"),
  })
  .strict();

export type RevokeReviewedHtmlReview = z.infer<typeof revokeReviewedHtmlReviewSchema>;
