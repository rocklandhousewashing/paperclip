import { createHash } from "node:crypto";
import {
  REVIEWED_HTML_PREVIEW_DESCRIPTOR_KIND,
  REVIEWED_HTML_PREVIEW_DESCRIPTOR_VERSION,
  type ReviewedHtmlPreviewDescriptor,
  type ReviewedHtmlPreviewScope,
} from "../lib/reviewed-html-preview";

/**
 * Fictional reviewed HTML page plus five image assets for reviewed-html-preview
 * tests. Hashes come from node:crypto so they are independent of the code
 * under test. Test-only: imports node:crypto.
 */

export const FIXTURE_ORIGIN = "https://paperclip.example.test";

// A small multi-step wizard with inline CSS and inline script, as an agent
// might attach to an issue for review.
export const WIZARD_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Acme Kites onboarding wizard (fictional)</title>
<style>
  body { font-family: sans-serif; margin: 0; padding: 16px; }
  .hero { background: url("assets/logo.png") no-repeat; min-height: 48px; }
  .step[hidden] { display: none; }
</style>
</head>
<body>
  <div class="hero" role="img" aria-label="Acme Kites logo"></div>
  <form id="wizard" onsubmit="event.preventDefault()">
    <section class="step" data-step="1">
      <img src="assets/step-1.png" alt="Step one">
      <label>Kite name <input name="kite" required></label>
      <button type="button" data-next>Next</button>
    </section>
    <section class="step" data-step="2" hidden>
      <img src="/assets/step-2.jpg" alt="Step two">
      <button type="button" data-next>Next</button>
    </section>
    <section class="step" data-step="3" hidden>
      <img src='assets/step-3.gif' alt="Step three">
      <a href="#summary">Jump to summary</a>
      <button type="button" data-next>Finish</button>
    </section>
    <section class="step" id="summary" data-step="4" hidden>
      <img id="done-badge" alt="Done">
      <p>Summary: <output id="summary-name"></output></p>
    </section>
  </form>
  <script>
    const steps = Array.from(document.querySelectorAll(".step"));
    let data = { current: 0 };
    const doneBadge = "assets/done.webp";
    document.querySelectorAll("[data-next]").forEach((button) => {
      button.addEventListener("click", () => {
        steps[data.current].hidden = true;
        data.current += 1;
        steps[data.current].hidden = false;
        if (data.current === steps.length - 1) {
          document.getElementById("done-badge").src = doneBadge;
          document.getElementById("summary-name").value = document.querySelector("input[name=kite]").value;
        }
      });
    });
  </script>
</body>
</html>
`;

export interface FixtureFile {
  attachmentId: string;
  filename: string;
  contentType: string;
  bytes: Uint8Array<ArrayBuffer>;
  reference?: string;
}

function ascii(text: string) {
  return Array.from(text, (char) => char.charCodeAt(0));
}

function bytesOf(values: number[]): Uint8Array<ArrayBuffer> {
  return new Uint8Array(values);
}

export function utf8(text: string): Uint8Array<ArrayBuffer> {
  return bytesOf(Array.from(new TextEncoder().encode(text)));
}

export function sha256HexOf(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function fixtureId(n: number) {
  // Hex letters keep case-sensitivity checks meaningful.
  return `fab1ed00-cafe-4000-8000-${n.toString(16).padStart(12, "0")}`;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export const HTML_FILE: FixtureFile = {
  attachmentId: fixtureId(1),
  filename: "onboarding-wizard.html",
  contentType: "text/html",
  bytes: utf8(WIZARD_HTML),
};

export const ASSET_FILES: FixtureFile[] = [
  {
    attachmentId: fixtureId(2),
    filename: "logo.png",
    contentType: "image/png",
    bytes: bytesOf([...PNG_SIGNATURE, ...ascii("fictional kite logo")]),
    reference: "assets/logo.png",
  },
  {
    attachmentId: fixtureId(3),
    filename: "step-1.png",
    contentType: "image/png",
    bytes: bytesOf([...PNG_SIGNATURE, ...ascii("fictional step one")]),
    reference: "assets/step-1.png",
  },
  {
    attachmentId: fixtureId(4),
    filename: "step-2.jpg",
    contentType: "image/jpeg",
    bytes: bytesOf([0xff, 0xd8, 0xff, 0xe0, ...ascii("fictional step two"), 0xff, 0xd9]),
    reference: "/assets/step-2.jpg",
  },
  {
    attachmentId: fixtureId(5),
    filename: "step-3.gif",
    contentType: "image/gif",
    bytes: bytesOf(ascii("GIF89afictional step three")),
    reference: "assets/step-3.gif",
  },
  {
    attachmentId: fixtureId(6),
    filename: "done.webp",
    contentType: "image/webp",
    bytes: bytesOf([...ascii("RIFF"), 0x16, 0, 0, 0, ...ascii("WEBPVP8 fictional done")]),
    reference: "assets/done.webp",
  },
];

export function descriptorEntry(file: FixtureFile) {
  return {
    attachmentId: file.attachmentId,
    filename: file.filename,
    contentType: file.contentType,
    byteSize: file.bytes.byteLength,
    sha256: sha256HexOf(file.bytes),
    ...(file.reference === undefined ? {} : { reference: file.reference }),
  };
}

export const FIXTURE_SCOPE: ReviewedHtmlPreviewScope = {
  companyId: fixtureId(100),
  issueId: fixtureId(101),
  taskId: fixtureId(102),
  reviewVersion: 1,
};

export function buildDescriptor(
  html: FixtureFile = HTML_FILE,
  assets: FixtureFile[] = ASSET_FILES,
): ReviewedHtmlPreviewDescriptor {
  return {
    kind: REVIEWED_HTML_PREVIEW_DESCRIPTOR_KIND,
    version: REVIEWED_HTML_PREVIEW_DESCRIPTOR_VERSION,
    scope: { ...FIXTURE_SCOPE },
    html: descriptorEntry(html),
    assets: assets.map((file) => ({ ...descriptorEntry(file), reference: file.reference ?? "" })),
  };
}

export function contentUrl(origin: string, attachmentId: string) {
  return new URL(`/api/attachments/${attachmentId}/content`, origin).href;
}

export interface FixtureResponseOverrides {
  status?: number;
  contentType?: string | null;
  contentLength?: string | null;
  body?: Uint8Array<ArrayBuffer>;
  url?: string;
  redirected?: boolean;
  type?: ResponseType;
}

/** Mirrors the headers the existing attachment content route sends. */
export function fixtureResponse(file: FixtureFile, url: string, overrides: FixtureResponseOverrides = {}) {
  const body = overrides.body ?? file.bytes;
  const headers = new Headers();
  const contentType = overrides.contentType === undefined ? file.contentType : overrides.contentType;
  if (contentType !== null) headers.set("Content-Type", contentType);
  const contentLength = overrides.contentLength === undefined ? String(body.byteLength) : overrides.contentLength;
  if (contentLength !== null) headers.set("Content-Length", contentLength);
  headers.set("X-Content-Type-Options", "nosniff");
  const response = new Response(body, { status: overrides.status ?? 200, headers });
  Object.defineProperty(response, "url", { value: overrides.url ?? url });
  if (overrides.redirected !== undefined) Object.defineProperty(response, "redirected", { value: overrides.redirected });
  if (overrides.type !== undefined) Object.defineProperty(response, "type", { value: overrides.type });
  return response;
}

export interface FixtureFetchCall {
  url: string;
  init: RequestInit | undefined;
}

/**
 * Serves fixture files from the fixed attachment route only. `respond` can
 * replace the response for one file to simulate tampering or bad servers.
 */
export function createFixtureFetch(
  origin: string,
  files: FixtureFile[],
  respond?: (file: FixtureFile, url: string, init: RequestInit | undefined) => Response | Promise<Response> | undefined,
) {
  const calls: FixtureFetchCall[] = [];
  const byUrl = new Map(files.map((file) => [contentUrl(origin, file.attachmentId), file]));
  const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    const file = byUrl.get(url);
    if (!file) throw new Error(`Unexpected fixture fetch: ${url}`);
    return (await respond?.(file, url, init)) ?? fixtureResponse(file, url);
  };
  return { fetchImpl: fetchImpl as typeof fetch, calls };
}
