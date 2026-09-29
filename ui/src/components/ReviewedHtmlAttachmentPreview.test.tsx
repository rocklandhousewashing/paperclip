// @vitest-environment jsdom

import { webcrypto } from "node:crypto";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReviewedHtmlAttachmentPreview } from "./ReviewedHtmlAttachmentPreview";
import {
  ASSET_FILES,
  buildDescriptor,
  createFixtureFetch,
  fixtureResponse,
  HTML_FILE,
  FIXTURE_SCOPE,
  utf8,
  WIZARD_HTML,
} from "../fixtures/reviewedHtmlPreviewFixtures";

const NETWORK_FREE_CLAIM = /network[- ]free|no network access|fully isolated|works offline|cannot (?:make|send) (?:any )?requests/i;

async function waitFor(check: () => boolean) {
  for (let index = 0; index < 200; index += 1) {
    if (check()) return;
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    flushSync(() => {});
  }
  throw new Error("Condition was not met");
}

describe("ReviewedHtmlAttachmentPreview", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal("crypto", webcrypto);
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    flushSync(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it("shows a loading state and no frame before bytes are verified", () => {
    const html = renderToStaticMarkup(<ReviewedHtmlAttachmentPreview descriptor={buildDescriptor()} currentScope={FIXTURE_SCOPE} />);
    expect(html).not.toContain("<iframe");
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading preview");
    expect(html).toContain("not saved to the issue");
  });

  it("renders the verified page in an allow-scripts-only sandbox with trust and local-preview labels", async () => {
    const { fetchImpl, calls } = createFixtureFetch(window.location.origin, [HTML_FILE, ...ASSET_FILES]);
    vi.stubGlobal("fetch", fetchImpl);

    flushSync(() => root.render(<ReviewedHtmlAttachmentPreview descriptor={buildDescriptor()} currentScope={FIXTURE_SCOPE} />));
    await waitFor(() => container.querySelector("iframe") !== null);

    const iframe = container.querySelector("iframe")!;
    expect(iframe.getAttribute("sandbox")).toBe("allow-scripts");
    expect(iframe.getAttribute("title")).toBe("Draft page preview: onboarding-wizard.html");
    const srcdoc = iframe.getAttribute("srcdoc") ?? "";
    expect(srcdoc).toContain('<meta http-equiv="Content-Security-Policy"');
    expect(srcdoc).toContain("data:image/webp;base64,");
    expect(srcdoc).toContain('button.addEventListener("click"');

    const text = container.textContent ?? "";
    expect(text).toContain("Private draft");
    expect(text).toContain("not saved to the issue");
    expect(text).toContain("does not guarantee");
    expect(text).not.toMatch(NETWORK_FREE_CLAIM);
    expect(container.querySelector("a[download]")?.getAttribute("href"))
      .toBe(`/api/attachments/${HTML_FILE.attachmentId}/content?download=1`);
    expect(calls).toHaveLength(6);
  });

  it("shows a failure and never mounts a frame when bytes do not match the review", async () => {
    const { fetchImpl } = createFixtureFetch(window.location.origin, [HTML_FILE, ...ASSET_FILES], (file, url) =>
      file === HTML_FILE ? fixtureResponse(file, url, { body: utf8(WIZARD_HTML.replace("Next", "Pay!")) }) : undefined);
    vi.stubGlobal("fetch", fetchImpl);

    flushSync(() => root.render(<ReviewedHtmlAttachmentPreview descriptor={buildDescriptor()} currentScope={FIXTURE_SCOPE} />));
    await waitFor(() => container.querySelector('[role="alert"]') !== null);

    expect(container.querySelector("iframe")).toBeNull();
    const alert = container.querySelector('[role="alert"]')?.textContent ?? "";
    // Plain-language outcome and next step first; the technical reason stays available.
    expect(alert).toMatch(/not shown/i);
    expect(alert).toMatch(/new preview link/i);
    expect(alert).toContain("reviewed SHA-256");
    expect(container.textContent).not.toMatch(NETWORK_FREE_CLAIM);
  });

  it("keeps keyboard focus in the preview when a navigating page is closed and reloaded", async () => {
    const { fetchImpl } = createFixtureFetch(window.location.origin, [HTML_FILE, ...ASSET_FILES]);
    vi.stubGlobal("fetch", fetchImpl);
    flushSync(() => root.render(<ReviewedHtmlAttachmentPreview descriptor={buildDescriptor()} currentScope={FIXTURE_SCOPE} />));
    await waitFor(() => container.querySelector("iframe") !== null);

    // The keyboard user is inside the page (the parent document reports the
    // iframe as active); then the srcdoc load, then the page navigating its own frame.
    const iframe = container.querySelector("iframe")!;
    iframe.focus();
    expect(document.activeElement).toBe(iframe);
    iframe.dispatchEvent(new Event("load"));
    iframe.dispatchEvent(new Event("load"));
    await waitFor(() => container.querySelector('[role="alert"]') !== null);

    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector('[role="alert"]')?.textContent).toMatch(/network request/i);
    const reload = document.activeElement as HTMLElement | null;
    expect(reload?.tagName).toBe("BUTTON");
    expect(reload?.textContent).toMatch(/reload preview/i);

    reload!.click();
    await waitFor(() => container.querySelector("iframe") !== null);
    const region = document.activeElement as HTMLElement | null;
    expect(region?.getAttribute("aria-label")).toBe("Draft page preview: onboarding-wizard.html");
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it("does not move focus the owner already placed elsewhere when the page navigates", async () => {
    const outside = document.createElement("button");
    document.body.append(outside);
    const { fetchImpl } = createFixtureFetch(window.location.origin, [HTML_FILE, ...ASSET_FILES]);
    vi.stubGlobal("fetch", fetchImpl);
    flushSync(() => root.render(<ReviewedHtmlAttachmentPreview descriptor={buildDescriptor()} currentScope={FIXTURE_SCOPE} />));
    await waitFor(() => container.querySelector("iframe") !== null);

    outside.focus();
    const iframe = container.querySelector("iframe")!;
    iframe.dispatchEvent(new Event("load"));
    iframe.dispatchEvent(new Event("load"));
    await waitFor(() => container.querySelector('[role="alert"]') !== null);
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it("unmounts old reviewed bytes synchronously when the current review revision changes", async () => {
    const { fetchImpl, calls } = createFixtureFetch(window.location.origin, [HTML_FILE, ...ASSET_FILES]);
    vi.stubGlobal("fetch", fetchImpl);
    flushSync(() => root.render(<ReviewedHtmlAttachmentPreview descriptor={buildDescriptor()} currentScope={FIXTURE_SCOPE} />));
    await waitFor(() => container.querySelector("iframe") !== null);
    expect(calls).toHaveLength(6);

    // Same descriptor, changed current task/revision: old page disappears in this render,
    // before the effect or the rejected new load can settle.
    flushSync(() => root.render(<ReviewedHtmlAttachmentPreview
      descriptor={buildDescriptor()}
      currentScope={{ ...FIXTURE_SCOPE, reviewVersion: 2 }}
    />));
    expect(container.querySelector("iframe")).toBeNull();
    await waitFor(() => container.querySelector('[role="alert"]') !== null);
    expect(calls).toHaveLength(6);
  });

  it("does not refetch for an equal descriptor and aborts stale loads", async () => {
    const signals: AbortSignal[] = [];
    vi.stubGlobal("fetch", (_url: string, init?: RequestInit) => {
      signals.push(init!.signal!);
      return new Promise<Response>(() => {});
    });

    flushSync(() => root.render(<ReviewedHtmlAttachmentPreview descriptor={buildDescriptor()} currentScope={FIXTURE_SCOPE} />));
    await waitFor(() => signals.length === 6);
    flushSync(() => root.render(<ReviewedHtmlAttachmentPreview descriptor={buildDescriptor()} currentScope={FIXTURE_SCOPE} />));
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    expect(signals).toHaveLength(6);

    flushSync(() => root.render(
      <ReviewedHtmlAttachmentPreview descriptor={buildDescriptor(HTML_FILE, ASSET_FILES.slice(0, 1))} currentScope={FIXTURE_SCOPE} />,
    ));
    await waitFor(() => signals.length === 8);
    expect(signals.slice(0, 6).every((signal) => signal.aborted)).toBe(true);
    expect(signals.slice(6).every((signal) => !signal.aborted)).toBe(true);

    flushSync(() => root.unmount());
    expect(signals.every((signal) => signal.aborted)).toBe(true);
    root = createRoot(container);
  });
});
