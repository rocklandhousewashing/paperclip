// @vitest-environment jsdom

import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useNavigate, useParams, type NavigateFunction } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReviewedHtmlDescriptorResponse, ReviewedHtmlReviewSummary } from "@paperclipai/shared";
import { ApiError } from "../api/client";
import {
  IssueReviewedHtmlSection,
  parseReviewedHtmlVersion,
  reviewedHtmlSearch,
} from "./IssueReviewedHtmlSection";

const mockApi = vi.hoisted(() => ({
  summary: vi.fn(),
  descriptor: vi.fn(),
}));

vi.mock("../api/reviewedHtml", () => ({ reviewedHtmlApi: mockApi }));

// Stand-in for the committed sandboxed preview: records exactly what it receives.
vi.mock("./ReviewedHtmlAttachmentPreview", () => ({
  ReviewedHtmlAttachmentPreview: (props: { descriptor: unknown; currentScope: unknown }) => (
    <div
      data-testid="reviewed-preview"
      data-descriptor={JSON.stringify(props.descriptor)}
      data-scope={JSON.stringify(props.currentScope)}
    />
  ),
}));

// Fictional fixture identifiers.
const COMPANY = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ISSUE_1 = "11111111-1111-4111-8111-111111111111";
const ISSUE_2 = "22222222-2222-4222-8222-222222222222";
const HTML_ID = "a0000000-0000-4000-8000-000000000001";

function summary(issueId: string, activeVersion: number | null): ReviewedHtmlReviewSummary {
  return {
    issueId,
    activeVersion,
    latestVersion: activeVersion ?? 1,
    activeReviewedAt: activeVersion ? "2026-01-01T00:00:00.000Z" : null,
    trustState: "board_reviewed_bytes",
  };
}

function descriptor(issueId: string, reviewVersion: number): ReviewedHtmlDescriptorResponse {
  return {
    trustState: "board_reviewed_bytes",
    reviewVersion,
    reviewedAt: "2026-01-01T00:00:00.000Z",
    reviewedByUserId: "board-user-1",
    descriptor: {
      kind: "paperclip.reviewed-html-preview",
      version: 1,
      scope: { companyId: COMPANY, issueId, taskId: issueId, reviewVersion },
      html: { attachmentId: HTML_ID, filename: "page.html", contentType: "text/html", byteSize: 10, sha256: "a".repeat(64) },
      assets: [],
    },
  };
}

let navigateRef: NavigateFunction | null = null;

function CaptureNavigate() {
  const navigate = useNavigate();
  useEffect(() => {
    navigateRef = navigate;
  }, [navigate]);
  return null;
}

const ISSUE_IDS_BY_REF: Record<string, string> = { "ACME-1": ISSUE_1, "ACME-2": ISSUE_2 };

function IssueRoute() {
  // The issue id comes from the route, like IssueDetail's loaded issue.
  const { issueRef } = useParams();
  return <IssueReviewedHtmlSection companyId={COMPANY} issueId={ISSUE_IDS_BY_REF[issueRef!]!} />;
}

async function flush() {
  for (let index = 0; index < 10; index += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

describe("IssueReviewedHtmlSection", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    mockApi.summary.mockReset();
    mockApi.descriptor.mockReset();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    navigateRef = null;
  });

  async function renderAt(url: string) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={[url]}>
            <CaptureNavigate />
            <Routes>
              <Route path="/:companyPrefix/issues/:issueRef" element={<IssueRoute />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      );
    });
    await flush();
  }

  const preview = () => container.querySelector<HTMLElement>('[data-testid="reviewed-preview"]');

  it("parses only positive integer versions and preserves other query params", () => {
    expect(parseReviewedHtmlVersion("?reviewedHtml=3")).toBe(3);
    for (const bad of ["", "?reviewedHtml=0", "?reviewedHtml=01", "?reviewedHtml=abc", "?reviewedHtml=1e3", "?reviewedHtml=-1"]) {
      expect(parseReviewedHtmlVersion(bad)).toBeNull();
    }
    expect(reviewedHtmlSearch("?tab=chat", 2)).toBe("?tab=chat&reviewedHtml=2");
    expect(reviewedHtmlSearch("?tab=chat&reviewedHtml=2", null)).toBe("?tab=chat");
    expect(reviewedHtmlSearch("?reviewedHtml=2", null)).toBe("");
  });

  it("shows a durable issue-route link to the active review and no frame", async () => {
    mockApi.summary.mockResolvedValue(summary(ISSUE_1, 2));
    await renderAt("/ACME/issues/ACME-1?tab=chat");

    const link = container.querySelector<HTMLAnchorElement>("[data-reviewed-html-link] a");
    expect(link?.getAttribute("href")).toBe("/ACME/issues/ACME-1?tab=chat&reviewedHtml=2");
    expect(link?.textContent).toContain("v2");
    expect(container.textContent).toContain("private page preview");
    expect(container.textContent).not.toMatch(/qa verified/i);
    expect(preview()).toBeNull();
    expect(mockApi.descriptor).not.toHaveBeenCalled();
  });

  it("renders nothing when there is no active review or the summary is not readable", async () => {
    mockApi.summary.mockResolvedValue(summary(ISSUE_1, null));
    await renderAt("/ACME/issues/ACME-1");
    expect(container.innerHTML).toBe("");

    mockApi.summary.mockRejectedValue(new ApiError("Board access required", 403, { error: "Board access required" }));
    await renderAt("/ACME/issues/ACME-1");
    expect(container.innerHTML).toBe("");
  });

  it("opens the registered review with the route's scope, not the descriptor's", async () => {
    mockApi.summary.mockResolvedValue(summary(ISSUE_1, 2));
    // A descriptor claiming another issue must not rewrite the current scope.
    mockApi.descriptor.mockResolvedValue(descriptor(ISSUE_2, 2));
    await renderAt("/ACME/issues/ACME-1?reviewedHtml=2");

    expect(mockApi.descriptor).toHaveBeenCalledWith(ISSUE_1, 2, expect.anything());
    const node = preview();
    expect(node).not.toBeNull();
    expect(JSON.parse(node!.dataset.scope!)).toEqual({
      companyId: COMPANY,
      issueId: ISSUE_1,
      taskId: ISSUE_1,
      reviewVersion: 2,
    });
    expect(JSON.parse(node!.dataset.descriptor!).scope.issueId).toBe(ISSUE_2);
    const close = container.querySelector<HTMLAnchorElement>('a[aria-label="Close reviewed page"]');
    expect(close?.getAttribute("href")).toBe("/ACME/issues/ACME-1");
  });

  it("explains a superseded link and offers the current version without showing a frame", async () => {
    mockApi.summary.mockResolvedValue(summary(ISSUE_1, 2));
    mockApi.descriptor.mockRejectedValue(new ApiError("superseded", 410, {
      error: "Review version 1 was superseded",
      code: "reviewed_html_superseded",
      reviewVersion: 1,
      activeVersion: 2,
    }));
    await renderAt("/ACME/issues/ACME-1?reviewedHtml=1");

    expect(preview()).toBeNull();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("newer version replaced this preview");
    const current = [...container.querySelectorAll("a")].find((a) => a.textContent?.includes("Open current version"));
    expect(current?.getAttribute("href")).toBe("/ACME/issues/ACME-1?reviewedHtml=2");
  });

  it("explains a revoked link", async () => {
    mockApi.summary.mockResolvedValue(summary(ISSUE_1, null));
    mockApi.descriptor.mockRejectedValue(new ApiError("revoked", 410, {
      error: "Review version 1 was revoked",
      code: "reviewed_html_revoked",
      reviewVersion: 1,
      activeVersion: null,
    }));
    await renderAt("/ACME/issues/ACME-1?reviewedHtml=1");
    expect(preview()).toBeNull();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("removed");
  });

  it("refuses to render when the registry's active version disagrees with the link", async () => {
    mockApi.summary.mockResolvedValue(summary(ISSUE_1, 3));
    mockApi.descriptor.mockResolvedValue(descriptor(ISSUE_1, 2));
    await renderAt("/ACME/issues/ACME-1?reviewedHtml=2");
    expect(preview()).toBeNull();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Open current version (v3)");
  });

  it("removes the old frame immediately when the review version changes", async () => {
    mockApi.summary.mockResolvedValue(summary(ISSUE_1, 2));
    mockApi.descriptor.mockImplementation(async (_issueId: string, version: number) =>
      version === 2 ? descriptor(ISSUE_1, 2) : new Promise(() => {}));
    await renderAt("/ACME/issues/ACME-1?reviewedHtml=2");
    expect(preview()).not.toBeNull();

    await act(async () => navigateRef!("/ACME/issues/ACME-1?reviewedHtml=3"));
    expect(preview()).toBeNull();
  });

  it("removes the old frame immediately when the task changes", async () => {
    mockApi.summary.mockImplementation(async (issueId: string) =>
      issueId === ISSUE_1 ? summary(ISSUE_1, 2) : new Promise(() => {}));
    mockApi.descriptor.mockImplementation(async (issueId: string) =>
      issueId === ISSUE_1 ? descriptor(ISSUE_1, 2) : new Promise(() => {}));
    await renderAt("/ACME/issues/ACME-1?reviewedHtml=2");
    expect(preview()).not.toBeNull();

    await act(async () => navigateRef!("/ACME/issues/ACME-2?reviewedHtml=2"));
    expect(preview()).toBeNull();
    expect(mockApi.descriptor).toHaveBeenLastCalledWith(ISSUE_2, 2, expect.anything());
  });
});
