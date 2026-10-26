import type { AdapterBillingType, AdapterExecutionContext, AdapterExecutionResult, UsageSummary } from "@paperclipai/adapter-utils";
import { type AdapterExecutionTarget, type AdapterManagedRuntimeAsset, type PreparedAdapterExecutionTargetRuntime, type ReferencedSourceIgnoreResolution } from "@paperclipai/adapter-utils/execution-target";
import type { WorkspaceRestoreOutcome } from "../workspace-restore-merge.js";
import { type AcpRuntime, type AcpRuntimeOptions, type AcpRuntimeStatus, type AcpRuntimeUsageBreakdown } from "acpx/runtime";
import type { LaunchEnvironment, LaunchEnvironmentContribution, SessionFingerprintIdentity, SessionKeyIdentity } from "./run-contracts.js";
import { type SettlementDispositionReport } from "./run-coordinator.js";
import { type AcpxAgentProcessIdentity, type RuntimeCacheEntry } from "./run-site-host.js";
import { type StartupSpanContext } from "./startup-timing.js";
type PaperclipAcpRuntimeOptions = AcpRuntimeOptions & {
    onAgentSpawn?: (meta: AcpxAgentProcessIdentity) => Promise<void>;
    getRuntimeParentContext?: () => StartupSpanContext | undefined;
};
type AcpxRuntimeFactory = (options: PaperclipAcpRuntimeOptions) => AcpRuntime;
/**
 * A remote runner-backed session's staged runtime, kept warm across runs so a
 * compatible resume reuses it instead of re-shipping the workspace / re-seeding
 * the managed home (PR 3: "stage once per session"). Keyed by the session's
 * `sessionKey` (`paperclip:companyId:agentId:taskKey:fingerprint`) — the SAME
 * fingerprint scoping the warm handle uses — so one session can never read
 * another session's staged credentials: a different agent/task/config hashes to
 * a different key, misses this cache, and stages its own home.
 *
 * Remote sessions are never held in the warm-handle cache (their agent process
 * lives behind a per-run process-session bridge, torn down each run and resumed
 * via `session/load`); the only thing that survives between their runs is the
 * in-sandbox staged workspace + home, which this cache reuses.
 */
export interface StagedRuntimeCacheEntry {
    stagedRuntime: PreparedAdapterExecutionTargetRuntime;
    /**
     * The env keys the per-adapter managed-home seam mutated when it staged (e.g.
     * `CODEX_HOME` repointed onto the in-sandbox home). Re-applied verbatim on a
     * reused run so the spawned agent still receives the in-sandbox home paths
     * without re-invoking the seam. These values are deterministic (derived from
     * the staged asset dirs), so they are identical across the session's runs.
     */
    envDelta: Record<string, string>;
    /**
     * The seam's per-run copy-back (codex auth copy-back via `restoreWorkspace()`),
     * or null for adapters/customs with no seam. Reused on every run's teardown so
     * the copy-back cadence stays exactly per-run — unchanged from PR 2.
     * `restoreWorkspace()` reads the sandbox live through the stable (stateless)
     * runner, so reusing the closure across resumes copies back the current
     * in-sandbox credential, not a stale snapshot. It never removes the staged
     * in-sandbox home, so re-running it on each reuse can't invalidate this entry.
     */
    teardown: (() => Promise<WorkspaceRestoreOutcome>) | null;
    /**
     * The seam's one-time host-side staged-resource cleanup (e.g. remove the
     * staged home temp dir), or null. Fired ONLY when this entry is dropped —
     * failed/cancelled/timed-out turn, incompatible re-stage, or idle eviction —
     * never while the entry stays warm for reuse. Kept separate from `teardown`
     * so a clean turn's per-run copy-back can't delete resources the next
     * compatible resume still relies on.
     */
    dispose: (() => Promise<void>) | null;
    lastUsedAt: number;
}
export interface AcpxEngineBillingIdentity {
    provider?: string | null;
    biller?: string | null;
    billingType?: AdapterBillingType | null;
}
/**
 * Per-adapter remote managed-home seed seam, injected by each adapter's ACP
 * wiring ({codex,claude,gemini}-local `acp.ts`). The adapter-specific
 * credential/home helpers (`copyBackCodexAuth`, `stageCodexHomeForSync`,
 * `prepareClaudeConfigSeed`, the Gemini skills stager, …) live in the adapter
 * packages, and the shared engine — which lives *inside*
 * `@paperclipai/adapter-utils`, a dependency of those packages — cannot import
 * them without a circular dependency. So the engine exposes this seam and each
 * adapter supplies it, reusing the exact same vetted helpers (no duplication of
 * the security-critical copy-back path).
 *
 * The seam mirrors the adapter's CLI lane: seed the managed home into the
 * sandbox through the staging seam, repoint the adapter's home env var to the
 * in-sandbox path, and — codex only — wire auth copy-back on teardown. It is
 * invoked ONLY on the runner-backed remote sandbox lane
 * (`useRemoteProcessSession`); when absent (custom agents, the shared-engine
 * tests) the engine stages the workspace with no home asset, byte-identical to
 * the PR-1 behavior and to the local / runner-less ACP→CLI fallback.
 *
 * This context is deliberately adapter-agnostic: it carries only generic inputs
 * (the resolved run `env`, the target, the host workspace dir, the `stage`
 * callback, …) so that nothing adapter-specific leaks across the boundary. A
 * seam derives every adapter-specific path it needs — the Gemini skills dir, the
 * Codex home, the Claude config dir — from `config`/`env` on its own side, the
 * same way the adapter's CLI lane does. No field here is named after or scoped
 * to a single adapter.
 */
export interface AcpxRemoteManagedHomeContext {
    acpxAgent: string;
    companyId: string;
    runId: string;
    config: Record<string, unknown>;
    /** The runner-backed remote sandbox target the workspace stages into. */
    executionTarget: AdapterExecutionTarget;
    /** Host workspace dir being staged (the local cwd). */
    workspaceLocalDir: string;
    timeoutSec: number;
    /**
     * The run env. The seam MUST repoint the adapter's home env var here onto the
     * in-sandbox path (e.g. `env.CODEX_HOME = staged.assetDirs.home`). At call
     * time it already carries the host managed-home paths the engine resolved —
     * notably `env.CODEX_HOME` is the host managed Codex home for the codex agent.
     */
    env: Record<string, string>;
    onLog: AdapterExecutionContext["onLog"];
    onRuntimeProgress: AdapterExecutionContext["onRuntimeProgress"];
    /**
     * The host directory that holds this run's skill bundle. This field is
     * `null` when the agent does not support on-demand skills, when no skill
     * is selected, and when every selected skill fails to materialize.
     *
     * A seam stages the bundle as an asset. When the bundle holds an owned
     * copy with no symbolic link, the seam sets `followSymlinks: false` (see
     * `claude-local/src/server/acp.ts` for a worked example). The
     * `followSymlinks: true` value makes the archive step carry a symbolic
     * link's target content instead of a dangling link. A seam needs that
     * value only when its own bundle holds symbolic links.
     */
    skillsBundleDir: string | null;
    /**
     * Runs the shared workspace+assets staging seam and returns the prepared
     * runtime. The seam passes its per-adapter home `assets` here; the returned
     * `assetDirs`/`runtimeRootDir` are what it remaps the home env var onto.
     */
    stage: (assets: AdapterManagedRuntimeAsset[]) => Promise<PreparedAdapterExecutionTargetRuntime>;
}
export interface AcpxRemoteManagedHomeResult {
    stagedRuntime: PreparedAdapterExecutionTargetRuntime;
    /**
     * Per-run copy-back, invoked once on every teardown/exit path (mirrors the CLI
     * restore-hook finally). For codex this runs `restoreWorkspace()` — the seam
     * that fires the auth copy-back. It reads the sandbox live and does NOT remove
     * the staged in-sandbox home/workspace, so it is safe to re-run on every
     * compatible resume that reuses the staged runtime — the copy-back cadence
     * stays exactly per-run. Failures are logged by the seam, never fatal to the
     * run result (an unclean-teardown copy-back miss is the accepted
     * `refresh_token_reused` residual, loud on the next host Codex use, never
     * silent).
     *
     * Host-side staged-resource cleanup (e.g. removing the staged home temp dir)
     * is NOT done here — it moved to {@link disposeStaged} so that reusing the
     * cached staged runtime across resumes never destroys resources a later run
     * still needs.
     */
    teardown?: () => Promise<WorkspaceRestoreOutcome>;
    /**
     * One-time cleanup of host-side staged resources (e.g. the curated staged
     * home temp dir). Split out from {@link teardown} so it fires ONLY when the
     * staged runtime is actually dropped — a failed/cancelled/timed-out turn, an
     * incompatible re-stage, or idle eviction — never on a clean turn that keeps
     * the staged runtime warm for the next compatible resume. Idempotent (safe to
     * call more than once — it force-removes and swallows already-gone paths).
     * Null for adapters that seed from a managed cache and hold no disposable
     * temp.
     */
    disposeStaged?: () => Promise<void>;
}
export interface AcpxEngineExecutorOptions {
    createRuntime?: AcpxRuntimeFactory;
    now?: () => number;
    /**
     * The bound on how long the fail-fast seam waits for a cooperative
     * `turn.cancel()` after a latched terminal sandbox duplex-channel loss,
     * before it ends the turn without the agent's help. Defaults to
     * {@link ACPX_DUPLEX_LOSS_CANCEL_DEADLINE_MS}. Tests inject a small value
     * to drive the deadline without real time.
     */
    duplexLossCancelDeadlineMs?: number;
    warmHandles?: Map<string, RuntimeCacheEntry>;
    /**
     * Per-session staged-runtime cache for the remote runner-backed lane (PR 3).
     * Keyed by `sessionKey`. Reused across runs so a compatible resume does not
     * re-ship the workspace / re-seed the managed home. Defaults to a shared
     * module-level map; tests pass an isolated map.
     */
    stagedRuntimes?: Map<string, StagedRuntimeCacheEntry>;
    /**
     * Per-`sessionKey` staging mutex for the remote runner-backed lane (PR 3).
     * Serializes the stage-or-reuse decision so two overlapping runs of the same
     * session can never ship into the same remote workspace concurrently (one
     * stages while the other waits, then re-checks the cache). Defaults to a
     * shared module-level map; tests pass an isolated map. Entries are ephemeral —
     * cleared as soon as the last waiter for a key finishes staging.
     */
    stagingLocks?: Map<string, Promise<unknown>>;
    adapterType?: string;
    moduleDir?: string;
    packageRootDir?: string;
    /**
     * Adapter-specific billing classification (provider/biller/billingType) for
     * cost-ledger attribution. Without it, results fall back to the opaque
     * "acpx" provider and an "unknown" billing type.
     */
    resolveBillingIdentity?: (ctx: AdapterExecutionContext) => AcpxEngineBillingIdentity | null | Promise<AcpxEngineBillingIdentity | null>;
    /**
     * Per-adapter remote managed-home seed + remap (+ codex copy-back). See
     * {@link AcpxRemoteManagedHomeContext}. Absent → the remote lane stages the
     * workspace with no home asset (PR-1 behavior).
     */
    prepareRemoteManagedHome?: (input: AcpxRemoteManagedHomeContext) => Promise<AcpxRemoteManagedHomeResult>;
    /**
     * Observe the final per-resource disposition report the run records at the end
     * of the attempt (`finalized` vs `transferred`). The coordinator records it on
     * every exit path: the settlement path reports what the settlement decided, and
     * the startup-rollback path reports every rolled-back entry as `finalized`. The
     * engine never reads it back; a test injects this hook to assert the report.
     */
    onSettlementDisposition?: (report: SettlementDispositionReport) => void;
}
/**
 * Hash the session fingerprint. The builder accepts only a
 * `SessionFingerprintIdentity`, so no company, agent, or task identifier can
 * enter the hash. Those identifiers scope the outer session key only (see
 * `SessionKeyIdentity`).
 */
export declare function buildSessionFingerprint(identity: SessionFingerprintIdentity): string;
/**
 * Build the session key from the fingerprint and the outer-key identity. The key
 * form is `paperclip:companyId:agentId:taskKey:fingerprint`.
 */
export declare function buildSessionKey(identity: SessionKeyIdentity, fingerprint: string): string;
/**
 * Project the server environment onto the closed set a host ACPX provider may
 * inherit. A runner-backed remote sandbox passes `false` and projects nothing.
 * Explicit adapter/runtime env is merged later and is intentionally not
 * restricted by this host projection.
 */
export declare function projectAcpxInheritedHostEnvironment(inheritedEnv: NodeJS.ProcessEnv, acpxAgent: string, inheritHostEnvironment: boolean): Record<string, string>;
/**
 * Build the single branded launch environment for a run. This is the sole
 * constructor of `LaunchEnvironment`. It applies each contribution into the base
 * env in registration order, then resolves and freezes the launch env.
 *
 * A contribution carries its credential scope. A run-scoped contribution (the
 * run API key, a bridge token) and a session-scoped contribution (the Codex auth
 * copy-back material) both merge here. Neither scope can escape into a reuse
 * payload, because the branded contribution type and the branded environment
 * type forbid it.
 */
export declare function finalizeLaunchEnvironment(baseEnv: Record<string, string>, contributions: readonly LaunchEnvironmentContribution[], options: {
    acpxAgent: string;
    inheritHostEnvironment: boolean;
    inheritedEnv?: NodeJS.ProcessEnv;
    platform?: typeof process.platform;
}): LaunchEnvironment;
/**
 * Content signature of a referenced-project host tree for the session fingerprint.
 *
 * The staged-runtime cache reuses an already-staged referenced-project tree on a
 * compatible resume and does not re-sync it. Referenced-project metadata (id, host
 * path, workspace id, repo url, pinned ref) can stay identical while the files at
 * that host path change: a branch moved to a new commit, a re-checkout in place, or
 * a dirty worktree. So the metadata identity alone lets a resume serve a stale tree.
 * This signature folds the tree's own content state into the identity.
 *
 * The walk reads each file's relative path and bytes and folds them into the hash.
 * It reads bytes, not only file stats. A stat-only signature (size and modification
 * time) collides when an edit keeps the byte length and the modification time — a
 * re-checkout that restores the same size and timestamp. The byte hash busts on any
 * content change, so the fingerprint busts and the next launch stages the current
 * tree. The walk skips the heavy build, cache, and git directories the staging path
 * never ships, plus the project's own resolved Git-ignored paths, and records a
 * symlink by its target text without following it. On a read error the function
 * returns a stable marker, so the fingerprint does not churn while staging
 * surfaces the real error. The walk runs only when the run carries referenced
 * projects (the multi-project sync path).
 *
 * `ignoreResolution` is the ONE resolution `resolveReferencedSourceIgnore`
 * computed for this project — the same one the sandbox lane and the SSH lane
 * consume. A `failed` resolution skips the walk entirely and returns a stable
 * marker instead, because a failed project is not staged and its bytes are not
 * read anywhere.
 */
export declare function referencedSourceContentSignature(localPath: string, ignoreResolution: ReferencedSourceIgnoreResolution): Promise<string>;
export declare function findAncestorBin(startDir: string, binName: string): Promise<string | null>;
export declare function parseGeminiVersionParts(output: string | null | undefined): number[] | null;
export declare function geminiVersionSupportsNativeAcpFlag(parts: number[] | null): boolean;
export declare function rewriteGeminiAcpFlagForVersion(commandShell: string, versionParts: number[] | null): string;
/**
 * Build the short run summary that Paperclip may auto-post as an issue comment
 * when the agent leaves no comment of its own.
 *
 * Prefer the last non-empty *output* segment after a tool call. Intermediate
 * "let me check…" narration between tools must not become a 50k-char dump.
 * Thought-stream text is never included (callers must not push it into segments).
 */
export declare function buildAcpxRunSummary(input: {
    outputSegments: string[];
    fallback?: string | null;
}): string;
/**
 * Fold the ACP runtime's post-turn usage into the adapter execution result
 * shape. The runtime persists the latest turn's token breakdown (adapters like
 * claude-agent-acp report per-turn accumulated usage in the prompt response),
 * so tokens are per-run. Cost is reported by agents as a cumulative session
 * amount, so the per-run cost is the delta against the pre-turn snapshot; a
 * decrease means the agent process restarted and its counter reset, in which
 * case the post-turn amount alone covers this run.
 */
export declare function summarizeAcpxTurnUsage(input: {
    preStatus: AcpRuntimeStatus | null;
    postStatus: AcpRuntimeStatus | null;
    eventBreakdown: AcpRuntimeUsageBreakdown | null;
    eventCostUsd: number | null;
}): {
    usage: UsageSummary | null;
    usageDetail: Record<string, number> | null;
    costUsd: number | null;
    cumulativeCostUsd: number | null;
};
export declare function createAcpxEngineExecutor(deps?: AcpxEngineExecutorOptions): (ctx: AdapterExecutionContext) => Promise<AdapterExecutionResult>;
export declare const execute: (ctx: AdapterExecutionContext) => Promise<AdapterExecutionResult>;
export {};
//# sourceMappingURL=execute.d.ts.map