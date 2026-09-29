import type { ReviewedHtmlDescriptorResponse, ReviewedHtmlReviewSummary } from "@paperclipai/shared";
import { api } from "./client";

/**
 * Board-only reads of the board-reviewed HTML registry. Registration and
 * revocation are operator API calls; the issue UI only opens registered reviews.
 */
export const reviewedHtmlApi = {
  summary: (issueId: string, options?: { signal?: AbortSignal }) =>
    api.get<ReviewedHtmlReviewSummary>(
      `/issues/${encodeURIComponent(issueId)}/reviewed-html`,
      { signal: options?.signal, cache: "no-store" },
    ),
  descriptor: (issueId: string, reviewVersion: number, options?: { signal?: AbortSignal }) =>
    api.get<ReviewedHtmlDescriptorResponse>(
      `/issues/${encodeURIComponent(issueId)}/reviewed-html/${reviewVersion}`,
      { signal: options?.signal, cache: "no-store" },
    ),
};
