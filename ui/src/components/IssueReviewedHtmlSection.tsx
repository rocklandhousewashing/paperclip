import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FileCode2, Loader2, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { ReviewedHtmlEndedResponse } from "@paperclipai/shared";
import { ApiError } from "../api/client";
import { reviewedHtmlApi } from "../api/reviewedHtml";
import { queryKeys } from "../lib/queryKeys";
import { cn } from "../lib/utils";
import { ReviewedHtmlAttachmentPreview } from "./ReviewedHtmlAttachmentPreview";

/**
 * Opens a board-registered review of an HTML attachment from the issue route.
 *
 * The durable link is the issue URL plus `?reviewedHtml=<reviewVersion>`. The
 * descriptor comes only from the board-only registry endpoint; the current
 * company/issue/task/version passed to the preview come from the route and the
 * loaded issue, independently of that descriptor. Registration and revocation
 * are operator API calls; this section only opens registered reviews.
 */

export const REVIEWED_HTML_SEARCH_PARAM = "reviewedHtml";

const VERSION_RE = /^[1-9][0-9]{0,8}$/;

export function parseReviewedHtmlVersion(search: string): number | null {
  const raw = new URLSearchParams(search).get(REVIEWED_HTML_SEARCH_PARAM);
  return raw && VERSION_RE.test(raw) ? Number(raw) : null;
}

export function reviewedHtmlSearch(search: string, reviewVersion: number | null): string {
  const params = new URLSearchParams(search);
  if (reviewVersion === null) params.delete(REVIEWED_HTML_SEARCH_PARAM);
  else params.set(REVIEWED_HTML_SEARCH_PARAM, String(reviewVersion));
  const next = params.toString();
  return next ? `?${next}` : "";
}

export function describeReviewedHtmlError(error: unknown): { message: string; activeVersion: number | null } {
  if (error instanceof ApiError) {
    const body = (error.body ?? {}) as Partial<ReviewedHtmlEndedResponse>;
    const activeVersion = typeof body.activeVersion === "number" ? body.activeVersion : null;
    if (error.status === 410) {
      return {
        message: body.code === "reviewed_html_revoked"
          ? "This preview was removed. Ask for a new link if you still need it."
          : "A newer version replaced this preview. Open the current version below.",
        activeVersion,
      };
    }
    if (error.status === 404) return { message: "This preview link is unavailable for this task.", activeVersion: null };
    if (error.status === 409) {
      return {
        message: "A page file changed or was removed. Ask for a new preview link.",
        activeVersion: null,
      };
    }
    if (error.status === 403) return { message: "You do not have access to this private preview.", activeVersion: null };
  }
  return {
    message: error instanceof Error ? error.message : "The private preview could not be loaded.",
    activeVersion: null,
  };
}

export interface IssueReviewedHtmlSectionProps {
  companyId: string;
  issueId: string;
  className?: string;
}

export function IssueReviewedHtmlSection({ companyId, issueId, className }: IssueReviewedHtmlSectionProps) {
  const location = useLocation();
  const requestedVersion = parseReviewedHtmlVersion(location.search);

  const summary = useQuery({
    queryKey: queryKeys.issues.reviewedHtmlSummary(issueId),
    queryFn: ({ signal }) => reviewedHtmlApi.summary(issueId, { signal }),
    retry: false,
    staleTime: 0,
  });
  const descriptor = useQuery({
    queryKey: queryKeys.issues.reviewedHtmlDescriptor(issueId, requestedVersion ?? 0),
    queryFn: ({ signal }) => reviewedHtmlApi.descriptor(issueId, requestedVersion!, { signal }),
    enabled: requestedVersion !== null,
    retry: false,
    staleTime: 0,
    // Never reuse a cached descriptor on remount; it may have been revoked since.
    gcTime: 0,
  });

  if (requestedVersion === null) {
    const activeVersion = summary.data?.activeVersion ?? null;
    if (activeVersion === null) return null;
    return (
      <div data-reviewed-html-link="" className={cn("flex flex-wrap items-center gap-2 text-sm", className)}>
        <FileCode2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <Link
          to={{ search: reviewedHtmlSearch(location.search, activeVersion), hash: location.hash }}
          className="font-medium text-foreground underline-offset-2 hover:underline"
        >
          Open private page preview (v{activeVersion})
        </Link>
      </div>
    );
  }

  const closeTo = { search: reviewedHtmlSearch(location.search, null), hash: location.hash };
  const currentLink = (activeVersion: number | null) =>
    activeVersion !== null && activeVersion !== requestedVersion ? (
      <Link
        to={{ search: reviewedHtmlSearch(location.search, activeVersion), hash: location.hash }}
        className="inline-flex min-h-6 items-center self-start text-xs font-medium underline underline-offset-2 pointer-coarse:min-h-11"
      >
        Open current version (v{activeVersion})
      </Link>
    ) : null;

  let failure: { message: string; activeVersion: number | null } | null = null;
  if (descriptor.isError) {
    failure = describeReviewedHtmlError(descriptor.error);
  } else if (summary.isError) {
    failure = describeReviewedHtmlError(summary.error);
  } else if (summary.data && summary.data.activeVersion !== requestedVersion) {
    failure = {
      message: summary.data.activeVersion === null
        ? `This preview link is no longer active.`
        : `A newer version is available. Open the current version below.`,
      activeVersion: summary.data.activeVersion,
    };
  }
  // Both the registry summary and the versioned descriptor must agree before
  // any frame renders.
  const ready = !failure && summary.data?.activeVersion === requestedVersion && descriptor.data
    ? descriptor.data
    : null;

  return (
    <section
      aria-label="Private page preview"
      data-reviewed-html-section={failure ? "failed" : ready ? "ready" : "loading"}
      className={cn("flex min-w-0 flex-col gap-2", className)}
    >
      <header className="flex flex-wrap items-center gap-2 text-sm">
        <FileCode2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="font-medium">Private page preview · v{requestedVersion}</span>
        <span className="text-xs text-muted-foreground">
          Not published
        </span>
        <Link
          to={closeTo}
          aria-label="Close reviewed page"
          className="ml-auto inline-flex min-h-6 items-center gap-1 text-xs pointer-coarse:min-h-11 text-muted-foreground underline-offset-2 hover:underline"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Close
        </Link>
      </header>

      {failure ? (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{failure.message}</span>
          </p>
          {currentLink(failure.activeVersion)}
        </div>
      ) : ready ? (
        <ReviewedHtmlAttachmentPreview
          key={`${companyId}:${issueId}:${requestedVersion}`}
          descriptor={ready.descriptor}
          currentScope={{ companyId, issueId, taskId: issueId, reviewVersion: requestedVersion }}
        />
      ) : (
        <div role="status" aria-live="polite" className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading preview…
        </div>
      )}
    </section>
  );
}
