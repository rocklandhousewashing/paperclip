import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AlertTriangle, Download, FileCode2, Loader2 } from "lucide-react";
import {
  loadReviewedHtmlPreview,
  REVIEWED_HTML_PREVIEW_IFRAME_SANDBOX,
  REVIEWED_HTML_PREVIEW_RESIDUAL_RISKS,
  ReviewedHtmlPreviewError,
  type AssembledReviewedHtmlPreview,
  type ReviewedHtmlPreviewDescriptor,
  type ReviewedHtmlPreviewScope,
} from "../lib/reviewed-html-preview";
import { cn } from "../lib/utils";

/**
 * Shows the actual reviewed HTML page (inline scripts and CSS included) in an
 * opaque `sandbox="allow-scripts"` iframe, but only after every listed byte
 * has been downloaded from its fixed attachment route and verified against
 * the reviewed-byte descriptor.
 *
 * The descriptor must come from the board-only issue review registry, which
 * records the exact reviewed bytes. Generic attachment metadata is not a
 * trusted descriptor.
 *
 * The sandbox and injected CSP reduce, but do not eliminate, network access:
 * a page can still navigate its own frame, which issues a request. The
 * preview closes when that happens, and the UI never claims otherwise.
 */

type PreviewState =
  | { status: "loading"; key: string }
  | { status: "ready"; key: string; preview: AssembledReviewedHtmlPreview }
  | { status: "failed"; key: string; message: string }
  | { status: "navigated"; key: string };

export interface ReviewedHtmlAttachmentPreviewProps {
  /** Reviewed-byte descriptor from a trusted server/caller; never an author manifest. */
  descriptor: ReviewedHtmlPreviewDescriptor;
  /** Independently sourced current company/issue/task/revision, not copied from the descriptor. */
  currentScope: ReviewedHtmlPreviewScope;
  className?: string;
}

function descriptorKeyOf(descriptor: unknown) {
  try {
    return JSON.stringify(descriptor) ?? "null";
  } catch {
    return "null";
  }
}

export function ReviewedHtmlAttachmentPreview({ descriptor, currentScope, className }: ReviewedHtmlAttachmentPreviewProps) {
  // The key includes the current route scope. A changed task or review revision
  // hides the old iframe during render, before effects run or the next fetch settles.
  const descriptorKey = descriptorKeyOf(descriptor);
  const currentScopeKey = descriptorKeyOf(currentScope);
  const renderKey = `${descriptorKey}\0${currentScopeKey}`;
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<PreviewState>({ status: "loading", key: renderKey });
  const visibleState: PreviewState = state.key === renderKey ? state : { status: "loading", key: renderKey };
  const frameLoads = useRef(0);
  const sectionRef = useRef<HTMLElement>(null);
  const reloadButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusOnClose = useRef(false);

  // Closing the frame removes whatever had focus inside it. Hand keyboard focus
  // to the Reload control only if this preview owned focus when the page
  // navigated. A layout effect runs in the same commit that removes the frame.
  useLayoutEffect(() => {
    if (visibleState.status !== "navigated" || !restoreFocusOnClose.current) return;
    restoreFocusOnClose.current = false;
    reloadButtonRef.current?.focus();
  }, [visibleState.status]);

  useEffect(() => {
    const controller = new AbortController();
    frameLoads.current = 0;
    setState({ status: "loading", key: renderKey });
    loadReviewedHtmlPreview(JSON.parse(descriptorKey), {
      origin: window.location.origin,
      signal: controller.signal,
      scope: JSON.parse(currentScopeKey) as ReviewedHtmlPreviewScope,
    })
      .then((preview) => {
        if (!controller.signal.aborted) setState({ status: "ready", key: renderKey, preview });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: "failed",
          key: renderKey,
          message: error instanceof ReviewedHtmlPreviewError
            ? error.message
            : "The reviewed attachment could not be verified.",
        });
      });
    return () => controller.abort();
  }, [descriptorKey, currentScopeKey, renderKey, reloadToken]);

  const handleFrameLoad = () => {
    frameLoads.current += 1;
    // The first load is the srcdoc itself; any later load means the page
    // navigated its own frame, which may already have made a request.
    if (frameLoads.current > 1) {
      // Read focus now: once the frame unmounts, the browser resets it to <body>,
      // which is indistinguishable from "nothing was focused".
      const active = document.activeElement;
      restoreFocusOnClose.current = !!active && !!sectionRef.current?.contains(active);
      setState({ status: "navigated", key: renderKey });
    }
  };

  const filename = typeof descriptor?.html?.filename === "string" ? descriptor.html.filename : "attachment";
  const frameTitle = `Draft page preview: ${filename}`;
  const downloadPath = visibleState.status === "ready"
    ? visibleState.preview.html.downloadPath
    : null;

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      aria-label={frameTitle}
      data-reviewed-html-preview={visibleState.status}
      className={cn("flex min-w-0 flex-col gap-2 rounded-md border border-border bg-card p-3", className)}
    >
      <header className="flex flex-wrap items-center gap-2 text-sm">
        {visibleState.status === "ready" ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
            <FileCode2 className="h-3.5 w-3.5" aria-hidden="true" />
            Private draft
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs font-medium text-foreground/80">
            {visibleState.status === "loading" ? "Loading preview" : "Preview unavailable"}
          </span>
        )}
        <span className="min-w-0 truncate font-medium">{filename}</span>
        {downloadPath ? (
          <a
            href={downloadPath}
            download
            className="ml-auto inline-flex min-h-6 items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline pointer-coarse:min-h-11"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download original
          </a>
        ) : null}
      </header>

      <p className="text-xs text-foreground/80">
        Preview only. Entries here are not saved to the issue; opening links may make network requests.
      </p>

      {visibleState.status === "loading" ? (
        <div role="status" aria-live="polite" className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading preview…
        </div>
      ) : null}

      {visibleState.status === "failed" || visibleState.status === "navigated" ? (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {visibleState.status === "failed" ? (
              <span className="flex min-w-0 flex-col gap-1">
                <span>
                  This page could not be checked against its reviewed copy, so it is not shown. Ask for a new
                  preview link if you still need it.
                </span>
                <span className="break-words text-xs">Details: {visibleState.message}</span>
              </span>
            ) : (
              <span>
                The page tried to navigate its frame, so the preview was closed. That navigation may already have
                made a network request.
              </span>
            )}
          </p>
          {visibleState.status === "navigated" ? (
            <button
              ref={reloadButtonRef}
              type="button"
              onClick={() => {
                // The button disappears while reloading; keep focus in this preview.
                sectionRef.current?.focus();
                setReloadToken((token) => token + 1);
              }}
              className="inline-flex min-h-6 items-center self-start text-xs font-medium underline underline-offset-2 pointer-coarse:min-h-11"
            >
              Reload preview
            </button>
          ) : null}
        </div>
      ) : null}

      {visibleState.status === "ready" ? (
        <iframe
          title={frameTitle}
          sandbox={REVIEWED_HTML_PREVIEW_IFRAME_SANDBOX}
          srcDoc={visibleState.preview.srcDoc}
          referrerPolicy="no-referrer"
          onLoad={handleFrameLoad}
          className="block h-(--sz-70vh) min-h-(--sz-320px) w-full rounded border border-border bg-background"
        />
      ) : null}

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">Preview limits</summary>
        <p className="mt-1">
          Scripts run in an isolated sandbox under a restrictive content policy. This does not guarantee the page
          makes no network requests.
        </p>
        <ul className="mt-1 list-disc pl-4">
          {REVIEWED_HTML_PREVIEW_RESIDUAL_RISKS.map((risk) => (
            <li key={risk}>{risk}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}
