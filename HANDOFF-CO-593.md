> **Renamed to PC-457 (Oct 26, operator).** "CO-593" collided with a different, already-merged jarvis-system change order (paper-desk test cleanup). This Paperclip package change is **PC-457**. Branch: `fix/pc-457-tool-gateway-skills`. Worktree: `/home/ubuntu/jarvis-change-orders/codex-pc-457-paperclip-tool-gateway`.

# CO-593 handoff — remote MCP reliability and managed Claude skills

Status: implemented and committed locally; compiled candidate prepared. **Not installed or released.**

## Source and boundaries

- Branch: `fix/co-593-tool-gateway-skills`.
- Required source parent: `2828f1a0507d5ba8e05287fa0693c81a676313c8`.
- Runtime source child: `7b9e38b6326149596679cabc12bbf862bf294bb6`.
- Logical commits: `d400ce90b` (MCP result/timeout/assignment fixes), `e907654be` (Claude skills), `7b9e38b63` (wakeup validation). The later handoff/artifact commit does not change runtime sources.
- No writes to the live Paperclip install, service, database, other worktrees, or jarvis-system. Installed files and the existing overlay/verifier were read only for the requested comparison. No pushes, deployments, restarts, provider calls, dependency upgrades, lockfile edits, or migrations.
- Dependencies installed using `pnpm install --offline --frozen-lockfile`, exit **0**, downloaded **0**. An initial install used the shell's Node 20; the same frozen offline install was repeated successfully under Node **24.21.0**. Tests, final typechecks and compilation use Node 24.21.0, pnpm **9.15.4**, TypeScript **7.0.2**.
- The task's explicit live-system prohibition overrides the normal shared-work checkpoint workflow. This handoff and artifacts are **not published to Paperclip**. The release operator must attach them to the existing work record; this session did not create another issue or claim shared-state publication.

## Root causes and fixes

1. **Malformed MCP results.** At the parent, `server/src/services/tool-gateway.ts:5726` synthesized `structuredContent: null`; `server/src/routes/tool-gateway.ts:186` also emitted a nullable wrapper and always set `isError: false`. Runtime-tools (`routes/connection-intents.ts`) and project tools serialized arbitrary values as structured content. The shared serializer now accepts only plain objects (`server/src/services/mcp-http.ts:171`); remote normalization uses it (`services/tool-gateway.ts:5732`), and all three route surfaces use it. Gateway text wrapping remains compatible, including the existing Google permission guidance; provider `isError` is preserved (`routes/tool-gateway.ts:185`). Tests validate actual serialized JSON against the MCP CallToolResult fields exercised by the fixtures (text/image and optional object structuredContent), including missing, null, scalar, array, valid object and readable error text. No new MCP SDK dependency was added.
2. **Short timeouts and disappearing tools.** The gateway normalized caller timeouts before reading connection configuration, defaulting to 10s and clamping at 60s. It also selected tools only from healthy connections; heartbeat and native-runtime setup repeated health filters. `remoteToolTimeoutMs` (`services/tool-gateway.ts:652`) now reads transportConfig first, then legacy config, bounds configured values to 1,000–120,000ms, and honors a smaller caller timeout. The PATCH schema validates integers in that range (`packages/shared/src/validators/tool-access.ts:148`). Unconfigured connections keep the 10s default and existing caller override up to 60s. Approved actions retain their existing 60s budget. Health remains observable, but no longer grants/revokes access (`services/tool-gateway.ts:1216`, `services/heartbeat.ts:4532` and `:4993`, `services/native-runtime/runtime-context.ts:199`). Active/enabled status, assigned profiles, quarantines, company identity and credential grants still apply. Tests cover the actual abort timer and clamp behavior, timeout/transport failure followed by a successful same-session call, discovery in a later run, native/Claude assignment retention, disabled-connection exclusion and health recovery to `ok`.
3. **Company skills hidden by user-only Claude settings.** Parent CLI preparation put skills in the prompt bundle's project scope, while managed connections passed `--setting-sources user`. Sources could be outside the sandbox mounts. Selected mountable skills are now copied into the private run's `CLAUDE_CONFIG_DIR/skills/<runtimeName>/` (`packages/adapters/claude-local/src/server/execute.ts:555`, shared helper at `packages/adapter-utils/src/server-utils.ts:4497`). The helper excludes symlinks and rejects invalid runtime names/symlink skills homes. Copied files have no write bits; confined CLI runs mount the entire skills subtree read-only after mounting the auth/config home writable (`execute.ts:594`). The equivalent ACP preparation runs before local startup/remote config staging (`packages/adapter-utils/src/acpx-engine/execute.ts:1150`). `--setting-sources user` remains at `execute.ts:903`; project settings are not enabled. Tests inspect selected SKILL.md files, omitted unselected skills/nested symlinks, exact setting scope and sandbox mount order, plus local/remote ACP staging.
4. **Optional wakeup fix.** The existing schema silently stripped top-level issueId. It now rejects it with `400` and `Use payload.issueId to target an issue.` (`packages/shared/src/validators/agent.ts:225`; existing route validation at `server/src/routes/agents.ts:5891`). Use `{ "reason": "Follow up", "payload": { "issueId": "<issue UUID>" } }`. Existing authorization and scheduling semantics remain. Schema, route and OpenAPI regressions pass.

## Verification

The final committed-source focused run passed **13 files / 318 tests**, exit **0**, in **237.61s**. All remote transport/provider responses in these suites were mocks or loopback fixtures; the final run also used a Bubblewrap network namespace, read-only host filesystem and disposable Paperclip state under `/tmp`.

Exact final focused command (after adding the Node 24 bin directory to PATH):

```sh
bwrap --unshare-net --ro-bind / / --bind "$PWD" "$PWD" --bind /tmp /tmp \
  --dev-bind /dev /dev --proc /proc -- \
  env -u DATABASE_URL -u DATABASE_MIGRATION_URL \
  PAPERCLIP_HOME=/tmp/co593-focused-home \
  PAPERCLIP_CONFIG=/tmp/co593-focused-home/config.json \
  PAPERCLIP_INSTANCE_ID=co593-focused \
  pnpm exec vitest run \
  server/src/__tests__/tool-gateway.test.ts \
  server/src/__tests__/tool-gateway-service.test.ts \
  server/src/__tests__/mcp-tool-result.test.ts \
  server/src/__tests__/heartbeat-runtime-mcp-servers.test.ts \
  server/src/services/native-runtime/runtime-context.test.ts \
  server/src/routes/connection-intents.test.ts \
  server/src/__tests__/chat-project-tools.test.ts \
  server/src/__tests__/claude-local-execute.test.ts \
  packages/adapters/claude-local/src/server/acp.test.ts \
  packages/shared/src/validators/tool-access.test.ts \
  packages/shared/src/validators/agent.test.ts \
  server/src/__tests__/agent-permissions-routes.test.ts \
  server/src/__tests__/openapi-routes.test.ts
```

| Check | Exact result |
| --- | --- |
| `pnpm --filter @paperclipai/server exec tsc --noEmit` | Exit 0; no diagnostics. |
| `pnpm --filter @paperclipai/shared exec tsc --noEmit` | Exit 0; no diagnostics. |
| `pnpm --filter @paperclipai/adapter-utils exec tsc --noEmit` | Exit 0; no diagnostics. |
| `pnpm --filter @paperclipai/adapter-claude-local exec tsc --noEmit` | Exit 0; no diagnostics. |
| `pnpm --filter @paperclipai/plugin-sdk ensure-build-deps` | Exit 0; built local shared/SDK declarations needed by server. |
| `pnpm --filter <each of the four packages above> exec tsc -p tsconfig.json` | All four exit 0 in a `set -e` final compilation; emitted JS/maps/declarations/maps. |
| Shared runtime utility tests (`packages/adapter-utils/src/server-utils.test.ts`) | 1 file / 116 tests passed; exit 0. |
| Actual Bubblewrap nested skills mount probe | Exit 0; SKILL.md read succeeded and append failed with `EROFS`. Reproducible source/output in `overlay-candidate/evidence/claude-read-only-probe.*`. |
| Candidate static verification | Exit 0; 48 hashes/modes, 12 JS syntax checks, 241 imports resolved, 7 introduced named bindings found, no removed named exports, and all 24 map diffs limited to mappings. |
| `pnpm -r typecheck` | Exit 1 at paperclip-runner Rust check: `cargo: not found`. |
| `pnpm build` | Exit 1 at paperclip-runner `build:binary`: `cargo: not found`. Prior TypeScript/protocol checks completed; no full build claim. |
| Full touched-package suites | Exit 1; **943 files passed / 9 failed / 4 skipped (956)**; **17,290 tests passed / 32 failed / 60 skipped (17,382)**; 6,328.94s. One of the nine failed files failed in suite setup (missing cargo), so it contributes no failed test count. Details below and in `overlay-candidate/evidence/broad-results.json`. |
| Source whitespace check (`git diff 2828f1a0507d5ba8e05287fa0693c81a676313c8 7b9e38b6326149596679cabc12bbf862bf294bb6 --check`) | Exit 0. |
| Staged artifact whitespace check (`git diff --cached --check`) | Exit 2: raw TypeScript output contains trailing whitespace in 8 generated lines, plus the corresponding line in the installed diff. Emitted bytes are preserved for reproducibility. Excluding `overlay-candidate/tree/` and `installed-runtime.diff` passes with exit 0. |

Full touched-package command used the same filesystem/network isolation, a separate `/tmp/co593-suites-home`, and the following selection. It started before the final route-format correction; the 318-test committed-source run above is the final check for all changed behavior:

```sh
pnpm exec vitest run --project @paperclipai/server \
  --project @paperclipai/shared --project @paperclipai/adapter-utils \
  --project @paperclipai/adapter-claude-local --exclude '**/dist/**' --maxWorkers=2
```

The broad run's final failure inventory is complete (32 failed tests plus one suite-setup failure):

| File / group | Count | Observed cause and disposition |
| --- | --- | --- |
| `adapter-utils/src/acpx-engine/execute.test.ts`, `startup-characterization.test.ts` | 2 tests | Gemini preparation attempts `mkdir /home/ubuntu/.gemini` on the read-only host (`ENOENT`). The changed managed-Claude branch is not entered. |
| `server/src/__tests__/pi-local-execute.test.ts` | 3 tests | Pi session setup attempts `mkdir /home/ubuntu/.pi` (`ENOENT`). Pi source is unchanged. |
| `server/src/__tests__/workspace-runtime.test.ts` | 21 tests | Five provision fixtures attempt writes below `~/.paperclip-worktrees`; sixteen service fixtures try log/registry writes below `~/.paperclip`, failing with `ENOENT`/`EROFS`. The suite clears the temporary Paperclip env between cases. No loopback failure was needed to explain the final diagnostics. |
| `server/src/__tests__/vitest-chat-shards.test.ts` | 1 test | Its nested CLI selects cached pnpm 11.22.0 and attempts to create the read-only `~/.local/share/pnpm/store/v11`; exit 254. This is distinct from the outer pnpm 9.15.4 frozen offline install, which passed. No store/lockfile workaround was applied. |
| `adapter-utils/src/execution-target-stdin-race.test.ts` | 1 test | T22 timed out waiting for a condition; it passed in the isolated rerun below. |
| `server/src/__tests__/chat-channels.integration.test.ts` | 2 tests | One 15s timeout and one missing setup conversation assertion. Both passed in isolation below. |
| `server/src/__tests__/redaction.test.ts` | 2 tests | Existing over-redaction assertions; reproduced in isolation below. Source and test are unchanged from parent. |
| `server/src/services/native-runtime/native-codex-runner.integration.test.ts` | 1 suite setup | `spawnSync cargo ENOENT` in `ensureRunnerTestBinaries`; its test is skipped after the setup failure. This explains the ninth failed file. |

The 27 host-write fixture failures were not worked around by exposing the real host homes or stores. Production/network boundaries remained in place. The complete case names and first diagnostic/location, plus the raw-log digest, are saved in `overlay-candidate/evidence/broad-results.json`.

The repository-wide `pnpm test:run` and browser/release suites were not run; the requested touched packages were exercised instead. Browser/provider acceptance belongs to release, not this offline worktree task. Full workspace readiness is not claimed while the broad failures/build prerequisites remain unresolved.

Initial failed attempts are retained in `/tmp/co593-*.log`: the first gateway run had seven fixture-state path permission failures (default `~/.paperclip`) and one old assertion expecting unhealthy tools to disappear. State was isolated under `/tmp`, and the assertion was updated to retain unhealthy tools while excluding disabled/quarantined entries. A subsequent run overlapped the final response-format review and produced eight stale-transform response-test failures. The clean committed-source rerun above passed all 318 tests. The initial scripted server typecheck stopped before `tsc` at missing cargo; direct server `tsc --noEmit` passed after building the SDK declaration prerequisite. Raw fixture logs are local scratch evidence, not a provider acceptance record. `overlay-candidate/evidence/focused-checks.json` retains the final focused summary and raw-log SHA-256.

The narrower follow-up checks did not reproduce the probe-cleanup or chat-chronology assertions:

- `execution-target-stdin-race.test.ts` T22 passed in isolation. The selected `startup-characterization.test.ts` case failed before reaching its fake `setConfigOption`, at `execute.ts:1366`, because the Gemini fixture attempts `mkdir /home/ubuntu/.gemini` on the read-only host. The two-case run ended **1 passed / 1 failed / 49 skipped**, exit 1 (15.60s). No HOME override or source change was made.
- Both selected chat chronology cases passed: **2 passed / 993 skipped**, exit 0 (68.65s). They exercise Discord close/reopen message chronology and publication binding. Their broad-run failures remain evidence of run-order/timing sensitivity; this rerun does not turn the full suite green.

- The full `redaction.test.ts` isolated rerun ended **24 passed / 2 failed**, exit 1 (380ms). Both failures are over-redaction assertions for prose/metadata/dotted filenames and public hostnames. `server/src/redaction.ts` and the test are byte-identical to the required parent; the imported `redactCommandText` implementation is also unchanged. These remain separate failures, recorded in `overlay-candidate/evidence/redaction-isolated-rerun.*`.

## Compiled candidate and installed comparison

- Candidate: `overlay-candidate/tree/`.
- Full file inventory, before/after SHA-256, mode and package anchors: `overlay-candidate/manifest-draft.json`.
- Complete installed JS/declaration diff: `overlay-candidate/installed-runtime.diff`.
- Static resolution/syntax/export report: `overlay-candidate/compatibility-report.json`.
- Reproduction commands and local-only scripts: `overlay-candidate/README.md`, `assemble.mjs`, `verify-candidate.mjs`.

Compilation matches the existing overlay's direct TypeScript method, confirmed by the prior read-only build receipt at `/home/ubuntu/audits/2026-10-03-founder-team/team/PC-455-PACKAGE-CANDIDATE-NOT-RELEASE/RECEIPT.md`. Only the four runtime outputs of each changed module are included; no package manifest, build stamp, CLI bundle, test outputs, dependency or migration is replaced.

Every JavaScript difference from installed 2026.916.1 plus overlay is explained below. The full diff is the audit trail; there are no additional runtime changes hidden in maps.

| Module prefix | JavaScript difference |
| --- | --- |
| `@paperclipai/adapter-utils/dist/acpx-engine/execute` | Copies selected managed Claude skills to user scope before ACP startup/config staging. |
| `@paperclipai/adapter-utils/dist/server-utils` | Adds contained skill-copy helper, rejects invalid names/symlink homes, checks SKILL.md, removes file write bits. |
| `@paperclipai/adapter-claude-local/dist/server/execute` | Invokes the copy helper and adds the nested read-only skills mount; user-only setting sources remain unchanged. |
| `@paperclipai/shared/dist/validators/agent` | Rejects top-level wakeup issueId with guidance to use payload.issueId. |
| `@paperclipai/shared/dist/validators/tool-access` | Validates optional integer toolTimeoutMs while retaining existing sensitive-config checks. |
| `@paperclipai/server/dist/routes/connection-intents` | Uses the safe structured-content/text result helper for runtime-tools responses. |
| `@paperclipai/server/dist/routes/project-tools` | Uses the same helper for project-tool responses; existing error text behavior remains. |
| `@paperclipai/server/dist/routes/tool-gateway` | Preserves provider isError and text; forwards only valid MCP structuredContent, with safe wrapping for ordinary data. |
| `@paperclipai/server/dist/services/heartbeat` | Removes health as an assignment filter in both new-run MCP configuration paths; disabled and permission checks remain. |
| `@paperclipai/server/dist/services/mcp-http` | Adds plain-object structuredContent filtering and safe JSON text serialization. |
| `@paperclipai/server/dist/services/native-runtime/runtime-context` | Keeps the permitted active connection/tool snapshot after unhealthy last-call status. |
| `@paperclipai/server/dist/services/tool-gateway` | Removes the health catalog filter, normalizes optional structuredContent, resolves per-connection call budgets, passes raw caller budgets. |

Of 12 declaration files, **8 are byte-identical**. The other four are: `server-utils` adds only the new helper; `mcp-http` adds only two helpers; `validators/agent` adds the intentionally forbidden optional top-level issueId (`ZodOptional<ZodNever>`) without changing supported payloads; `tool-gateway` only reorders `error?: undefined` in one union branch. Existing callable signatures and named exports are preserved. All **24 map files** change only their `mappings` field; `sources`, `file`, `names`, `sourceRoot` and format are unchanged.

Static compatibility checks read the installed package manifests (all **2026.916.1**) and resolve imports as if each candidate occupied its installed location. They verify every new named import against the candidate/installed export closure. They do not load the installed server, open its database, execute Claude, or call a provider. Production startup and actual CLI discovery are still acceptance gates.

Exact new `ENTRY_PREFIXES` additions to the existing verifier:

```js
  "@paperclipai/adapter-utils/dist/acpx-engine/execute",
  "@paperclipai/adapter-utils/dist/server-utils",
  "@paperclipai/server/dist/routes/connection-intents",
  "@paperclipai/server/dist/routes/project-tools",
  "@paperclipai/server/dist/routes/tool-gateway",
  "@paperclipai/server/dist/services/mcp-http",
  "@paperclipai/server/dist/services/native-runtime/runtime-context",
  "@paperclipai/server/dist/services/tool-gateway",
  "@paperclipai/shared/dist/validators/agent",
  "@paperclipai/shared/dist/validators/tool-access",
```

`@paperclipai/server/dist/services/heartbeat` and `@paperclipai/adapter-claude-local/dist/server/execute` are already present and must receive the new bytes. Add `@paperclipai/shared/package.json` to the verifier's affected-package anchors. Keep the existing Codex and other repair modules: merging the current 10-module overlay with these 10 new prefixes produces **20 modules / 80 files**, of which this candidate supplies 48. Do not replace the old overlay tree with only this candidate. The current verifier's fixed SHA/archive, key schema and 40-file closure intentionally reject this draft; updating those belongs to the release change order.

Exact candidate file list (all paths under `overlay-candidate/tree/`; all mode `0644`):

```text
@paperclipai/adapter-claude-local/dist/server/execute.d.ts
@paperclipai/adapter-claude-local/dist/server/execute.d.ts.map
@paperclipai/adapter-claude-local/dist/server/execute.js
@paperclipai/adapter-claude-local/dist/server/execute.js.map
@paperclipai/adapter-utils/dist/acpx-engine/execute.d.ts
@paperclipai/adapter-utils/dist/acpx-engine/execute.d.ts.map
@paperclipai/adapter-utils/dist/acpx-engine/execute.js
@paperclipai/adapter-utils/dist/acpx-engine/execute.js.map
@paperclipai/adapter-utils/dist/server-utils.d.ts
@paperclipai/adapter-utils/dist/server-utils.d.ts.map
@paperclipai/adapter-utils/dist/server-utils.js
@paperclipai/adapter-utils/dist/server-utils.js.map
@paperclipai/server/dist/routes/connection-intents.d.ts
@paperclipai/server/dist/routes/connection-intents.d.ts.map
@paperclipai/server/dist/routes/connection-intents.js
@paperclipai/server/dist/routes/connection-intents.js.map
@paperclipai/server/dist/routes/project-tools.d.ts
@paperclipai/server/dist/routes/project-tools.d.ts.map
@paperclipai/server/dist/routes/project-tools.js
@paperclipai/server/dist/routes/project-tools.js.map
@paperclipai/server/dist/routes/tool-gateway.d.ts
@paperclipai/server/dist/routes/tool-gateway.d.ts.map
@paperclipai/server/dist/routes/tool-gateway.js
@paperclipai/server/dist/routes/tool-gateway.js.map
@paperclipai/server/dist/services/heartbeat.d.ts
@paperclipai/server/dist/services/heartbeat.d.ts.map
@paperclipai/server/dist/services/heartbeat.js
@paperclipai/server/dist/services/heartbeat.js.map
@paperclipai/server/dist/services/mcp-http.d.ts
@paperclipai/server/dist/services/mcp-http.d.ts.map
@paperclipai/server/dist/services/mcp-http.js
@paperclipai/server/dist/services/mcp-http.js.map
@paperclipai/server/dist/services/native-runtime/runtime-context.d.ts
@paperclipai/server/dist/services/native-runtime/runtime-context.d.ts.map
@paperclipai/server/dist/services/native-runtime/runtime-context.js
@paperclipai/server/dist/services/native-runtime/runtime-context.js.map
@paperclipai/server/dist/services/tool-gateway.d.ts
@paperclipai/server/dist/services/tool-gateway.d.ts.map
@paperclipai/server/dist/services/tool-gateway.js
@paperclipai/server/dist/services/tool-gateway.js.map
@paperclipai/shared/dist/validators/agent.d.ts
@paperclipai/shared/dist/validators/agent.d.ts.map
@paperclipai/shared/dist/validators/agent.js
@paperclipai/shared/dist/validators/agent.js.map
@paperclipai/shared/dist/validators/tool-access.d.ts
@paperclipai/shared/dist/validators/tool-access.d.ts.map
@paperclipai/shared/dist/validators/tool-access.js
@paperclipai/shared/dist/validators/tool-access.js.map
```

## Risks and limits

- A failed call remains available for a deliberate retry, but no tool call is replayed automatically. Existing authorization, audit, rate limits, quarantine and approval gates remain mandatory. Transport health may continue to show error until a later call or health check succeeds.
- A timeout does not prove the provider performed no side effect. Do not automatically retry generation/write calls without checking provider state. Longer configured waits occupy a call slot longer; the maximum is 120s. The approved-action path retains its separate 60s limit.
- The PATCH replaces config/transportConfig. Read and preserve current transport fields, then add `toolTimeoutMs: 60000` (or an approved value up to 120000); sending only the timeout would discard the URL/other fields. No connection was configured in this session.
- Local confined Claude runs have a real read-only skills mount. Unconfined/ACP processes retain their existing OS authority: read-only file modes on a private copy are not a new sandbox boundary against the file owner. Directories remain cleanup-capable so the existing private runtime-home cleanup can remove credentials reliably. No host skill path is made writable or newly mounted.
- Company skill loading is proven through offline runtime preparation/mount/staging fixtures, not a real Claude init event. The source prompt-bundle behavior for unmanaged seats remains unchanged.
- Missing cargo prevents a full workspace build/typecheck; the candidate is the requested TypeScript overlay, not a rebuilt distribution. Broad suite results above must be assessed separately before declaring upstream/release readiness.

## Operator release steps — not performed

1. Open the jarvis-system release change order tied to this source child and the existing Paperclip work record. Independently review the source commits, tests, this diff and the 48 candidate hashes. Preserve existing installed repair behavior and package version metadata. Reproduce the candidate with the trusted toolchain; verify offline dependency availability and schema parity (no migration in CO-593).
2. Extend the repo-owned overlay verifier's exact prefixes/anchors and manifest/provenance rules through that change order. Compose the complete 80-file closure, binding current installed before hashes and candidate/retained after hashes, modes, source archive and lockfile/toolchain digests. Update associated exact-closure tests and rollback artifacts. Do not hand-copy files around the governed receiver.
3. Obtain trusted-verifier review and the normal release gates. Resolve or explicitly assess the documented broad-suite/build limitations. Run the before-state overlay validation read-only against the exact live package baseline; drift invalidates this candidate comparison.
4. Create the normal owner release card, naming the actual effects, no migrations, brief Paperclip restart/downtime, exact artifact identity and rollback. Use the governed releases channel/card workflow. This task is not deployment approval, and no approval card was sent here.
5. Wait for an idle-run window; verify no agent runs, approved tool executions or credential refresh writebacks are active. Under the approved release plan, stop Paperclip, apply the verified overlay through the normal receiver, and restart Paperclip once. Verify the complete after-state hashes and service health. A failed application stays failed pending governed recovery; do not restore stale proof.
6. Configure the affected Arcads connection through its existing PATCH API, preserving all transport fields and setting a timeout suitable for a 40s wait (normally 60000ms). No assignment re-finish should be required just to recover from health error. Use new runs for the skill-init acceptance because existing processes have already loaded their settings.
7. Record exact run IDs, MCP responses, init-event skill names and before/after tool listings in the existing Paperclip work record. Publish this handoff/artifacts there and read them back before declaring the result shared.

## Required production acceptance after installation

- Cora successfully calls `arcads_get_asset` with `waitSeconds: 40` under the configured connection budget; capture the actual response and elapsed time.
- A controlled `generate-image` error returns readable provider text and `isError: true`, with absent/invalid structuredContent omitted. No Claude malformed-result error appears. Choose a no-spend validation error or obtain separate authorization for any charged generation.
- Fresh managed Whip seats' Claude `init` events list the desired `whip-*` company skills. Confirm settings remain user-only and the sandbox can read SKILL.md.
- After a controlled timeout or transport failure, the same run still lists/finds its assigned tools; a later run retains them; a subsequent successful call restores health to `ok`. Confirm disabled connections and denied/quarantined tools remain unavailable.
- If exercised, top-level wakeup issueId returns 400 and payload.issueId creates the intended issue context.

Next owner: the authorized release operator (Claude/operator lane). All installed/provider acceptance remains pending.
