/**
 * Reviewed HTML attachment preview: descriptor validation, exact-byte
 * verification and sandboxed `srcdoc` assembly.
 *
 * TRUST CONTRACT
 * The descriptor consumed here is INPUT FROM A TRUSTED SERVER/CALLER that has
 * already recorded which exact bytes were reviewed. It is never an author
 * manifest, and a hash the author asserts about their own upload proves
 * nothing. This module only checks that the bytes it downloads match the
 * descriptor; it does not decide who may review or approve anything.
 *
 * INTEGRATION STATUS
 * The source now includes a board-only issue review registry. This source
 * change still requires a reviewed package build, migration and installation.
 * See `REVIEWED_HTML_PREVIEW_INTEGRATION_STATUS`.
 *
 * NETWORK RESIDUAL
 * The page runs in an opaque-origin iframe (`sandbox="allow-scripts"`) under a
 * restrictive injected CSP, but that does NOT make arbitrary script
 * network-free. Chromium still issues a request when the sandboxed frame
 * navigates itself (e.g. `location.href = ...` or a link click), even with
 * `connect-src 'none'`, so data can leave through the navigation URL. See
 * `REVIEWED_HTML_PREVIEW_RESIDUAL_RISKS`.
 */

export const REVIEWED_HTML_PREVIEW_DESCRIPTOR_KIND = "paperclip.reviewed-html-preview" as const;
export const REVIEWED_HTML_PREVIEW_DESCRIPTOR_VERSION = 1 as const;

export const REVIEWED_HTML_PREVIEW_INTEGRATION_STATUS =
  "source-integrated-pending-install" as const;

/** Exactly `allow-scripts`: no same-origin, forms, popups, downloads or top navigation. */
export const REVIEWED_HTML_PREVIEW_IFRAME_SANDBOX = "allow-scripts" as const;

/** The preview never promises network isolation; see the residual risks. */
export const REVIEWED_HTML_PREVIEW_NETWORK_ISOLATION = "not-guaranteed" as const;

export const REVIEWED_HTML_PREVIEW_RESIDUAL_RISKS = [
  "Chromium sends a network request when a sandboxed frame navigates itself (location changes or link clicks), even with an opaque origin and connect-src 'none'. The preview closes after such a navigation but cannot prevent the request.",
  "URLs assembled at runtime by script are not rewritten; they rely on the injected CSP, which does not cover every browser feature (for example DNS prefetching).",
] as const;

export const MAX_REVIEWED_ATTACHMENT_BYTES = 1024 * 1024;
export const MAX_REVIEWED_PREVIEW_TOTAL_BYTES = 4 * 1024 * 1024;
export const MAX_REVIEWED_PREVIEW_ASSETS = 16;

/**
 * Injected as the first element of `<head>`. Inline script/style stay allowed
 * because the reviewed page depends on them; image and font resources are
 * limited to reviewed `data:` assets, while other fetchable types are denied.
 */
export const REVIEWED_HTML_PREVIEW_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src data:",
  "font-src data:",
  "media-src 'none'",
  "connect-src 'none'",
  "frame-src 'none'",
  "child-src 'none'",
  "worker-src 'none'",
  "object-src 'none'",
  "manifest-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join("; ");

export type ReviewedHtmlPreviewErrorCode =
  | "invalid_descriptor"
  | "unsupported_mime"
  | "size_limit"
  | "duplicate_asset"
  | "invalid_reference"
  | "aborted"
  | "fetch_failed"
  | "redirect_rejected"
  | "unexpected_response"
  | "length_mismatch"
  | "hash_mismatch"
  | "hash_unavailable"
  | "invalid_html"
  | "unsafe_html"
  | "remote_reference"
  | "unlisted_asset";

export class ReviewedHtmlPreviewError extends Error {
  readonly code: ReviewedHtmlPreviewErrorCode;

  constructor(code: ReviewedHtmlPreviewErrorCode, message: string) {
    super(message);
    this.name = "ReviewedHtmlPreviewError";
    this.code = code;
  }
}

export interface ReviewedAttachmentBytes {
  attachmentId: string;
  filename: string;
  contentType: string;
  byteSize: number;
  /** Lowercase hex SHA-256 of the exact reviewed bytes. */
  sha256: string;
}

export interface ReviewedAssetAttachment extends ReviewedAttachmentBytes {
  /** How the HTML refers to the asset: `assets/<filename>` or `/assets/<filename>`. */
  reference: string;
}

export interface ReviewedHtmlPreviewDescriptor {
  kind: typeof REVIEWED_HTML_PREVIEW_DESCRIPTOR_KIND;
  version: typeof REVIEWED_HTML_PREVIEW_DESCRIPTOR_VERSION;
  /** Bound by the trusted registrar to one company, issue, task and review revision. */
  scope: ReviewedHtmlPreviewScope;
  html: ReviewedAttachmentBytes;
  assets: ReviewedAssetAttachment[];
}

export interface ReviewedHtmlPreviewScope {
  companyId: string;
  issueId: string;
  taskId: string;
  reviewVersion: number;
}

export interface ValidatedReviewedAttachment extends ReviewedAttachmentBytes {
  contentPath: string;
}

export interface ValidatedReviewedAsset extends ValidatedReviewedAttachment {
  reference: string;
  /** `reference` without its optional leading slash. */
  normalizedReference: string;
}

export interface ValidatedReviewedHtmlPreview {
  scope: ReviewedHtmlPreviewScope;
  html: ValidatedReviewedAttachment;
  assets: ValidatedReviewedAsset[];
  totalBytes: number;
}

export interface VerifiedReviewedAsset {
  asset: ValidatedReviewedAsset;
  bytes: Uint8Array;
}

export interface AssembledReviewedHtmlPreview {
  srcDoc: string;
  html: { attachmentId: string; filename: string; downloadPath: string };
  sandbox: typeof REVIEWED_HTML_PREVIEW_IFRAME_SANDBOX;
  csp: string;
  networkIsolation: typeof REVIEWED_HTML_PREVIEW_NETWORK_ISOLATION;
  residualRisks: readonly string[];
  unreferencedAssetIds: string[];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SHA256_RE = /^[0-9a-f]{64}$/;
const FILENAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const ASSET_REFERENCE_RE = /^\/?assets\/([A-Za-z0-9][A-Za-z0-9._-]{0,127})$/;

const HTML_CONTENT_TYPE = "text/html";
const HTML_EXTENSIONS = [".html", ".htm"];

const ASSET_TYPES: Record<string, { extensions: string[]; matches: (bytes: Uint8Array) => boolean }> = {
  "image/png": {
    extensions: [".png"],
    matches: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  "image/jpeg": {
    extensions: [".jpg", ".jpeg"],
    matches: (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  },
  "image/gif": {
    extensions: [".gif"],
    matches: (b) => startsWith(b, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) || startsWith(b, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]),
  },
  "image/webp": {
    extensions: [".webp"],
    matches: (b) => startsWith(b, [0x52, 0x49, 0x46, 0x46]) && startsWith(b.subarray(8), [0x57, 0x45, 0x42, 0x50]),
  },
  "font/ttf": {
    extensions: [".ttf"],
    matches: (b) => startsWith(b, [0x00, 0x01, 0x00, 0x00]),
  },
};

function startsWith(bytes: Uint8Array, prefix: number[]) {
  if (bytes.length < prefix.length) return false;
  return prefix.every((value, index) => bytes[index] === value);
}

function fail(code: ReviewedHtmlPreviewErrorCode, message: string): never {
  throw new ReviewedHtmlPreviewError(code, message);
}

/** The only URL this module will ever fetch: the existing attachment content route. */
export function reviewedAttachmentContentPath(attachmentId: string) {
  if (!UUID_RE.test(attachmentId)) fail("invalid_descriptor", "Attachment id must be a lowercase UUID.");
  return `/api/attachments/${attachmentId}/content`;
}

export function reviewedAttachmentDownloadPath(attachmentId: string) {
  return `${reviewedAttachmentContentPath(attachmentId)}?download=1`;
}

// ---------------------------------------------------------------------------
// Descriptor validation
// ---------------------------------------------------------------------------

function readStrictRecord(value: unknown, keys: readonly string[], label: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail("invalid_descriptor", `${label} must be an object.`);
  }
  const record = value as Record<string, unknown>;
  // Unknown fields (e.g. `url` or `path`) are rejected rather than ignored.
  for (const key of Object.keys(record)) {
    if (!keys.includes(key)) fail("invalid_descriptor", `${label} has unexpected field "${key}".`);
  }
  for (const key of keys) {
    if (!Object.hasOwn(record, key)) fail("invalid_descriptor", `${label} is missing "${key}".`);
  }
  return record;
}

function extensionOf(filename: string) {
  const dot = filename.lastIndexOf(".");
  return dot < 0 ? "" : filename.slice(dot).toLowerCase();
}

const ATTACHMENT_KEYS = ["attachmentId", "filename", "contentType", "byteSize", "sha256"] as const;
const SCOPE_KEYS = ["companyId", "issueId", "taskId", "reviewVersion"] as const;

function validateScope(input: unknown): ReviewedHtmlPreviewScope {
  const scope = readStrictRecord(input, SCOPE_KEYS, "descriptor.scope");
  for (const key of ["companyId", "issueId", "taskId"] as const) {
    if (typeof scope[key] !== "string" || !UUID_RE.test(scope[key])) {
      fail("invalid_descriptor", `descriptor.scope.${key} must be a lowercase UUID.`);
    }
  }
  if (typeof scope.reviewVersion !== "number" || !Number.isSafeInteger(scope.reviewVersion) || scope.reviewVersion < 1) {
    fail("invalid_descriptor", "descriptor.scope.reviewVersion must be a positive integer.");
  }
  return scope as unknown as ReviewedHtmlPreviewScope;
}

function validateAttachment(
  row: Record<string, unknown>,
  label: string,
  role: "html" | "asset",
): ValidatedReviewedAttachment {
  const { attachmentId, filename, contentType, byteSize, sha256 } = row;

  if (typeof attachmentId !== "string" || !UUID_RE.test(attachmentId)) {
    fail("invalid_descriptor", `${label}.attachmentId must be a lowercase UUID.`);
  }
  if (typeof filename !== "string" || !FILENAME_RE.test(filename) || filename.includes("..")) {
    fail("invalid_descriptor", `${label}.filename must be a plain file name (letters, digits, ".", "_", "-").`);
  }
  if (typeof contentType !== "string") fail("invalid_descriptor", `${label}.contentType must be a string.`);
  const allowedExtensions = role === "html"
    ? contentType === HTML_CONTENT_TYPE ? HTML_EXTENSIONS : null
    : ASSET_TYPES[contentType]?.extensions ?? null;
  if (!allowedExtensions) fail("unsupported_mime", `${label}.contentType "${contentType}" is not allowed.`);
  if (!allowedExtensions.includes(extensionOf(filename))) {
    fail("unsupported_mime", `${label}.filename extension does not match ${contentType}.`);
  }
  if (typeof byteSize !== "number" || !Number.isSafeInteger(byteSize) || byteSize < 1) {
    fail("invalid_descriptor", `${label}.byteSize must be a positive integer.`);
  }
  if (byteSize > MAX_REVIEWED_ATTACHMENT_BYTES) {
    fail("size_limit", `${label} is ${byteSize} bytes; the limit is ${MAX_REVIEWED_ATTACHMENT_BYTES}.`);
  }
  if (typeof sha256 !== "string" || !SHA256_RE.test(sha256)) {
    fail("invalid_descriptor", `${label}.sha256 must be 64 lowercase hex characters.`);
  }

  return {
    attachmentId,
    filename,
    contentType,
    byteSize,
    sha256,
    contentPath: reviewedAttachmentContentPath(attachmentId),
  };
}

function validateAsset(value: unknown, label: string): ValidatedReviewedAsset {
  const row = readStrictRecord(value, [...ATTACHMENT_KEYS, "reference"], label);
  const attachment = validateAttachment(row, label, "asset");
  const reference = row.reference;
  // The reference must name the reviewed file itself; no aliases or subdirectories.
  if (
    typeof reference !== "string" ||
    (reference !== `assets/${attachment.filename}` && reference !== `/assets/${attachment.filename}`)
  ) {
    fail("invalid_reference", `${label}.reference must be "assets/${attachment.filename}" or "/assets/${attachment.filename}".`);
  }
  return { ...attachment, reference, normalizedReference: `assets/${attachment.filename}` };
}

export function validateReviewedHtmlPreviewDescriptor(input: unknown): ValidatedReviewedHtmlPreview {
  const root = readStrictRecord(input, ["kind", "version", "scope", "html", "assets"], "descriptor");
  if (root.kind !== REVIEWED_HTML_PREVIEW_DESCRIPTOR_KIND) {
    fail("invalid_descriptor", `descriptor.kind must be "${REVIEWED_HTML_PREVIEW_DESCRIPTOR_KIND}".`);
  }
  if (root.version !== REVIEWED_HTML_PREVIEW_DESCRIPTOR_VERSION) {
    fail("invalid_descriptor", `descriptor.version ${String(root.version)} is not supported.`);
  }
  if (!Array.isArray(root.assets)) fail("invalid_descriptor", "descriptor.assets must be an array.");
  if (root.assets.length > MAX_REVIEWED_PREVIEW_ASSETS) {
    fail("size_limit", `descriptor lists ${root.assets.length} assets; the limit is ${MAX_REVIEWED_PREVIEW_ASSETS}.`);
  }

  const html = validateAttachment(
    readStrictRecord(root.html, ATTACHMENT_KEYS, "descriptor.html"),
    "descriptor.html",
    "html",
  );
  const assets = root.assets.map((row, index) => validateAsset(row, `descriptor.assets[${index}]`));

  const ids = new Set([html.attachmentId]);
  const filenames = new Set([html.filename.toLowerCase()]);
  const hashes = new Set([html.sha256]);
  const references = new Set<string>();
  for (const asset of assets) {
    if (ids.has(asset.attachmentId)) fail("duplicate_asset", `Attachment ${asset.attachmentId} is listed more than once.`);
    if (filenames.has(asset.filename.toLowerCase())) fail("duplicate_asset", `File name "${asset.filename}" is listed more than once.`);
    if (hashes.has(asset.sha256)) fail("duplicate_asset", `Asset "${asset.filename}" duplicates the bytes of another listed file.`);
    if (references.has(asset.normalizedReference)) {
      fail("duplicate_asset", `Reference "${asset.reference}" is ambiguous with another listed asset.`);
    }
    ids.add(asset.attachmentId);
    filenames.add(asset.filename.toLowerCase());
    hashes.add(asset.sha256);
    references.add(asset.normalizedReference);
  }

  const totalBytes = assets.reduce((sum, asset) => sum + asset.byteSize, html.byteSize);
  if (totalBytes > MAX_REVIEWED_PREVIEW_TOTAL_BYTES) {
    fail("size_limit", `Preview totals ${totalBytes} bytes; the limit is ${MAX_REVIEWED_PREVIEW_TOTAL_BYTES}.`);
  }

  return { scope: validateScope(root.scope), html, assets, totalBytes };
}

// ---------------------------------------------------------------------------
// Byte verification
// ---------------------------------------------------------------------------

export async function sha256Hex(bytes: Uint8Array<ArrayBuffer>) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) fail("hash_unavailable", "SHA-256 is unavailable in this browser context.");
  const digest = await subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export interface FetchReviewedAttachmentOptions {
  /** Origin of the Paperclip app, e.g. `window.location.origin`. */
  origin: string;
  signal: AbortSignal;
  fetchImpl?: typeof fetch;
}

export interface LoadReviewedHtmlPreviewOptions extends FetchReviewedAttachmentOptions {
  /** Current trusted route/task scope, independent of the reviewed descriptor. */
  scope: ReviewedHtmlPreviewScope;
}

function expectedContentUrl(attachment: ValidatedReviewedAttachment, origin: string) {
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    fail("fetch_failed", "Preview origin is not a valid URL.");
  }
  if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") || parsed.origin !== origin) {
    fail("fetch_failed", "Preview origin must be a bare http(s) origin.");
  }
  return new URL(reviewedAttachmentContentPath(attachment.attachmentId), parsed.origin).href;
}

function discardBody(response: Response) {
  response.body?.cancel().catch(() => {});
}

function rethrowAbort(signal: AbortSignal, error: unknown): never {
  if (signal.aborted) fail("aborted", "Preview load was cancelled.");
  throw error;
}

async function readBoundedBody(response: Response, limit: number, signal: AbortSignal) {
  const reader = response.body?.getReader();
  if (!reader) {
    fail("unexpected_response", "Attachment response cannot be read with a bounded stream.");
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        reader.cancel().catch(() => {});
        fail("length_mismatch", "Response body is larger than the reviewed size.");
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof ReviewedHtmlPreviewError) throw error;
    rethrowAbort(signal, new ReviewedHtmlPreviewError("fetch_failed", "Attachment download was interrupted."));
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

/**
 * Downloads one attachment from its fixed same-origin content route and
 * returns the bytes only if status, final URL, MIME, length, SHA-256 and file
 * signature all match the reviewed descriptor.
 */
export async function fetchVerifiedReviewedAttachment(
  attachment: ValidatedReviewedAttachment,
  { origin, signal, fetchImpl = globalThis.fetch }: FetchReviewedAttachmentOptions,
): Promise<Uint8Array<ArrayBuffer>> {
  const url = expectedContentUrl(attachment, origin);
  if (signal.aborted) fail("aborted", "Preview load was cancelled.");

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "GET",
      credentials: "same-origin",
      redirect: "error",
      cache: "no-store",
      headers: { Accept: attachment.contentType },
      signal,
    });
  } catch {
    rethrowAbort(signal, new ReviewedHtmlPreviewError(
      "fetch_failed",
      `Could not download ${attachment.filename} (redirects are rejected).`,
    ));
  }

  const reject = (code: ReviewedHtmlPreviewErrorCode, message: string): never => {
    discardBody(response);
    fail(code, `${attachment.filename}: ${message}`);
  };
  if (signal.aborted) reject("aborted", "load was cancelled.");
  if (response.redirected || response.type === "opaqueredirect") reject("redirect_rejected", "response was redirected.");
  if (response.type !== "basic" && response.type !== "default") reject("unexpected_response", `unexpected ${response.type} response.`);
  if (response.url !== url) reject("unexpected_response", "response URL does not match the attachment route.");
  if (response.status !== 200) reject("unexpected_response", `server responded ${response.status}.`);

  const mediaType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (mediaType !== attachment.contentType) {
    reject("unsupported_mime", `served as "${mediaType || "unknown"}", reviewed as "${attachment.contentType}".`);
  }
  const contentLength = response.headers.get("content-length");
  if (contentLength !== null && (!/^\d+$/.test(contentLength) || Number(contentLength) !== attachment.byteSize)) {
    reject("length_mismatch", `Content-Length ${contentLength} does not match reviewed size ${attachment.byteSize}.`);
  }

  const bytes = await readBoundedBody(response, attachment.byteSize, signal);
  if (bytes.byteLength !== attachment.byteSize) {
    fail("length_mismatch", `${attachment.filename}: received ${bytes.byteLength} bytes, reviewed ${attachment.byteSize}.`);
  }
  if ((await sha256Hex(bytes)) !== attachment.sha256) {
    fail("hash_mismatch", `${attachment.filename}: bytes do not match the reviewed SHA-256.`);
  }
  const assetType = ASSET_TYPES[attachment.contentType];
  if (assetType && !assetType.matches(bytes)) {
    fail("unsupported_mime", `${attachment.filename}: contents are not a valid ${attachment.contentType} file.`);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

// Comments and <script>/<style> bodies, whichever starts first. Group 2 is a raw-text body.
const RAW_TEXT_RE = /<!--[\s\S]*?-->|<(script|style)\b(?:"[^"]*"|'[^']*'|[^'">])*>([\s\S]*?)<\/\1\s*>/dgi;
const TAG_RE = /<[A-Za-z](?:"[^"]*"|'[^']*'|[^'">])*>/g;
const URL_ATTRIBUTE_RE =
  /[\s/](?:src|href|xlink:href|poster|data|action|formaction|background|ping|manifest|icon|longdesc|lowsrc|dynsrc|cite)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/dgi;
const CSS_URL_RE = /(?<![\w-])url\(\s*(?:"([^"]*)"|'([^']*)'|([^"'()\s]*))\s*\)/dgi;
const QUOTED_ASSET_RE = /(["'`])(\/?assets\/[A-Za-z0-9][A-Za-z0-9._-]*)\1/dg;

interface RawTextRange {
  start: number;
  end: number;
  script: boolean;
}

function rawTextRanges(text: string): RawTextRange[] {
  const ranges: RawTextRange[] = [];
  for (const match of text.matchAll(RAW_TEXT_RE)) {
    const body = match.indices?.[2];
    ranges.push(body
      ? { start: body[0], end: body[1], script: match[1].toLowerCase() === "script" }
      : { start: match.index, end: match.index + match[0].length, script: false });
  }
  return ranges;
}

function insideAny(
  ranges: RawTextRange[],
  position: number,
  filter: (range: RawTextRange) => boolean = () => true,
) {
  return ranges.some((range) => filter(range) && position >= range.start && position < range.end);
}

const ACTIVE_SCHEMES = new Set(["javascript", "vbscript", "livescript", "data", "blob", "filesystem", "jar", "mhtml"]);
const XML_NAMESPACE_RE =
  /xmlns(?::[a-z]+)?\s*=\s*(["'])http:\/\/www\.w3\.org\/(?:2000\/svg|1999\/xlink|1999\/xhtml|1998\/Math\/MathML)\1/gi;

function decodeForScan(text: string) {
  const fromCodePoint = (value: number) => (value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : "");
  return text
    .replace(XML_NAMESPACE_RE, "")
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) => fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, dec: string) => fromCodePoint(parseInt(dec, 10)))
    .replace(/&colon;/gi, ":")
    .replace(/&sol;/gi, "/")
    .replace(/&(?:tab|newline);/gi, "")
    .replace(/[\t\n\r]/g, "");
}

function scanForForbiddenContent(text: string) {
  if (text.includes("\u0000")) fail("invalid_html", "HTML contains NUL characters.");
  // Do not mistake a quoted HTML template inside a reviewed inline script for
  // a markup element. CSP still blocks frames dynamically created by script.
  const markup = rawTextRanges(text)
    .sort((a, b) => b.start - a.start)
    .reduce((value, range) => value.slice(0, range.start) + " ".repeat(range.end - range.start) + value.slice(range.end), text);
  if (/<base\b/i.test(markup)) fail("unsafe_html", "<base> tags are not allowed.");
  if (/[\s/]http-equiv\s*=/i.test(markup)) fail("unsafe_html", "<meta http-equiv> is not allowed; the preview injects its own policy.");
  if (/@import\b/i.test(text)) fail("unsafe_html", "CSS @import is not allowed.");
  if (/[\s/](?:srcset|imagesrcset|srcdoc)\s*=/i.test(markup)) {
    fail("unsafe_html", "srcset/imagesrcset/srcdoc attributes are not supported; reference one listed asset with src.");
  }
  const embed = /<(iframe|frame|frameset|object|embed|applet|portal|fencedframe)\b/i.exec(markup);
  if (embed) fail("unsafe_html", `<${embed[1].toLowerCase()}> elements are not allowed.`);

  const scan = decodeForScan(text);
  if (/(?<![a-z0-9+.-])(?:https?|wss?|ftps?):[\\/]/i.test(scan)) {
    fail("remote_reference", "Remote URLs are not allowed in a reviewed preview.");
  }
  if (/["'`(]\s*\/\/[^\s"'`)\/]/.test(scan)) {
    fail("remote_reference", "Protocol-relative URLs are not allowed in a reviewed preview.");
  }
  const active = /["'`(=]\s*([a-z][a-z0-9+.-]*):/gi;
  for (const match of scan.matchAll(active)) {
    if (ACTIVE_SCHEMES.has(match[1].toLowerCase())) {
      fail("unsafe_html", `Active URL scheme "${match[1].toLowerCase()}:" is not allowed.`);
    }
  }
}

interface Edit {
  start: number;
  end: number;
  replacement: string | null;
}

function overlaps(edits: Edit[], start: number, end: number) {
  return edits.some((edit) => start < edit.end && end > edit.start);
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

/**
 * Pure: turns verified HTML bytes plus verified asset bytes into a `srcdoc`
 * string. Rejects (never strips) anything it cannot map to a listed asset.
 */
export function assembleReviewedHtmlDocument(
  htmlBytes: Uint8Array,
  verifiedAssets: VerifiedReviewedAsset[],
): { srcDoc: string; referencedAssetIds: Set<string> } {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(htmlBytes);
  } catch {
    fail("invalid_html", "HTML is not valid UTF-8.");
  }
  scanForForbiddenContent(text);

  const dataUris = new Map<string, { uri: string; attachmentId: string }>();
  for (const { asset, bytes } of verifiedAssets) {
    dataUris.set(asset.normalizedReference, {
      uri: `data:${asset.contentType};base64,${bytesToBase64(bytes)}`,
      attachmentId: asset.attachmentId,
    });
  }
  const referencedAssetIds = new Set<string>();
  const edits: Edit[] = [];

  const resolveReference = (raw: string): string | null => {
    const value = raw.replace(/^[\u0000- ]+|[\u0000- ]+$/g, "");
    if (/^#[A-Za-z0-9_-]*$/.test(value)) return null;
    if (value === "") fail("invalid_reference", "Empty URL references are ambiguous.");
    if (/[&%\\]/.test(value)) fail("invalid_reference", `Reference "${value}" uses escapes and is ambiguous.`);
    const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value);
    if (scheme) {
      if (ACTIVE_SCHEMES.has(scheme[1].toLowerCase())) fail("unsafe_html", `Active URL scheme in "${value}".`);
      fail("remote_reference", `External reference "${value}" is not allowed.`);
    }
    if (value.startsWith("//")) fail("remote_reference", `Protocol-relative reference "${value}" is not allowed.`);
    const match = ASSET_REFERENCE_RE.exec(value);
    const listed = match && !match[1].includes("..") ? dataUris.get(`assets/${match[1]}`) : undefined;
    if (!listed) {
      fail("unlisted_asset", `"${value}" is not a listed reviewed asset (use assets/<file> for a listed attachment).`);
    }
    referencedAssetIds.add(listed.attachmentId);
    return listed.uri;
  };

  const addUrlEdit = (match: RegExpMatchArray, offset: number) => {
    const group = [1, 2, 3].find((index) => match[index] !== undefined);
    const range = group === undefined ? undefined : match.indices?.[group];
    if (!range) return;
    const start = offset + range[0];
    const end = offset + range[1];
    if (overlaps(edits, start, end)) return;
    edits.push({ start, end, replacement: resolveReference(match[group!]) });
  };

  const rawText = rawTextRanges(text);
  // URL attributes are only read from real markup tags, never from script,
  // style or comment bodies, so ordinary JS such as `let data = x` is not misread.
  for (const tag of text.matchAll(TAG_RE)) {
    if (insideAny(rawText, tag.index)) continue;
    for (const match of tag[0].matchAll(URL_ATTRIBUTE_RE)) addUrlEdit(match, tag.index);
  }
  // CSS url() in <style> bodies and style attributes; script bodies only get the quoted pass below.
  for (const match of text.matchAll(CSS_URL_RE)) {
    if (insideAny(rawText, match.index, (range) => range.script)) continue;
    addUrlEdit(match, 0);
  }
  // Exact asset paths quoted in inline script or CSS strings.
  for (const match of text.matchAll(QUOTED_ASSET_RE)) {
    const range = match.indices?.[2];
    if (!range || overlaps(edits, range[0], range[1])) continue;
    edits.push({ start: range[0], end: range[1], replacement: resolveReference(match[2]) });
  }

  const masked = edits.reduce(
    (current, edit) => current.slice(0, edit.start) + " ".repeat(edit.end - edit.start) + current.slice(edit.end),
    text,
  );
  if (/assets\//i.test(masked)) {
    fail("invalid_reference", "An assets/ path appears outside a recognised reference and would be ambiguous.");
  }

  const heads = [...text.matchAll(/<head\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi)];
  if (heads.length !== 1) fail("unsafe_html", "HTML must contain exactly one <head> element.");
  const head = heads[0];
  if (!/^\s*(?:<!doctype html[^>]*>\s*)?(?:<html\b[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*$/i.test(text.slice(0, head.index))) {
    fail("unsafe_html", "Only a doctype and <html> may appear before <head>.");
  }
  const headEnd = head.index + head[0].length;
  edits.push({
    start: headEnd,
    end: headEnd,
    replacement:
      `<meta http-equiv="Content-Security-Policy" content="${REVIEWED_HTML_PREVIEW_CSP}">` +
      `<meta name="referrer" content="no-referrer">`,
  });

  let srcDoc = text;
  for (const edit of [...edits].sort((a, b) => b.start - a.start)) {
    if (edit.replacement === null) continue;
    srcDoc = srcDoc.slice(0, edit.start) + edit.replacement + srcDoc.slice(edit.end);
  }
  return { srcDoc, referencedAssetIds };
}

/**
 * Validates the trusted descriptor, downloads and verifies every listed byte,
 * then assembles the sandbox document. Nothing is returned (and so nothing can
 * be displayed) unless every check passes.
 */
export async function loadReviewedHtmlPreview(
  descriptor: unknown,
  options: LoadReviewedHtmlPreviewOptions,
): Promise<AssembledReviewedHtmlPreview> {
  const validated = validateReviewedHtmlPreviewDescriptor(descriptor);
  const currentScope = validateScope(options.scope);
  for (const key of SCOPE_KEYS) {
    if (validated.scope[key] !== currentScope[key]) {
      fail("invalid_descriptor", `Reviewed preview does not match current ${key}.`);
    }
  }
  if (options.signal.aborted) fail("aborted", "Preview load was cancelled.");

  // One failed download cancels the rest; the caller's signal cancels all.
  const controller = new AbortController();
  const forwardAbort = () => controller.abort();
  options.signal.addEventListener("abort", forwardAbort);
  const scoped = { ...options, signal: controller.signal };
  try {
    const [htmlBytes, ...assetBytes] = await Promise.all([
      fetchVerifiedReviewedAttachment(validated.html, scoped),
      ...validated.assets.map((asset) => fetchVerifiedReviewedAttachment(asset, scoped)),
    ]);
    const { srcDoc, referencedAssetIds } = assembleReviewedHtmlDocument(
      htmlBytes,
      validated.assets.map((asset, index) => ({ asset, bytes: assetBytes[index] })),
    );
    return {
      srcDoc,
      html: {
        attachmentId: validated.html.attachmentId,
        filename: validated.html.filename,
        downloadPath: reviewedAttachmentDownloadPath(validated.html.attachmentId),
      },
      sandbox: REVIEWED_HTML_PREVIEW_IFRAME_SANDBOX,
      csp: REVIEWED_HTML_PREVIEW_CSP,
      networkIsolation: REVIEWED_HTML_PREVIEW_NETWORK_ISOLATION,
      residualRisks: REVIEWED_HTML_PREVIEW_RESIDUAL_RISKS,
      unreferencedAssetIds: validated.assets
        .map((asset) => asset.attachmentId)
        .filter((id) => !referencedAssetIds.has(id)),
    };
  } catch (error) {
    controller.abort();
    if (options.signal.aborted) fail("aborted", "Preview load was cancelled.");
    throw error;
  } finally {
    options.signal.removeEventListener("abort", forwardAbort);
  }
}
