# Board-reviewed HTML attachment previews

A board operator can register the exact bytes of one HTML issue attachment
(plus up to 16 listed image/font assets) that they reviewed. Board users can then
open that page from an ordinary issue route in the sandboxed preview component.
Agent Chat conversation issues are excluded because they have a separate
conversation-owner write rule and do not render the ordinary issue header.

## Trust state

The trust state is `board_reviewed_bytes`. It means a board operator registered
these exact bytes. It does not mean an independent QA process verified them.
Agents can upload attachments. They cannot register, change or revoke a review:
every reviewed-html route calls `assertBoard`, and no document, comment,
work-product or generic issue route writes the registry.

The attachments stay ordinary issue attachments. Anyone who can read the issue,
including agents on that issue, can download them from
`/api/attachments/:id/content`.

## Operator API (board only)

```sh
# 1. Hash the exact local copies you reviewed.
sha256sum page.html assets/logo.png

# 2. Look up the latest version (0 when none).
curl -s "$PAPERCLIP/api/issues/$ISSUE_ID/reviewed-html"

# 3. Register. The server re-reads the stored bytes (capped at 1 MiB per file and
#    4 MiB in total), computes SHA-256, and rejects any mismatch.
curl -s -X POST "$PAPERCLIP/api/issues/$ISSUE_ID/reviewed-html" \
  -H 'Content-Type: application/json' \
  -d '{
    "companyId": "<company uuid>",
    "expectedLatestVersion": 0,
    "confirmExactBytesReviewed": true,
    "html":   { "attachmentId": "<uuid>", "sha256": "<hex>" },
    "assets": [{ "attachmentId": "<uuid>", "sha256": "<hex>" }]
  }'

# Revoke the active version.
curl -s -X POST "$PAPERCLIP/api/issues/$ISSUE_ID/reviewed-html/1/revoke" \
  -H 'Content-Type: application/json' -d '{"companyId":"<company uuid>"}'
```

To reference an asset, the page uses `assets/<attachment filename>`.

## Opening a review

The issue page shows "Open private page preview (vN)" when a review is active.
The durable link is the issue URL plus `?reviewedHtml=N`. A new registration
supersedes version N. Revocation ends it. In both cases the old link returns 410
and shows an error; it never shows the newer bytes. If a reviewed attachment is
deleted, the link fails closed with 409.

The sandboxed page can still make a network request when it navigates its own
frame. See `REVIEWED_HTML_PREVIEW_RESIDUAL_RISKS` in
`ui/src/lib/reviewed-html-preview.ts`.

Revocation and supersession are checked when the summary and descriptor are
fetched. They stop a stale link from loading on the next fetch; they cannot
remove bytes already delivered to an open browser frame. The issue attachments
remain readable under their normal issue permissions after review revocation.
The separate **Download original** action fetches the current attachment route
at click time; it is not a second readback of the reviewed bytes.
