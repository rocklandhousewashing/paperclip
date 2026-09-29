import { and, eq, sql } from "drizzle-orm";
import {
  activityLog,
  documentRevisions,
  documents,
  issueComments,
  issueDocuments,
  issues,
  type Db,
} from "@paperclipai/db";
import { conflict, notFound } from "../errors.js";
import {
  logActivity,
  publishActivity,
  type ActivityPublication,
} from "./activity-log.js";
import { parseIssueExecutionState } from "./issue-execution-policy.js";
import { issueRecoveryActionService } from "./issue-recovery-actions.js";
import { executionIssueCondition } from "./issue-visibility.js";
import {
  executeIssuePostCommitActions,
  issueService,
  type IssuePostCommitAction,
} from "./issues.js";

export const OWNER_REVISION_REQUESTED_ACTION = "issue.owner_revision_requested";

export interface OwnerRevisionRequestInput {
  issueId: string;
  companyId: string;
  /** Authenticated board user; the route has already matched it to expectedAssigneeUserId. */
  actorUserId: string;
  body: string;
  clientRequestId: string;
  producerAgentId: string;
  documentKey: string;
  expectedRevisionId: string;
  sourceTrust?: typeof issueComments.$inferInsert.sourceTrust;
}

/**
 * Records a human owner's revision feedback on the exact reviewed document
 * revision and hands the same issue back to the agent that produced it.
 *
 * The comment, the in_review -> todo transition, and the reassignment commit
 * together under the issue and document row locks, so a concurrent cancel,
 * completion, reassignment, or new revision rejects this request instead of
 * being overwritten. This is not an approval: no interaction, execution
 * decision, or review verdict is recorded.
 */
export function ownerRevisionRequestService(db: Db) {
  const svc = issueService(db);
  const recoveryActions = issueRecoveryActionService(db);
  return {
    request: async (input: OwnerRevisionRequestInput) => {
      const postCommitActivityPublications: ActivityPublication[] = [];
      const postCommitIssueActions: IssuePostCommitAction[] = [];
      const commentActor = { userId: input.actorUserId };
      const commentOptions = {
        authorType: "user" as const,
        clientRequestId: input.clientRequestId,
        sourceTrust: input.sourceTrust,
      };
      const result = await db.transaction(async (tx) => {
        const txDb = tx as unknown as Db;
        const lockedIssue = await tx
          .select()
          .from(issues)
          .where(and(
            eq(issues.id, input.issueId),
            eq(issues.companyId, input.companyId),
            executionIssueCondition(),
          ))
          .for("update")
          .then((rows) => rows[0] ?? null);
        if (!lockedIssue) throw notFound("Issue not found");

        // Retry after an ambiguous response: the (issue, user, clientRequestId)
        // unique comment key is the receipt. Replays never mutate the issue again.
        const prior = await tx
          .select({ id: issueComments.id })
          .from(issueComments)
          .where(and(
            eq(issueComments.issueId, lockedIssue.id),
            eq(issueComments.authorUserId, input.actorUserId),
            eq(issueComments.clientRequestId, input.clientRequestId),
          ))
          .then((rows) => rows[0] ?? null);
        if (prior) {
          const receipt = await tx
            .select({ details: activityLog.details })
            .from(activityLog)
            .where(and(
              eq(activityLog.companyId, lockedIssue.companyId),
              eq(activityLog.entityType, "issue"),
              eq(activityLog.entityId, lockedIssue.id),
              eq(activityLog.action, OWNER_REVISION_REQUESTED_ACTION),
              sql`${activityLog.details}->>'commentId' = ${prior.id}`,
            ))
            .then((rows) => (rows[0]?.details ?? null) as Record<string, unknown> | null);
          if (
            !receipt ||
            receipt.producerAgentId !== input.producerAgentId ||
            receipt.documentKey !== input.documentKey ||
            receipt.revisionId !== input.expectedRevisionId
          ) {
            throw conflict("clientRequestId was already used for a different request", {
              code: "owner_revision_request_id_reused",
            });
          }
          // Returns the stored comment, or rejects a different body for the same id.
          const comment = await svc.addComment(
            lockedIssue.id,
            input.body,
            commentActor,
            commentOptions,
            tx,
          );
          return { issue: lockedIssue, comment, replayed: true };
        }

        const drift = (code: string, details: Record<string, unknown> = {}) =>
          conflict("Issue no longer matches the owner revision request", {
            code,
            issueId: lockedIssue.id,
            ...details,
          });
        if (lockedIssue.status !== "in_review") {
          throw drift("owner_revision_status_drift", { currentStatus: lockedIssue.status });
        }
        if (
          lockedIssue.assigneeUserId !== input.actorUserId ||
          lockedIssue.assigneeAgentId !== null
        ) {
          throw drift("owner_revision_assignee_drift");
        }
        if (parseIssueExecutionState(lockedIssue.executionState)?.status === "pending") {
          // Policy-driven reviews advance through their execution decisions.
          throw drift("owner_revision_execution_policy_active");
        }
        if (await recoveryActions.getActiveForIssue(lockedIssue.companyId, lockedIssue.id, txDb)) {
          throw drift("owner_revision_recovery_active");
        }

        const issueDocument = await tx
          .select({ documentId: issueDocuments.documentId })
          .from(issueDocuments)
          .where(and(
            eq(issueDocuments.companyId, lockedIssue.companyId),
            eq(issueDocuments.issueId, lockedIssue.id),
            eq(issueDocuments.key, input.documentKey),
          ))
          .then((rows) => rows[0] ?? null);
        // Document revisions update this row, so the lock orders us against them.
        const lockedDocument = issueDocument
          ? await tx
              .select({ id: documents.id, latestRevisionId: documents.latestRevisionId })
              .from(documents)
              .where(and(
                eq(documents.id, issueDocument.documentId),
                eq(documents.companyId, lockedIssue.companyId),
              ))
              .for("update")
              .then((rows) => rows[0] ?? null)
          : null;
        if (!lockedDocument) throw notFound("Document not found");
        if (lockedDocument.latestRevisionId !== input.expectedRevisionId) {
          throw drift("owner_revision_document_drift", {
            currentRevisionId: lockedDocument.latestRevisionId,
          });
        }
        const revision = await tx
          .select({ createdByAgentId: documentRevisions.createdByAgentId })
          .from(documentRevisions)
          .where(and(
            eq(documentRevisions.id, input.expectedRevisionId),
            eq(documentRevisions.documentId, lockedDocument.id),
            eq(documentRevisions.companyId, lockedIssue.companyId),
          ))
          .then((rows) => rows[0] ?? null);
        if (!revision || revision.createdByAgentId !== input.producerAgentId) {
          throw drift("owner_revision_producer_mismatch");
        }

        const comment = await svc.addComment(
          lockedIssue.id,
          input.body,
          commentActor,
          commentOptions,
          tx,
        );
        const updated = await svc.update(
          lockedIssue.id,
          {
            status: "todo",
            assigneeAgentId: input.producerAgentId,
            assigneeUserId: null,
            actorUserId: input.actorUserId,
            companyGuard: lockedIssue.companyId,
          },
          tx,
          postCommitActivityPublications,
          postCommitIssueActions,
        );
        if (!updated) throw notFound("Issue not found");

        await logActivity(txDb, {
          companyId: updated.companyId,
          actorType: "user",
          actorId: input.actorUserId,
          action: "issue.comment_added",
          entityType: "issue",
          entityId: updated.id,
          issueId: updated.id,
          details: {
            commentId: comment.id,
            authorUserId: input.actorUserId,
            source: "owner_revision_request",
          },
        }, postCommitActivityPublications);
        await logActivity(txDb, {
          companyId: updated.companyId,
          actorType: "user",
          actorId: input.actorUserId,
          action: OWNER_REVISION_REQUESTED_ACTION,
          entityType: "issue",
          entityId: updated.id,
          issueId: updated.id,
          details: {
            commentId: comment.id,
            producerAgentId: input.producerAgentId,
            documentId: lockedDocument.id,
            documentKey: input.documentKey,
            revisionId: input.expectedRevisionId,
            identifier: updated.identifier,
            status: updated.status,
            _previous: {
              status: lockedIssue.status,
              assigneeUserId: lockedIssue.assigneeUserId,
            },
          },
        }, postCommitActivityPublications);

        return { issue: updated, comment, replayed: false };
      });
      for (const publication of postCommitActivityPublications) publishActivity(publication);
      await executeIssuePostCommitActions(db, postCommitIssueActions);
      return result;
    },
  };
}
