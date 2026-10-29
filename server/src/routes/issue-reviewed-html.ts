import { createHash } from "node:crypto";
import { Router, type Request, type Response } from "express";
import type { Db } from "@paperclipai/db";
import {
  REVIEWED_HTML_ASSET_EXTENSIONS,
  REVIEWED_HTML_CONTENT_TYPE,
  REVIEWED_HTML_DESCRIPTOR_KIND,
  REVIEWED_HTML_DESCRIPTOR_VERSION,
  REVIEWED_HTML_EXTENSIONS,
  REVIEWED_HTML_FILENAME_RE,
  REVIEWED_HTML_MAX_FILE_BYTES,
  REVIEWED_HTML_MAX_TOTAL_BYTES,
  REVIEWED_HTML_TRUST_STATE,
  registerReviewedHtmlReviewSchema,
  revokeReviewedHtmlReviewSchema,
  type ReviewedHtmlAssetFile,
  type ReviewedHtmlDescriptorResponse,
  type ReviewedHtmlEndedResponse,
  type ReviewedHtmlFile,
  type ReviewedHtmlReview,
  type ReviewedHtmlReviewSummary,
} from "@paperclipai/shared";
import { normalizeContentType } from "../attachment-types.js";
import { HttpError, conflict, unprocessable } from "../errors.js";
import { accessService } from "../services/access.js";
import { logActivity as defaultLogActivity } from "../services/activity-log.js";
import {
  issueReviewedHtmlReviewService,
  type ReviewedHtmlReviewStore,
  type ReviewedHtmlStoredAttachment,
} from "../services/issue-reviewed-html-reviews.js";
import type { StorageService } from "../storage/types.js";
import { assertBoard, assertCompanyAccess, getActorInfo, hasCompanyAccess } from "./authz.js";

/**
 * Board-only registry of exact reviewed HTML attachment bytes.
 *
 * - Registration and revocation require a board actor with write access to the
 *   issue's company. Agents get 403 on every route here; no other route writes
 *   this registry.
 * - The server reads each listed attachment from storage with a hard byte cap,
 *   computes SHA-256 itself, and requires it to equal both the recorded asset
 *   hash and the hash the board operator says they reviewed.
 * - Descriptors are only served for the active version. Revoked or superseded
 *   versions return 410, so an old link never resolves to newer bytes.
 *
 * This does not serve HTML. The UI downloads bytes through the existing
 * attachment content route and renders them in the sandboxed preview component.
 */

const LOWERCASE_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const REVIEW_VERSION_RE = /^[1-9][0-9]{0,8}$/;

const ASSET_SIGNATURES: Record<string, (bytes: Buffer) => boolean> = {
  "image/png": (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/jpeg": (b) => b.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
  "image/gif": (b) => ["GIF87a", "GIF89a"].includes(b.subarray(0, 6).toString("latin1")),
  "image/webp": (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
  "font/ttf": (b) => b.subarray(0, 4).equals(Buffer.from([0x00, 0x01, 0x00, 0x00])),
};

function extensionOf(filename: string) {
  const dot = filename.lastIndexOf(".");
  return dot < 0 ? "" : filename.slice(dot).toLowerCase();
}

function sha256Hex(bytes: Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Reads exactly `expectedBytes` from storage. Fails closed (never buffers past
 * the cap) when the stored object is larger, shorter or unreadable.
 */
async function readExactStoredBytes(
  storage: StorageService,
  attachment: ReviewedHtmlStoredAttachment,
): Promise<Buffer> {
  const label = attachment.originalFilename ?? attachment.id;
  let object: Awaited<ReturnType<StorageService["getObject"]>>;
  try {
    object = await storage.getObject(attachment.companyId, attachment.objectKey);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw unprocessable(`Stored bytes for ${label} could not be read; registration refused`);
  }
  if (object.contentLength !== undefined && object.contentLength !== attachment.byteSize) {
    object.stream.destroy();
    throw conflict(`Stored bytes for ${label} do not match the recorded attachment size`, {
      code: "reviewed_html_bytes_mismatch",
    });
  }
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    for await (const chunk of object.stream) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
      total += buffer.length;
      if (total > attachment.byteSize) {
        throw conflict(`Stored bytes for ${label} exceed the recorded attachment size`, {
          code: "reviewed_html_bytes_mismatch",
        });
      }
      chunks.push(buffer);
    }
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw unprocessable(`Stored bytes for ${label} could not be read; registration refused`);
  } finally {
    object.stream.destroy();
  }
  if (total !== attachment.byteSize) {
    throw conflict(`Stored bytes for ${label} are shorter than the recorded attachment size`, {
      code: "reviewed_html_bytes_mismatch",
    });
  }
  return Buffer.concat(chunks, total);
}

function reviewedFileFrom(attachment: ReviewedHtmlStoredAttachment, role: "html" | "asset"): ReviewedHtmlFile {
  const filename = attachment.originalFilename ?? "";
  if (!REVIEWED_HTML_FILENAME_RE.test(filename) || filename.includes("..")) {
    throw unprocessable(`Attachment ${attachment.id} needs a plain file name (letters, digits, ".", "_", "-")`);
  }
  const contentType = normalizeContentType(attachment.contentType);
  const allowedExtensions = role === "html"
    ? contentType === REVIEWED_HTML_CONTENT_TYPE ? REVIEWED_HTML_EXTENSIONS : null
    : REVIEWED_HTML_ASSET_EXTENSIONS[contentType] ?? null;
  if (!allowedExtensions) {
    throw unprocessable(`${filename}: content type "${contentType}" is not allowed as ${role === "html" ? "the page" : "an asset"}`);
  }
  if (!allowedExtensions.includes(extensionOf(filename))) {
    throw unprocessable(`${filename}: file extension does not match ${contentType}`);
  }
  if (!Number.isSafeInteger(attachment.byteSize) || attachment.byteSize < 1) {
    throw unprocessable(`${filename}: attachment is empty`);
  }
  if (attachment.byteSize > REVIEWED_HTML_MAX_FILE_BYTES) {
    throw unprocessable(`${filename}: ${attachment.byteSize} bytes exceeds the ${REVIEWED_HTML_MAX_FILE_BYTES}-byte limit`);
  }
  if (!/^[0-9a-f]{64}$/.test(attachment.sha256)) {
    throw unprocessable(`${filename}: stored attachment hash is not a SHA-256 digest`);
  }
  return {
    attachmentId: attachment.id,
    filename,
    contentType,
    byteSize: attachment.byteSize,
    sha256: attachment.sha256,
  };
}

function buildDescriptorResponse(review: ReviewedHtmlReview): ReviewedHtmlDescriptorResponse {
  return {
    trustState: REVIEWED_HTML_TRUST_STATE,
    reviewVersion: review.reviewVersion,
    reviewedAt: review.reviewedAt,
    reviewedByUserId: review.reviewedByUserId,
    descriptor: {
      kind: REVIEWED_HTML_DESCRIPTOR_KIND,
      version: REVIEWED_HTML_DESCRIPTOR_VERSION,
      scope: {
        companyId: review.companyId,
        issueId: review.issueId,
        // A Paperclip task is its issue.
        taskId: review.issueId,
        reviewVersion: review.reviewVersion,
      },
      html: review.files.html,
      assets: review.files.assets,
    },
  };
}

export interface IssueReviewedHtmlRouteOptions {
  store?: ReviewedHtmlReviewStore;
  logActivity?: typeof defaultLogActivity;
  canReadIssue?: (req: Request, issue: { id: string; companyId: string }) => Promise<boolean>;
}

export function issueReviewedHtmlRoutes(
  db: Db,
  storage: StorageService,
  options: IssueReviewedHtmlRouteOptions = {},
) {
  const router = Router();
  const store = options.store ?? issueReviewedHtmlReviewService(db);
  const logActivity = options.logActivity ?? defaultLogActivity;
  const access = accessService(db);
  const canReadIssue = options.canReadIssue ?? (async (req, issue) =>
    (await access.decide({
      actor: req.actor,
      action: "issue:read",
      resource: { type: "issue", issueId: issue.id, companyId: issue.companyId },
    })).allowed);

  /** Board-only ordinary issue lookup; missing, Agent Chat and cross-company all return 404. */
  async function loadIssueForBoard(req: Request, res: Response) {
    assertBoard(req);
    const issueId = req.params.issueId as string;
    const issue = LOWERCASE_UUID_RE.test(issueId) ? await store.getIssue(issueId) : null;
    if (!issue || issue.conversationAgentId !== null || !hasCompanyAccess(req, issue.companyId)) {
      res.status(404).json({ error: "Issue not found" });
      return null;
    }
    if (!(await canReadIssue(req, issue))) {
      res.status(404).json({ error: "Issue not found" });
      return null;
    }
    assertCompanyAccess(req, issue.companyId);
    return issue;
  }

  function parseReviewVersion(req: Request, res: Response) {
    const raw = req.params.reviewVersion as string;
    if (!REVIEW_VERSION_RE.test(raw)) {
      res.status(400).json({ error: "reviewVersion must be a positive integer" });
      return null;
    }
    return Number(raw);
  }

  router.get("/issues/:issueId/reviewed-html", async (req, res) => {
    const issue = await loadIssueForBoard(req, res);
    if (!issue) return;
    const [latest, active] = await Promise.all([
      store.getLatest(issue.companyId, issue.id),
      store.getActive(issue.companyId, issue.id),
    ]);
    const summary: ReviewedHtmlReviewSummary = {
      issueId: issue.id,
      activeVersion: active?.reviewVersion ?? null,
      latestVersion: latest?.reviewVersion ?? 0,
      activeReviewedAt: active?.reviewedAt ?? null,
      trustState: REVIEWED_HTML_TRUST_STATE,
    };
    res.setHeader("Cache-Control", "no-store");
    res.json(summary);
  });

  router.get("/issues/:issueId/reviewed-html/:reviewVersion", async (req, res) => {
    const issue = await loadIssueForBoard(req, res);
    if (!issue) return;
    const reviewVersion = parseReviewVersion(req, res);
    if (reviewVersion === null) return;
    res.setHeader("Cache-Control", "no-store");

    const review = await store.getVersion(issue.companyId, issue.id, reviewVersion);
    if (!review) {
      res.status(404).json({ error: "Reviewed HTML version not found" });
      return;
    }
    if (review.status !== "active") {
      const active = await store.getActive(issue.companyId, issue.id);
      const body: ReviewedHtmlEndedResponse = {
        error: review.status === "revoked"
          ? `Review version ${reviewVersion} was revoked`
          : `Review version ${reviewVersion} was superseded`,
        code: review.status === "revoked" ? "reviewed_html_revoked" : "reviewed_html_superseded",
        reviewVersion,
        activeVersion: active?.reviewVersion ?? null,
      };
      res.status(410).json(body);
      return;
    }

    // Fail closed if any reviewed attachment was deleted or no longer matches.
    const listed = [review.files.html, ...review.files.assets];
    const current = await store.listIssueAttachments(
      issue.companyId,
      issue.id,
      listed.map((file) => file.attachmentId),
    );
    const byId = new Map(current.map((row) => [row.id, row]));
    const unchanged = listed.every((file) => {
      const row = byId.get(file.attachmentId);
      return row
        && row.sha256 === file.sha256
        && row.byteSize === file.byteSize
        && normalizeContentType(row.contentType) === file.contentType;
    });
    if (!unchanged) {
      res.status(409).json({
        error: "A reviewed attachment was removed or changed; register a new review",
        code: "reviewed_html_attachments_changed",
      });
      return;
    }

    res.json(buildDescriptorResponse(review));
  });

  router.post(
    "/issues/:issueId/reviewed-html",
    async (req, res) => {
      const issue = await loadIssueForBoard(req, res);
      if (!issue) return;
      const body = registerReviewedHtmlReviewSchema.parse(req.body);
      if (body.companyId !== issue.companyId) {
        res.status(422).json({ error: "companyId does not match the issue's company" });
        return;
      }

      const selections = [body.html, ...body.assets];
      const ids = selections.map((selection) => selection.attachmentId);
      if (new Set(ids).size !== ids.length) {
        res.status(422).json({ error: "An attachment is listed more than once" });
        return;
      }

      const rows = await store.listIssueAttachments(issue.companyId, issue.id, ids);
      const byId = new Map(rows.map((row) => [row.id, row]));
      const missing = ids.filter((id) => !byId.has(id));
      if (missing.length > 0) {
        res.status(422).json({
          error: "Every reviewed file must be an attachment on this issue",
          code: "reviewed_html_attachment_not_on_issue",
          attachmentIds: missing,
        });
        return;
      }

      const html = reviewedFileFrom(byId.get(body.html.attachmentId)!, "html");
      const assets: ReviewedHtmlAssetFile[] = body.assets.map((selection) => {
        const file = reviewedFileFrom(byId.get(selection.attachmentId)!, "asset");
        return { ...file, reference: `assets/${file.filename}` };
      });
      const totalBytes = assets.reduce((sum, asset) => sum + asset.byteSize, html.byteSize);
      if (totalBytes > REVIEWED_HTML_MAX_TOTAL_BYTES) {
        res.status(422).json({ error: `Reviewed files total ${totalBytes} bytes; the limit is ${REVIEWED_HTML_MAX_TOTAL_BYTES}` });
        return;
      }
      const filenames = new Set<string>();
      const hashes = new Set<string>();
      for (const file of [html, ...assets]) {
        if (filenames.has(file.filename.toLowerCase()) || hashes.has(file.sha256)) {
          res.status(422).json({ error: `${file.filename} duplicates another reviewed file's name or bytes` });
          return;
        }
        filenames.add(file.filename.toLowerCase());
        hashes.add(file.sha256);
      }

      // The operator's reviewed hash must equal the recorded hash...
      for (const selection of selections) {
        if (byId.get(selection.attachmentId)!.sha256 !== selection.sha256) {
          res.status(409).json({
            error: "Reviewed SHA-256 does not match the stored attachment",
            code: "reviewed_html_hash_mismatch",
            attachmentId: selection.attachmentId,
          });
          return;
        }
      }
      // ...and the bytes actually in storage, hashed by the server. Sequential
      // reads keep peak memory at one capped file.
      for (const file of [html, ...assets]) {
        const bytes = await readExactStoredBytes(storage, byId.get(file.attachmentId)!);
        if (sha256Hex(bytes) !== file.sha256) {
          res.status(409).json({
            error: `Stored bytes for ${file.filename} do not match the reviewed SHA-256`,
            code: "reviewed_html_bytes_mismatch",
            attachmentId: file.attachmentId,
          });
          return;
        }
        const signature = ASSET_SIGNATURES[file.contentType];
        if (signature && !signature(bytes)) {
          res.status(422).json({ error: `${file.filename} is not a valid ${file.contentType} file` });
          return;
        }
      }

      const actor = getActorInfo(req);
      const result = await store.register({
        companyId: issue.companyId,
        issueId: issue.id,
        expectedLatestVersion: body.expectedLatestVersion,
        files: { html, assets },
        totalBytes,
        reviewedByUserId: actor.actorId,
      });
      if (result.kind === "stale") {
        res.status(409).json({
          error: `expectedLatestVersion ${body.expectedLatestVersion} is stale; latest is ${result.latestVersion}`,
          code: "reviewed_html_stale_version",
          latestVersion: result.latestVersion,
        });
        return;
      }

      await logActivity(db, {
        companyId: issue.companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        runId: actor.runId,
        agentApiKeyId: actor.agentApiKeyId,
        action: "issue.reviewed_html_registered",
        entityType: "issue",
        entityId: issue.id,
        issueId: issue.id,
        details: {
          reviewVersion: result.review.reviewVersion,
          supersededVersion: result.supersededVersion,
          trustState: REVIEWED_HTML_TRUST_STATE,
          files: [html, ...assets].map((file) => ({
            attachmentId: file.attachmentId,
            sha256: file.sha256,
            byteSize: file.byteSize,
            contentType: file.contentType,
          })),
          totalBytes,
        },
      });

      res.status(201).json(buildDescriptorResponse(result.review));
    },
  );

  router.post(
    "/issues/:issueId/reviewed-html/:reviewVersion/revoke",
    async (req, res) => {
      const issue = await loadIssueForBoard(req, res);
      if (!issue) return;
      const reviewVersion = parseReviewVersion(req, res);
      if (reviewVersion === null) return;
      if (revokeReviewedHtmlReviewSchema.parse(req.body).companyId !== issue.companyId) {
        res.status(422).json({ error: "companyId does not match the issue's company" });
        return;
      }

      const actor = getActorInfo(req);
      const revoked = await store.revoke({
        companyId: issue.companyId,
        issueId: issue.id,
        reviewVersion,
        revokedByUserId: actor.actorId,
      });
      if (!revoked) {
        const active = await store.getActive(issue.companyId, issue.id);
        res.status(409).json({
          error: `Review version ${reviewVersion} is not the active review`,
          code: "reviewed_html_not_active",
          activeVersion: active?.reviewVersion ?? null,
        });
        return;
      }

      await logActivity(db, {
        companyId: issue.companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        runId: actor.runId,
        agentApiKeyId: actor.agentApiKeyId,
        action: "issue.reviewed_html_revoked",
        entityType: "issue",
        entityId: issue.id,
        issueId: issue.id,
        details: { reviewVersion, trustState: REVIEWED_HTML_TRUST_STATE },
      });

      res.json({ reviewVersion, status: revoked.status, endedAt: revoked.endedAt });
    },
  );

  return router;
}
