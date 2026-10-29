# Private 2026.1023.0 port — build only

This branch carries the installed custom journeys onto upstream tag
`v2026.1023.0` (`1b4c803816e82b0265c8422e1a804327a7ed8c54`). It is not an
installation or production approval. The current audit and test receipts live in
`/home/ubuntu/audits/2026-10-29-paperclip-port/RESULT.md`.

The feature commits preserve reviewed HTML and owner revision feedback, the
original custom migration and journal entry, refreshable Claude subscription
credentials and reconnect writeback guards, blocked auth recovery and the scoped
Scout outbox, private managed skills, linked-worktree Git access, CONNECT teardown,
merged-usr mounts, managed Codex policy, conformant MCP results, bounded connection
timeouts, tool retention after health failures, wake issue aliases and canonical
binding comparison including router bindings.

Only the bounded wake environment payload and Codex MCP header-spelling patches
are retired: upstream removes the environment channel and already emits
`http_headers`. Target login already enforces isolation, covered by a new reconnect
test. No customer/provider workflow or notification delivery is asserted.

The custom `0280_quick_phalanx` SQL and journal entry remain unchanged alongside
upstream `0280_unique_genesis`. The numbering exception is exact and hash-pinned;
additive migration `0334_validate_reviewed_html_registry` verifies schema integrity.
Fresh and synthetic installed-history fixtures retain both migration histories.
No live database was accessed by this port task.

The installed native runner matches retained outputs from the PC455 candidate,
whose entire runner source tree matches `515f26d58` and PC457. No additional local
Rust feature was found. The target runner's protocol tests pass, but this VM lacks
Cargo/Rust. Its executable is provisionally reused from the verified target npm
archive. A source rebuild and Rust tests remain outstanding; artifacts are NOT-YET.

## Reproduce provisional packaging

Use Node 24 and pnpm 9.15.4. Build the public workspace packages, standalone public
plugins and CLI with the repository's build scripts. Build the runner TypeScript
and server with matching vendored runner output; preserve the native limitation
instead of claiming the skipped Cargo step succeeded. Build UI and run
`PAPERCLIP_RELEASE_REUSE_UI_DIST=1 bash scripts/prepare-server-ui-dist.sh`.

Commit all source first, then rerun the server build-stamp script. Invoke:

```sh
node scripts/pack-port-artifacts.mjs /path/to/new-audit-stage /path/to/PROVISIONAL-NATIVE.json
```

The helper uses the release package map, publish-manifest generators and bundled
dependency staging/patches from `scripts/release.sh`, without invoking its publish
or install paths. It stages source manifests privately, packages version
`2026.1023.0-jarvis.port.1`, disables npm lifecycle scripts, copies release skills,
checks native digest and clean source head, and emits tarballs plus hashes under
the new stage's `dist/`. No source manifests are rewritten. The native provenance
also travels inside the server tarball. This helper intentionally refuses a normal
release: it requires the explicit provisional native-reuse record.

Provider-free checks use a disposable audit PostgreSQL cluster on port 55492 and
an isolated network namespace. Some upstream tests require excluded live services,
provider access or their own embedded clusters. Keep their untested boundary and
baseline failures visible in the final audit. The external host Codex relay remains
a separate release acceptance boundary. Do not replace its prefix through this task.
