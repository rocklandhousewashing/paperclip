export { buildHeartbeatRunStatusLiveEventPayload } from "./heartbeat-run-status-payload.js";
import { type DurableChatWakeupRequest } from "./durable-chat-wakeup.js";
import type { Db } from "@paperclipai/db";
import { type ChatProvider, type CostStatus, type EnvironmentLeaseStatus, type ExecutionWorkspace, type ExecutionWorkspaceConfig, type SourceTrustMetadata } from "@paperclipai/shared";
import { agents, heartbeatRuns, projectWorkspaces } from "@paperclipai/db";
import { scrubGitCredentialText, type GitRemoteAuthProvider } from "./git-credentials.js";
export { scrubGitCredentialText };
import { type NativeRestartRecoveryClaim } from "./native-runtime/index.js";
import { type NativeExecutionInput, type NativeSessionBackend } from "../vendor/paperclip-runner/index.js";
import type { AdapterExecutionResult, AdapterRuntimeMcpServer, AdapterSessionCodec } from "../adapters/index.js";
import { type BudgetEnforcementScope } from "./budgets.js";
import { secretService } from "./secrets.js";
import { buildWorkspaceReadyMetadata, buildWorkspaceReadyPresentation, type ExecutionWorkspaceInput, type RealizedExecutionWorkspace, type RuntimeServiceRef } from "./workspace-runtime.js";
import { issueService } from "./issues.js";
import { projectService } from "./projects.js";
import { authorizationService, type AuthorizationActor } from "./authorization.js";
import { resolveExecutionWorkspaceMode } from "./execution-workspace-policy.js";
import { MAX_TURN_CONTINUATION_RETRY_REASON, WORKSPACE_BUSY_RETRY_REASON, INTERACTION_CONTINUATION_INFRA_RETRY_REASON, INTERACTION_CONTINUATION_INFRA_WAKE_REASON, isNonAssigneeWorkspaceBusyRetry, extractWakeCommentIds } from "../modules/run-dispatch/index.js";
import { type CurrentUserRedactionOptions } from "../log-redaction.js";
import { type RuntimeStatusUpdate, type SessionCompactionPolicy } from "@paperclipai/adapter-utils";
import { environmentRuntimeService, type ProviderResourceDisposition } from "./environment-runtime.js";
import { sweepExpiredHeartbeatRunRuntimeStatuses } from "./heartbeat-run-runtime-status.js";
import type { TrustPresetResolution } from "./trust-preset-resolver.js";
import { EFFECTIVE_RUN_CONFIG_FINGERPRINT_VERSION, type EffectiveRunConfigFingerprints, type EffectiveRunConfigSecretManifestEntry } from "./effective-run-config-fingerprints.js";
import type { PluginWorkerManager } from "./plugin-worker-manager.js";
export declare function redactDetectedSuccessfulRunProgressSummaryForBoard(summary: string, currentUserRedactionOptions?: CurrentUserRedactionOptions): string;
export declare function redactSuccessfulRunHandoffEvidence(value: string | null, currentUserRedactionOptions?: CurrentUserRedactionOptions): string | null;
export { ACTIVE_RUN_OUTPUT_CONTINUE_REARM_MS, ACTIVE_RUN_OUTPUT_CRITICAL_THRESHOLD_MS, ACTIVE_RUN_OUTPUT_SUSPICION_THRESHOLD_MS, } from "./recovery/service.js";
export declare const ACTIVE_RUN_OUTPUT_PROGRESS_FLUSH_INTERVAL_MS: number;
export declare const ACTIVE_RUN_LOG_RUNTIME_STATUS_REFRESH_INTERVAL_MS: number;
export declare const BOUNDED_TRANSIENT_HEARTBEAT_RETRY_DELAYS_MS: readonly [30000, 30000];
export { INTERACTION_CONTINUATION_INFRA_RETRY_REASON, INTERACTION_CONTINUATION_INFRA_WAKE_REASON, };
export { MAX_TURN_CONTINUATION_RETRY_REASON };
export declare const MAX_TURN_CONTINUATION_WAKE_REASON = "max_turns_continuation_retry";
export { WORKSPACE_BUSY_RETRY_REASON };
export declare const WORKSPACE_BUSY_RETRY_WAKE_REASON = "workspace_busy_retry";
export declare const WORKSPACE_BUSY_ERROR_CODE = "workspace_busy";
export declare const WORKSPACE_BUSY_RETRY_BASE_DELAY_MS: number;
export declare const WORKSPACE_BUSY_RETRY_JITTER_MS: number;
export declare const WORKSPACE_BUSY_HOLDER_STALE_AFTER_MS: number;
export declare class WorkspaceValidationFailure extends Error {
    code: string;
    resultJson: Record<string, unknown>;
    constructor(message: string, resultJson: Record<string, unknown>);
}
export declare class ConfigurationIncompleteFailure extends Error {
    code: string;
    resultJson: Record<string, unknown>;
    constructor(message: string, resultJson: Record<string, unknown>);
}
export interface SharedWorkspaceHolder {
    runId: string;
    agentId: string;
    issueId: string;
    issueIdentifier: string | null;
}
export declare class WorkspaceBusyDeferral extends Error {
    code: string;
    holder: SharedWorkspaceHolder;
    projectWorkspaceId: string;
    deferralAttempt: number;
    wasIssueAssignee: boolean;
    constructor(input: {
        holder: SharedWorkspaceHolder;
        projectWorkspaceId: string;
        deferralAttempt: number;
        wasIssueAssignee: boolean;
    });
}
export declare function computeWorkspaceBusyRetryDelayMs(random?: () => number): number;
export { isNonAssigneeWorkspaceBusyRetry };
export declare function parseSandboxProviderPluginNotReadyFailureMessage(value: unknown): {
    provider: string;
    pluginKey: string;
    pluginStatus: string;
} | null;
/** Compute the drain a start call would apply, without changing state. */
export declare function computeTaskDrain(opts?: {
    ttlMs?: number | null;
}): {
    startedAt: Date;
    expiresAt: Date | null;
};
/** Assign the given drain as the current task-drain state. */
export declare function applyTaskDrain(drain: {
    startedAt: Date;
    expiresAt: Date | null;
}): void;
export declare function startTaskDrain(opts?: {
    ttlMs?: number | null;
}): {
    startedAt: Date;
    expiresAt: Date | null;
};
export declare function stopTaskDrain(): {
    wasActive: boolean;
};
/**
 * Report the task-drain state for this process only. `activeRuns` and
 * `pendingWakes` count in-process work. A process restart clears both
 * counters, even when the database still holds `running` rows for runs
 * this process did not finish.
 */
export declare function getTaskDrainStatus(): {
    draining: boolean;
    startedAt: Date | null;
    expiresAt: Date | null;
    activeRuns: number;
    pendingWakes: number;
    quiescent: boolean;
};
type RuntimeConfigSecretResolver = Pick<ReturnType<typeof secretService>, "resolveAdapterConfigForRuntime" | "resolveEnvBindings" | "collectMissingRuntimeBindings" | "collectMissingAdapterConfigRuntimeBindings">;
export declare function requiresPushCapabilityPreflight(input: {
    adapterType: string;
    issueId: string | null | undefined;
    explicitRunScopedSkillKeys: string[];
}): boolean;
export declare function resolveExecutionRunAdapterConfig(input: {
    managedAiCredentials?: boolean;
    companyId: string;
    agentId?: string | null;
    adapterType?: string | null;
    issueId?: string | null;
    heartbeatRunId?: string | null;
    responsibleUserId?: string | null;
    environmentId?: string | null;
    environmentEnv?: unknown;
    environmentDriver?: string | null;
    projectId?: string | null;
    routineId?: string | null;
    executionRunConfig: Record<string, unknown>;
    projectEnv: unknown;
    routineEnv?: unknown;
    secretsSvc: RuntimeConfigSecretResolver;
    trustPreset?: TrustPresetResolution;
    requiredScopedEnvBinding?: {
        keys: string[];
        consumerScopes: Array<"agent" | "project">;
        reason: string;
        remediation: string;
    };
    /** Managed GitHub tokens are resolved only when operations start. */
    managedGitHubCredentials?: boolean;
    /** Audited class-3 values resolved by an internal credential broker. */
    trustedEnvProjection?: Record<string, string>;
    trustedEnvSecretKeys?: string[];
}): Promise<{
    resolvedConfig: Record<string, unknown>;
    secretKeys: Set<string>;
    secretManifest: import("./secrets.js").RuntimeSecretManifestEntry[];
}>;
export declare function extractMentionedSkillIdsFromSources(sources: Array<string | null | undefined>): string[];
export declare function applyRunScopedMentionedSkillKeys(config: Record<string, unknown>, skillKeys: string[]): Record<string, unknown>;
export declare function computeBoundedTransientHeartbeatRetrySchedule(attempt: number, now?: Date, random?: () => number): {
    attempt: number;
    baseDelayMs: 30000;
    delayMs: number;
    dueAt: Date;
    maxAttempts: 2;
} | null;
export declare function leaseReleaseStatusForRunStatus(status: string | null | undefined): Extract<EnvironmentLeaseStatus, "released" | "expired" | "failed">;
export declare function providerResourceDispositionForTerminalRun(desired: ProviderResourceDisposition | undefined, status: string | null | undefined): ProviderResourceDisposition | undefined;
export interface NativeSandboxLifecycle {
    runnerProcess: "per_turn" | "warm";
    sandboxResource: "keep_running" | "stop_and_reuse" | "destroy_after_turn";
    failoverBackup: "verified";
}
export declare function resolveReusableSandboxLifecycle(input: {
    lifecyclePolicy: {
        mode: "per_turn";
        idleTimeoutMs: null;
    } | {
        mode: "warm";
        idleTimeoutMs: number;
    };
    target: {
        kind: "local" | "remote";
        transport?: string;
        reusableLeaseConfigured?: boolean;
        effectiveCapabilities?: {
            reusableLeases: boolean;
        } | null;
    } | null;
}): NativeSandboxLifecycle | null;
export declare function resolveNativeSandboxLifecycle(input: {
    adapterType: string;
    lifecyclePolicy: {
        mode: "per_turn";
        idleTimeoutMs: null;
    } | {
        mode: "warm";
        idleTimeoutMs: number;
    };
    target: {
        kind: "local" | "remote";
        transport?: string;
        reusableLeaseConfigured?: boolean;
        effectiveCapabilities?: {
            reusableLeases: boolean;
        } | null;
    } | null;
}): NativeSandboxLifecycle | null;
export declare function applyPersistedExecutionWorkspaceConfig(input: {
    config: Record<string, unknown>;
    workspaceConfig: ExecutionWorkspaceConfig | null;
    mode: ReturnType<typeof resolveExecutionWorkspaceMode>;
}): {
    [x: string]: unknown;
};
export declare function mergeExecutionWorkspaceMetadataForPersistence(input: {
    existingMetadata: Record<string, unknown> | null | undefined;
    source: string;
    createdByRuntime: boolean;
    strategyType: "project_primary" | "git_worktree";
    configSnapshot: Record<string, unknown> | null;
    shouldReuseExisting: boolean;
    shouldRefreshConfigSnapshot?: boolean;
    workspaceConfigMetadata?: EffectiveRunWorkspaceConfigMetadata | null;
    baseRef: string | null | undefined;
    baseRefSha: string | null | undefined;
}): Record<string, unknown> | null;
export declare function resolveExecutionWorkspaceBranchOwnership(executionWorkspace: Pick<RealizedExecutionWorkspace, "created" | "branchCreatedByRuntime">): boolean;
export declare function stripWorkspaceRuntimeFromExecutionRunConfig(config: Record<string, unknown>): {
    [x: string]: unknown;
};
export declare function stripHostWorkspaceProvisionForLowTrustSandbox(input: {
    config: Record<string, unknown>;
    trustPreset: TrustPresetResolution;
    selectedEnvironmentDriver: string | null | undefined;
}): Record<string, unknown>;
export declare function preflightLowTrustWorkspaceIsolation(input: {
    db?: Db;
    trustPreset: TrustPresetResolution;
    isolatedWorkspacesEnabled: boolean;
    effectiveExecutionWorkspaceMode: string | null | undefined;
    issue: {
        companyId: string;
        id?: string | null;
        projectId?: string | null;
    } | null;
    resolveSelectedEnvironmentDriver: () => Promise<string | null | undefined>;
}): Promise<string | null>;
export declare function resolveWorkspaceAfterLowTrustPreflight<TWorkspace>(input: {
    db?: Db;
    trustPreset: TrustPresetResolution;
    isolatedWorkspacesEnabled: boolean;
    effectiveExecutionWorkspaceMode: string | null | undefined;
    issue: {
        companyId: string;
        id?: string | null;
        projectId?: string | null;
    } | null;
    resolveSelectedEnvironmentDriver: () => Promise<string | null | undefined>;
    resolveWorkspace: () => Promise<TWorkspace>;
}): Promise<{
    selectedEnvironmentDriver: string | null;
    workspace: TWorkspace;
}>;
export declare function ensureManagedProjectWorkspace(input: {
    companyId: string;
    projectId: string;
    repoUrl: string | null;
    /** Optional git credential source for cloning private repos; null/absent preserves ambient behavior. */
    resolveGitAuth?: GitRemoteAuthProvider | null;
}): Promise<{
    cwd: string;
    warning: string | null;
}>;
/** Keep every distinct project repository inside the task's writable/synced root. */
export declare function prepareProjectRepositoryWorkspaces(input: {
    cwd: string;
    anchorRepoUrl: string | null;
    workspaces: Array<Pick<typeof projectWorkspaces.$inferSelect, "id" | "repoUrl" | "repoRef"> & {
        cwd?: string | null;
    }>;
    resolveGitAuth?: GitRemoteAuthProvider | null;
}): Promise<Array<{
    workspaceId: string;
    cwd: string;
    repoUrl: string;
    repoRef: string | null;
}>>;
/**
 * Resolve one project workspace row to a usable cwd. The anchor path and each additional
 * referenced project share this step: use the configured cwd when present, otherwise clone or
 * create the managed checkout directory for the project. It throws only when the managed
 * checkout cannot be prepared (for example, a clone failure).
 */
declare function resolveConfiguredOrManagedProjectCwd(input: {
    companyId: string;
    projectId: string;
    cwd: string | null;
    repoUrl: string | null;
    resolveGitAuth?: GitRemoteAuthProvider | null;
}): Promise<{
    cwd: string;
    warning: string | null;
}>;
/**
 * Side-effecting dependencies for {@link resolveAdditionalProjectWorkspace}. The caller injects
 * the real database, filesystem, and managed-checkout helpers. A test injects fakes to exercise
 * the resolution logic without a database or filesystem.
 */
export interface ResolveAdditionalProjectWorkspaceDeps {
    loadProjectWorkspaceRows: (companyId: string, projectId: string) => Promise<Array<typeof projectWorkspaces.$inferSelect>>;
    resolveConfiguredOrManagedProjectCwd: typeof resolveConfiguredOrManagedProjectCwd;
    ensureManagedProjectWorkspace: typeof ensureManagedProjectWorkspace;
    directoryHasContents: (cwd: string) => Promise<boolean>;
}
/**
 * Resolve one authorized referenced project to its own workspace cwd. Each additional project
 * lands in its own managed checkout directory, never nested inside the anchor's worktree (the
 * directory isolation invariant lives in {@link resolveManagedProjectWorkspaceDir}).
 *
 * A referenced project must resolve to a directory with real content. The function uses a
 * configured checkout directory that exists, or clones a managed checkout from a workspace row
 * that supplies a repository URL. When no row offers either, the function throws instead of
 * creating an empty managed directory. An empty directory gives the agent an empty referenced
 * workspace and hides the real cause. The caller catches the error and drops only that project.
 * The function also throws when the managed checkout cannot be prepared (for example, a clone
 * failure), so the caller can drop only that project.
 */
export declare function resolveAdditionalProjectWorkspace(input: {
    companyId: string;
    project: RunReferencedProject;
}, deps: ResolveAdditionalProjectWorkspaceDeps): Promise<ResolvedAdditionalWorkspace>;
export declare function isConfigurationIncompleteFailedRun(run: Pick<typeof heartbeatRuns.$inferSelect, "errorCode"> | null | undefined): boolean;
export declare function assertGitWorktreeBaseWorkspaceReady(input: {
    requestedExecutionWorkspaceMode: ReturnType<typeof resolveExecutionWorkspaceMode>;
    config: Record<string, unknown>;
    issue: {
        id: string;
        identifier: string | null;
        projectId: string | null;
        projectWorkspaceId: string | null;
        executionWorkspaceId?: string | null;
        executionWorkspacePreference?: string | null;
    } | null;
    base: ExecutionWorkspaceInput;
    /**
     * Anchor-resolution facts that `base` alone cannot express: whether the base cwd is the
     * agent-home fallback despite the project having workspaces, and which materialization
     * attempts failed on the way there. Absent means "not a fallback" (legacy callers).
     */
    anchor?: {
        baseCwdFallback?: boolean;
        materializationFailures?: WorkspaceMaterializationFailure[];
    } | null;
}): Promise<void>;
export declare function assertPushCapabilityCheckoutValid(input: {
    enabled: boolean;
    issue: {
        id: string;
        identifier: string | null;
    } | null;
    cwd: string | null | undefined;
}): Promise<void>;
/**
 * Reconcile the `projectWorkspaceId` for a reused execution workspace.
 *
 * A `reuse_existing` workspace can have been persisted with a null
 * `projectWorkspaceId` (e.g. it was created before its project had a primary
 * project workspace). When we later restore it for a run whose issue now
 * expects a concrete project workspace, backfill the column so the launch
 * guard (`persisted_workspace_missing_project_workspace_id`) stops rejecting
 * it on every requeue — otherwise `reuse_existing` re-binds the same stale
 * record forever and the run crash-loops. Prefer the existing binding when
 * present so we never null out a good value or silently rebind a genuine
 * mismatch (which the guard still surfaces).
 */
export declare function reconcileReusedExecutionWorkspaceProjectWorkspaceId(existingProjectWorkspaceId: string | null | undefined, resolvedProjectWorkspaceId: string | null | undefined): string | null;
export declare function assertGitSensitiveAdapterWorkspaceValid(input: {
    adapterType: string;
    agentId: string;
    issue: {
        id: string;
        identifier: string | null;
        projectId: string | null;
        projectWorkspaceId: string | null;
    } | null;
    resolvedWorkspace: ResolvedWorkspaceForRun;
    executionWorkspace: RealizedExecutionWorkspace;
    persistedExecutionWorkspace: ExecutionWorkspace | null;
    executionTarget: unknown;
    environmentDriver?: string | null;
    leaseMetadata?: unknown;
}): Promise<void>;
export declare function boundHeartbeatRunEventPayloadForStorage(payload: Record<string, unknown>): Record<string, unknown>;
export declare function compactRunLogChunk(chunk: string, maxChars?: number): string;
interface WakeupOptions {
    /** Set only by authenticated board wake routes; never copied from caller payloads. */
    manualUserWake?: boolean;
    /** Internal resume of a queue with persisted board interruption intent. */
    queuedCommentInterruptId?: string;
    /** Internal delivery of an existing undelivered user comment. */
    queuedCommentRequestId?: string;
    /** Exact failed run selected by an authenticated board Retry request. */
    failedRunId?: string | null;
    durableChatRequest?: DurableChatWakeupRequest;
    source?: "timer" | "assignment" | "on_demand" | "automation";
    triggerDetail?: "manual" | "ping" | "callback" | "system";
    reason?: string | null;
    payload?: Record<string, unknown> | null;
    idempotencyKey?: string | null;
    requestedByActorType?: "user" | "agent" | "system";
    requestedByActorId?: string | null;
    contextSnapshot?: Record<string, unknown>;
    issueStateGuard?: {
        statuses: string[];
        assigneeAgentId: string;
    };
    /** Keep causally distinct external chat continuations out of an existing run. */
    allowRunCoalescing?: boolean;
}
/**
 * A single read-only referenced (mentioned) project workspace resolved for a run.
 * The run materializes one entry per authorized additional project, each in its own
 * managed checkout directory. See {@link resolveAdditionalRunWorkspaces}.
 */
export type ResolvedAdditionalWorkspace = {
    cwd: string;
    projectId: string;
    workspaceId: string | null;
    repoUrl: string | null;
    repoRef: string | null;
};
/**
 * One project-workspace materialization attempt that failed during anchor resolution — for
 * example a managed `git clone` that could not authenticate against a private repository.
 * Carried on {@link ResolvedWorkspaceForRun} so downstream validation can report the real
 * cause instead of the fallback cwd's symptoms. `repoUrl` and `error` are scrubbed of URL
 * userinfo credentials before they are stored.
 */
export type WorkspaceMaterializationFailure = {
    projectWorkspaceId: string | null;
    repoUrl: string | null;
    error: string;
};
export type ResolvedWorkspaceForRun = {
    cwd: string;
    source: "project_primary" | "task_session" | "agent_home";
    projectId: string | null;
    workspaceId: string | null;
    repoUrl: string | null;
    repoRef: string | null;
    workspaceHints: Array<{
        workspaceId: string;
        cwd: string | null;
        repoUrl: string | null;
        repoRef: string | null;
    }>;
    warnings: string[];
    /**
     * True when project workspaces exist for the run but none could be used, so `cwd` is the
     * agent-home fallback rather than a configured or materialized project workspace path. The
     * `source` stays `project_primary` in that case (session migration depends on it), so this
     * flag is the only reliable fallback signal.
     */
    baseCwdFallback: boolean;
    /** Failed materialization attempts behind {@link baseCwdFallback}; empty when every candidate resolved or none was attempted. */
    materializationFailures: WorkspaceMaterializationFailure[];
    /**
     * Read-only referenced (mentioned) project workspaces for this run, one per authorized
     * additional project. The array is empty unless the multi-project workspace-sync flag is on
     * ({@link isMultiProjectWorkspaceSyncEnabled}); with the flag off the run resolves the anchor
     * workspace only, exactly as before.
     */
    additionalWorkspaces: ResolvedAdditionalWorkspace[];
    /**
     * Structured record of every referenced project that the run dropped or failed, paired with the
     * layer that dropped it. Run preparation reads this to emit the requested-vs-synced observability
     * log. The human-readable form of each drop already rides {@link ResolvedWorkspaceForRun.warnings}.
     */
    referencedProjectFailures: ReferencedProjectFailure[];
};
/**
 * Assemble the run warnings for the agent-home fallback when a project has workspaces but none
 * produced a usable cwd. Materialization failures (for example a failed managed clone) take
 * priority over the generic "no local cwd configured" note, which previously masked them.
 */
export declare function buildAnchorFallbackWorkspaceNotes(input: {
    fallbackCwd: string;
    preferredWorkspaceWarning: string | null;
    materializationFailures: WorkspaceMaterializationFailure[];
    missingProjectCwds: string[];
    hasConfiguredProjectCwd: boolean;
}): string[];
/**
 * Build the plural workspace list that a run exposes to the agent through the
 * `PAPERCLIP_WORKSPACES_JSON` environment variable. The list joins the anchor
 * project's alternative workspace rows with the read-only referenced (mentioned)
 * project workspaces, so every execution target receives the referenced project
 * paths through the same channel the run already uses for the anchor project.
 *
 * Each referenced entry carries its `projectId` so the agent can tell which
 * mentioned project a path belongs to. The referenced set is empty unless the
 * multi-project workspace-sync flag is on, so the exposed list is byte-for-byte
 * unchanged in the production default.
 */
export declare function buildRunWorkspaceHints(resolved: Pick<ResolvedWorkspaceForRun, "workspaceHints" | "additionalWorkspaces">): Array<Record<string, unknown>>;
type ProjectWorkspaceCandidate = {
    id: string;
};
export declare function prioritizeProjectWorkspaceCandidatesForRun<T extends ProjectWorkspaceCandidate>(rows: T[], preferredWorkspaceId: string | null | undefined): T[];
/**
 * Environment flag (kill-switch, default ON) that gates whether run preparation
 * consumes the multi-project referenced-project set produced by
 * {@link resolveRunReferencedProjects}. The feature is live by default: an unset
 * value resolves ON. An operator disables the feature with an explicit false
 * value (`"false"`, `"0"`, `"off"`, or `""`). While off, a run materializes only
 * the anchor project's workspace exactly as before — the referenced set is inert.
 */
export declare const MULTI_PROJECT_WORKSPACE_SYNC_ENV = "PAPERCLIP_MULTI_PROJECT_WORKSPACE_SYNC";
export declare function isMultiProjectWorkspaceSyncEnabled(env?: Record<string, string | undefined>): boolean;
/**
 * True when an environment driver runs the workspace on a non-local target. The `ssh`, `sandbox`,
 * and `plugin` drivers each realize the workspace off the host, so a host-local directory path is
 * not present on the target. This mirrors the remote-transport classification in
 * {@link buildWorkspaceRealizationRecord}. The `local` driver (and an unknown/absent driver) is
 * treated as local.
 */
export declare function isRemoteExecutionEnvironmentDriver(driver: string | null | undefined): boolean;
/**
 * Environment flag (kill-switch, default ON) that gates whether a *remote* run stages the
 * referenced (mentioned) project set into the sandbox. This is a targeted rollback lever: it
 * disables only the remote referenced-project path and never regresses the working local path.
 * The master flag {@link MULTI_PROJECT_WORKSPACE_SYNC_ENV} is the blunt switch that kills both
 * local and remote. The remote path runs when both the master flag and this remote flag are ON —
 * the default state. An unset value resolves ON; an operator disables it with an explicit false
 * value (`"false"`, `"0"`, `"off"`, `"no"`, or `""`). The OFF state fails closed: a remote run
 * runs no referenced-project authorization or staging and reverts to the remote drop path.
 */
export declare const MULTI_PROJECT_WORKSPACE_SYNC_REMOTE_ENV = "PAPERCLIP_MULTI_PROJECT_WORKSPACE_SYNC_REMOTE";
export declare function isMultiProjectWorkspaceSyncRemoteEnabled(env?: Record<string, string | undefined>): boolean;
/**
 * True when an environment driver stages a multi-source remote workspace through the confined
 * sandbox/command runtime. Only the `sandbox` driver asserts per-project confinement on the
 * staging path (`assertSyncOperationsConfined` in `sandbox-managed-runtime`). The `ssh` driver
 * stages without that guard, and the `plugin` driver does not route through the confined command
 * runtime in the workspace-realization step, so both keep dropping referenced projects. A `local`
 * (or unknown) driver is not remote and never reaches this check. This gate is intentionally
 * narrower than {@link isRemoteExecutionEnvironmentDriver}: it names the one transport that
 * confines each staged referenced tree.
 */
export declare function isConfinedRemoteStagingDriver(driver: string | null | undefined): boolean;
/**
 * Upper bound on how many additional (mentioned) projects a single run may materialize
 * beyond the anchor. Bounds the fan-out of per-project authorization and workspace prep.
 */
export declare const MAX_RUN_REFERENCED_ADDITIONAL_PROJECTS = 10;
/**
 * Upper bound on how many *available* (same-company, hydrated) candidate projects a single run will
 * *authorize* before the admitted-project cap is applied.
 *
 * This is a fan-out guard distinct from {@link MAX_RUN_REFERENCED_ADDITIONAL_PROJECTS}:
 * the admitted cap counts only projects that were successfully authorized, so on its own it
 * does not bound how many `project:read` decisions a run performs — an adversarial same-company
 * mention flood in which every candidate is denied would authorize every candidate before the
 * admitted cap is ever reached. This limit caps the number of authorization decisions regardless of
 * how many candidates are admitted, so denied mentions cannot force unbounded authorization work.
 * Only available candidates count against it — unavailable mentions are filtered by the company-scoped
 * hydration first and never consume an evaluation slot. It is always at least the admitted cap so the
 * admitted cap remains reachable in the normal (non-flood) case.
 */
export declare const MAX_RUN_REFERENCED_CANDIDATE_EVALUATIONS = 50;
type RunReferencedProjectRecord = Awaited<ReturnType<ReturnType<typeof projectService>["listByIds"]>>[number];
export interface RunReferencedProject {
    projectId: string;
    project: RunReferencedProjectRecord;
}
/**
 * The layer that dropped or failed a referenced project. The run surfacing and the
 * observability log both use these values as the per-failure reason:
 * - `authorization`: the run actor is not authorized to read the project.
 * - `resolution`: the project could not be brought into the run locally (unknown or
 *   unavailable project, cap exceeded, or a workspace clone/prepare failure).
 * - `staging`: the project resolved but failed to stage into the run sandbox (the
 *   downstream remote path; see `sandbox-managed-runtime`).
 */
export type ReferencedProjectFailureReason = "authorization" | "resolution" | "staging";
/** One referenced project that a run dropped or failed, with the layer that caused it. */
export interface ReferencedProjectFailure {
    projectId: string;
    reason: ReferencedProjectFailureReason;
    /**
     * The failure message, when the layer that dropped the project produced one. A `staging` failure
     * carries the remote extract or sync error here, so a reader of the run log learns why the project
     * dropped. An `authorization` or `resolution` drop omits this field.
     */
    error?: string;
}
export interface ResolvedRunReferencedProjects {
    /** The anchor (primary) project — retains the existing git-worktree run path; never re-authorized here. */
    anchor: RunReferencedProject | null;
    /** Additional read-only referenced projects that each passed per-project `project:read` authorization. */
    additional: RunReferencedProject[];
    /** Human-readable warnings for every referenced project that was dropped (unavailable, unauthorized, or capped). */
    warnings: string[];
    /** Structured record of every dropped referenced project, paired with the layer that dropped it. */
    failures: ReferencedProjectFailure[];
}
export interface ResolveRunReferencedProjectsOptions {
    companyId: string;
    /** The run actor; every additional project is authorized against this actor. */
    actor: AuthorizationActor;
    issues: Pick<ReturnType<typeof issueService>, "findMentionedProjectIds">;
    projects: Pick<ReturnType<typeof projectService>, "listByIds">;
    access: Pick<ReturnType<typeof authorizationService>, "decide">;
    /** Override the additional-project cap (defaults to {@link MAX_RUN_REFERENCED_ADDITIONAL_PROJECTS}). */
    maxAdditionalProjects?: number;
    /**
     * Override the candidate authorization fan-out cap — the maximum number of *available* candidates
     * that are authorized (defaults to {@link MAX_RUN_REFERENCED_CANDIDATE_EVALUATIONS}). Always
     * effectively raised to at least the admitted-project cap so the admitted cap stays reachable.
     */
    maxCandidateEvaluations?: number;
}
/**
 * Produce the deduped, company-scoped, per-project-authorized referenced-project set
 * `[anchor, ...additional]` for a run.
 *
 * The anchor keeps its existing issue/run authorization path and is never re-authorized or
 * inherited by the additional projects. Every additional (mentioned) project must independently
 * pass a fail-closed `project:read` authorization check against the run actor before it is
 * admitted — any non-`allowed` decision, company mismatch, missing/unknown project, or thrown
 * authorization error drops the project and appends a warning (the run always continues).
 *
 * Candidate evaluation is bounded twice, independently: at most
 * {@link ResolveRunReferencedProjectsOptions.maxCandidateEvaluations} *available* candidates are ever
 * hydrated and authorized (a fan-out guard against an adversarial same-company mention flood of denied
 * projects), and at most {@link ResolveRunReferencedProjectsOptions.maxAdditionalProjects} of those are
 * admitted. The evaluation cap bounds hydration as well as authorization: candidates are hydrated and
 * availability-filtered in mention order in bounded batches, and hydration stops as soon as the
 * evaluation window is filled with available candidates (or the mention set is exhausted), so hydration
 * never processes the complete mention set — its cost is bounded by the window, not by mention volume.
 * Availability filtering still runs before a candidate consumes an evaluation slot, so an unavailable
 * mention (foreign-company, deleted, or malformed id) never occupies a slot or displaces a later
 * authorized project. Available candidates beyond the evaluation window are left un-hydrated and dropped
 * with a warning, never triggering an authorization decision.
 */
export declare function resolveRunReferencedProjects(issueId: string, anchorProjectId: string | null, opts: ResolveRunReferencedProjectsOptions): Promise<ResolvedRunReferencedProjects>;
export interface ResolveAdditionalRunWorkspacesOptions {
    /** Gate that mirrors {@link isMultiProjectWorkspaceSyncEnabled}. When false, the result is empty. */
    enabled: boolean;
    companyId: string;
    /** The run actor; every additional project is authorized against this actor. */
    actor: AuthorizationActor;
    issues: Pick<ReturnType<typeof issueService>, "findMentionedProjectIds">;
    projects: Pick<ReturnType<typeof projectService>, "listByIds">;
    access: Pick<ReturnType<typeof authorizationService>, "decide">;
    /** Resolve one authorized referenced project to its own workspace cwd (injectable for tests). */
    resolveProjectWorkspace: (project: RunReferencedProject) => Promise<ResolvedAdditionalWorkspace>;
    maxAdditionalProjects?: number;
    maxCandidateEvaluations?: number;
    /**
     * True when the run executes on a non-local target (ssh, sandbox, or plugin). A referenced
     * project realizes as a local directory first. On a remote target that local tree reaches the
     * agent only when a confined transport stages it into the sandbox and the remote flag is on
     * (see `targetStagesConfined` and `remoteReferencedSyncEnabled`). Otherwise the run drops the
     * whole referenced set and records it at the staging layer.
     */
    executionTargetIsRemote?: boolean;
    /**
     * True when the remote target stages each referenced tree through the confined sandbox/command
     * runtime (the `sandbox` driver; see {@link isConfinedRemoteStagingDriver}). The gate opens the
     * referenced-project path on a remote target only when this is true. The SSH transport and any
     * unconfined transport keep dropping referenced projects. Ignored on a local target.
     */
    targetStagesConfined?: boolean;
    /**
     * The remote-only kill switch (default ON; see {@link isMultiProjectWorkspaceSyncRemoteEnabled}).
     * When true, a confined remote target stages the referenced set. When false, a remote target
     * fails closed: it runs no referenced-project authorization or staging and reverts to the remote
     * drop path. Ignored on a local target.
     */
    remoteReferencedSyncEnabled?: boolean;
}
/**
 * Resolve the read-only referenced (mentioned) project workspaces for a run.
 *
 * The function is inert until the multi-project workspace-sync flag is on: when `enabled` is
 * false (the production default) or there is no issue, it returns an empty result and performs
 * no authorization or workspace work. When enabled, it authorizes the referenced set through
 * {@link resolveRunReferencedProjects} and resolves each admitted project to its own cwd. Each
 * project resolves in isolation: a per-project failure drops only that project and appends a
 * warning, so one bad clone never aborts the run.
 */
export declare function resolveAdditionalRunWorkspaces(issueId: string | null, anchorProjectId: string | null, opts: ResolveAdditionalRunWorkspacesOptions): Promise<{
    additionalWorkspaces: ResolvedAdditionalWorkspace[];
    warnings: string[];
    failures: ReferencedProjectFailure[];
}>;
/** Structured fields for the one requested-vs-synced observability log a run emits at run prep. */
export interface ReferencedProjectRunObservability {
    referenced_projects_requested: number;
    referenced_projects_synced: number;
    referenced_project_failures: Array<{
        project_id: string;
        reason: ReferencedProjectFailureReason;
        /** The failure message for a `staging` drop; absent for an `authorization` or `resolution` drop. */
        error?: string;
    }>;
}
/**
 * Build the requested-vs-synced observability fields for a run's referenced-project set.
 *
 * A run requests one referenced project per authorized mention and syncs the projects that resolve.
 * The requested count is the synced count plus every dropped project, so the two counts and the
 * per-failure reasons together account for the whole referenced set. The human-readable warning for
 * each drop rides the run's surfaced warnings channel; this function produces only the structured
 * log fields, so a run emits exactly one line with a stable field shape.
 */
export declare function buildReferencedProjectRunObservability(input: {
    syncedProjectIds: readonly string[];
    failures: readonly ReferencedProjectFailure[];
}): ReferencedProjectRunObservability;
type ManagedMcpGatewayRunConfig = {
    version: 1;
    managedMcpOnly: boolean;
    gateways: Array<{
        id: string;
        name: string;
        endpointPath: string;
        bearerToken: string;
        tokenPrefix: string;
    }>;
};
export declare function revokeHeartbeatRunGatewayTokens(input: {
    db: Db;
    companyId: string;
    runId: string;
}): Promise<void>;
export declare function buildPaperclipRuntimeMcpServers(input: {
    db: Db;
    agent: Pick<typeof agents.$inferSelect, "id" | "companyId" | "name">;
    runId: string;
    expectedAssignmentDigest?: string | null;
    onUnavailableAssignedConnections?: (connections: Array<{
        id: string;
        name: string;
    }>) => void | Promise<void>;
}): Promise<AdapterRuntimeMcpServer[]>;
export declare function createManagedMcpRunConfig(input: {
    db: Db;
    agent: Pick<typeof agents.$inferSelect, "id" | "companyId" | "name" | "adapterType">;
    runId: string;
    config: Record<string, unknown>;
    projectId: string | null;
    issueId: string | null;
}): Promise<ManagedMcpGatewayRunConfig | null>;
export declare function summarizeHeartbeatRunContextSnapshot(contextSnapshot: Record<string, unknown> | null | undefined): Record<string, unknown> | null;
export declare function summarizeHeartbeatRunListResultJson(input: {
    summary?: string | null;
    result?: string | null;
    message?: string | null;
    error?: string | null;
    totalCostUsd?: string | null;
    costUsd?: string | null;
    costUsdCamel?: string | null;
}): Record<string, unknown> | null;
export declare function resolveLedgerCostStatus(input: {
    costUsd: number | null | undefined;
    inputTokens: number;
    cachedInputTokens: number;
    outputTokens: number;
}): CostStatus;
export declare function resolveCacheAdjustedCostUsd(input: {
    costUsd?: number | null;
    cacheAdjustedCostUsd?: number | null;
}): number | null;
export declare function resolveLedgerScopeForRun(db: Db, companyId: string, run: typeof heartbeatRuns.$inferSelect): Promise<{
    issueId: null;
    projectId: string | null;
    billingCode: null;
} | {
    issueId: string;
    projectId: string | null;
    billingCode: string | null;
}>;
type ResumeSessionRow = {
    sessionParamsJson: Record<string, unknown> | null;
    sessionDisplayId: string | null;
    lastRunId: string | null;
};
export declare function buildExplicitResumeSessionOverride(input: {
    adapterType?: string | null;
    resumeFromRunId: string;
    resumeRunSessionIdBefore: string | null;
    resumeRunSessionIdAfter: string | null;
    resumeRunSessionParams?: Record<string, unknown> | null;
    taskSession: ResumeSessionRow | null;
    sessionCodec: AdapterSessionCodec;
}): {
    sessionDisplayId: string | null;
    sessionParams: Record<string, unknown> | null;
} | null;
export declare function parseSessionCompactionPolicy(agent: typeof agents.$inferSelect): SessionCompactionPolicy;
export declare function resolveRuntimeSessionParamsForWorkspace(input: {
    agentId: string;
    previousSessionParams: Record<string, unknown> | null;
    resolvedWorkspace: ResolvedWorkspaceForRun;
}): {
    sessionParams: Record<string, unknown> | null;
    warning: string | null;
};
/**
 * Extended task key derivation that falls back to a stable synthetic key
 * for timer/heartbeat wakes. The synthetic key keeps the
 * `agentTaskSessions` row addressable across heartbeats so the row can be
 * cleared and re-keyed deterministically. Unscoped exploratory timer wakes
 * still start fresh to avoid accumulating low-value inbox scans, while timer
 * wakes scoped to a real issue reuse that issue's task session.
 *
 * The synthetic key is only used when:
 * - No explicit task/issue key exists in the context
 * - The wake source is "timer" (scheduled heartbeat)
 */
export declare function deriveTaskKeyWithHeartbeatFallback(contextSnapshot: Record<string, unknown> | null | undefined, payload: Record<string, unknown> | null | undefined): string | null;
export declare function shouldResetTaskSessionForWake(contextSnapshot: Record<string, unknown> | null | undefined): boolean;
export declare function formatRuntimeWorkspaceWarningLog(warning: string): {
    stream: "stdout";
    chunk: string;
};
/**
 * A run is a "zombie" if it's marked as running in the DB but has no live
 * execution tracked in memory. This happens when the server restarts and the
 * execution is lost, or when the DB row outlives the in-memory run state.
 *
 * Queued runs are never zombies — they don't have processes yet.
 */
export declare function isZombieRun(run: {
    status: string;
    id: string;
}, tracked: {
    has(id: string): boolean;
}): boolean;
/**
 * Filter a coalesce target — if it's a zombie run, return null so the
 * wakeup falls through to create a new queued run instead of coalescing
 * into the dead process (which would refresh updatedAt and make it immortal).
 *
 * Queued runs pass through unchanged (they have no process yet).
 * Null targets pass through unchanged.
 */
export declare function filterZombieCoalesceTarget<T extends {
    status: string;
    id: string;
}>(target: T | null, tracked: {
    has(id: string): boolean;
}): T | null;
export declare function describeSessionResetReason(contextSnapshot: Record<string, unknown> | null | undefined): "forceFreshSession was requested" | "wake reason is execution_approval_requested" | "wake reason is execution_review_participant_recovery" | "wake reason is heartbeat_timer (unscoped timer wake starts fresh)" | "wake reason is issue_assigned" | null;
export declare function isWorkspaceSyncConflictFailure(message: string | null | undefined): boolean;
export declare function shouldDeferFollowupWakeForSameIssue(input: {
    activeRunStatus: string | null | undefined;
    isSameExecutionAgent: boolean;
    wakeCommentId: string | null | undefined;
    forceFreshSession: boolean;
}): boolean;
declare const EFFECTIVE_RUN_SESSION_CONFIG_CATEGORIES: readonly ["adapter", "adapterConfig", "agentRuntimeConfig", "instructions", "issueOverrides", "workspaceConfig", "environment", "envBindings", "secrets", "runtimeSkills"];
declare const EFFECTIVE_RUN_WORKSPACE_CONFIG_CATEGORIES: readonly ["mode", "projectWorkspace", "strategy", "repo", "lifecycleCommands", "runtimeServices", "environment", "realization"];
type EffectiveRunSessionConfigCategory = (typeof EFFECTIVE_RUN_SESSION_CONFIG_CATEGORIES)[number];
type EffectiveRunWorkspaceConfigCategory = (typeof EFFECTIVE_RUN_WORKSPACE_CONFIG_CATEGORIES)[number];
type EffectiveRunSessionConfigMetadata = {
    aiCredentialIdentity?: string;
    version: typeof EFFECTIVE_RUN_CONFIG_FINGERPRINT_VERSION;
    fingerprint: string;
    categories: EffectiveRunSessionConfigCategory[];
    categoryFingerprints: Record<EffectiveRunSessionConfigCategory, string>;
    fingerprints: EffectiveRunConfigFingerprints;
};
type TaskSessionConfigFreshnessDecision = {
    reset: boolean;
    reasons: string[];
    changedCategories: EffectiveRunSessionConfigCategory[];
    storedFingerprint: string | null;
    nextFingerprint: string | null;
};
export type EffectiveRunWorkspaceConfigMetadata = {
    version: typeof EFFECTIVE_RUN_CONFIG_FINGERPRINT_VERSION;
    fingerprint: string;
    categories: EffectiveRunWorkspaceConfigCategory[];
    categoryFingerprints: Record<EffectiveRunWorkspaceConfigCategory, string>;
    fingerprints: EffectiveRunConfigFingerprints;
    evaluatedAt: string;
};
type WorkspaceConfigFreshnessDecisionAction = "create" | "reuse" | "refresh" | "replace";
type ExecutionWorkspaceConfigFreshnessDecision = {
    action: WorkspaceConfigFreshnessDecisionAction;
    shouldReuseExisting: boolean;
    shouldRefreshConfigSnapshot: boolean;
    reasons: string[];
    changedCategories: EffectiveRunWorkspaceConfigCategory[];
    storedFingerprint: string | null;
    inferredFingerprint: string | null;
    nextFingerprint: string | null;
    storedFingerprintPresent: boolean;
};
type WorkspaceConfigFreshnessOperationInput = {
    decision: ExecutionWorkspaceConfigFreshnessDecision;
    hasExistingWorkspace: boolean;
    reuseRequested: boolean;
    workspaceReused: boolean;
    configSnapshotRefreshed: boolean;
    previousWorkspaceId: string | null;
    activeWorkspaceId: string | null;
};
type ExecutionWorkspaceReuseProvisioningPolicy = {
    shouldRestoreExistingWorkspace: boolean;
    shouldRefreshWorkspaceConfigSnapshot: boolean;
    shouldPersistLatestWorkspaceConfigMetadata: boolean;
};
type WorkspaceReuseIssueRef = {
    id?: string | null;
    identifier?: string | null;
} | null | undefined;
export type ExecutionWorkspaceReuseRequestForIssue = {
    requestedExecutionWorkspaceId: string | null;
    requestedShouldReuseExisting: boolean;
    existingExecutionWorkspaceAvailable: boolean;
};
/**
 * Projectless native runs bind their immutable envelope to the run id even
 * though no project-scoped execution-workspace row exists. Treat that value
 * as a reuse request only when it resolves to a persisted workspace row.
 */
export declare function resolveNativeRecoveryExecutionWorkspaceBinding(input: {
    bindingId: string | null | undefined;
    persistedWorkspaceFound: boolean;
}): string | null;
export declare function resolveExecutionWorkspaceReuseRequestForIssue(input: {
    issueExecutionWorkspaceId?: string | null;
    issueExecutionWorkspacePreference?: string | null;
    existingExecutionWorkspaceStatus?: string | null;
    requestedExistingBranch?: string | null;
    existingExecutionWorkspaceBranchName?: string | null;
}): ExecutionWorkspaceReuseRequestForIssue;
export declare function resolveExecutionWorkspaceReuseProvisioningPolicy(input: {
    requestedShouldReuseExisting: boolean;
    workspaceConfigFreshness: ExecutionWorkspaceConfigFreshnessDecision;
}): ExecutionWorkspaceReuseProvisioningPolicy;
export declare function provisionExecutionWorkspaceForFreshnessDecision<T extends {
    warnings?: string[];
}>(input: {
    requestedShouldReuseExisting: boolean;
    existingExecutionWorkspaceId?: string | null;
    issueRef: WorkspaceReuseIssueRef;
    runId: string;
    workspaceConfigFreshness: ExecutionWorkspaceConfigFreshnessDecision;
    restoreExistingWorkspace?: (() => Promise<T | null>) | null;
    realizeWorkspace: () => Promise<T>;
}): Promise<{
    executionWorkspace: T;
    reusedExecutionWorkspace: T | null;
    policy: ExecutionWorkspaceReuseProvisioningPolicy;
}>;
export declare function buildWorkspaceConfigFreshnessOperation(input: WorkspaceConfigFreshnessOperationInput): {
    metadata: {
        kind: string;
        action: WorkspaceConfigFreshnessDecisionAction;
        changedCategories: ("environment" | "lifecycleCommands" | "mode" | "projectWorkspace" | "realization" | "repo" | "runtimeServices" | "strategy")[];
        changedCategoryLabels: string[];
        reasons: string[];
        reuseRequested: true;
        workspaceReused: boolean;
        configSnapshotRefreshed: boolean;
        storedFingerprintPresent: boolean;
        previousWorkspaceId: string | null;
        activeWorkspaceId: string | null;
    };
    system: string;
} | null;
export declare function buildEffectiveRunSessionConfigMetadata(input: {
    adapterType: string;
    effectiveAdapterConfig: Record<string, unknown>;
    agentRuntimeConfig: unknown;
    issueOverrides: unknown;
    workspaceConfig: unknown;
    environment: unknown;
    environmentEnv: unknown;
    projectEnv: unknown;
    routineEnv: unknown;
    secretManifest?: readonly EffectiveRunConfigSecretManifestEntry[];
    runtimeSkills: unknown;
    agentConfigRevision?: unknown;
}): Promise<EffectiveRunSessionConfigMetadata>;
export declare function buildEffectiveRunWorkspaceConfigMetadata(input: {
    mode: unknown;
    projectId: unknown;
    projectWorkspaceId: unknown;
    strategyType: unknown;
    workspaceStrategy: unknown;
    repoUrl: unknown;
    repoRef: unknown;
    branchName?: unknown;
    configSnapshot: Partial<ExecutionWorkspaceConfig> | null;
    environment: unknown;
    realization: unknown;
    secretManifest?: readonly EffectiveRunConfigSecretManifestEntry[];
    evaluatedAt?: string | Date | null;
}): EffectiveRunWorkspaceConfigMetadata;
export declare function resolveExecutionWorkspaceConfigFreshness(input: {
    hasExistingWorkspace: boolean;
    existingWorkspaceMetadata: Record<string, unknown> | null | undefined;
    inferredMetadata?: EffectiveRunWorkspaceConfigMetadata | null;
    nextMetadata: EffectiveRunWorkspaceConfigMetadata | null;
}): ExecutionWorkspaceConfigFreshnessDecision;
export declare function shouldResetTaskSessionForModelChange(input: {
    configuredModel: string | null;
    taskSessionParams: Record<string, unknown> | null | undefined;
}): boolean;
export declare function stripConfiguredModelFromSessionParams(sessionParams: Record<string, unknown> | null | undefined): {
    [x: string]: unknown;
} | null;
export declare function stripPaperclipSessionMetadataFromSessionParams(sessionParams: Record<string, unknown> | null | undefined): {
    [x: string]: unknown;
} | null;
export declare function resolveTaskSessionConfigFreshness(input: {
    hasTaskSession: boolean;
    configuredModel: string | null;
    taskSessionParams: Record<string, unknown> | null | undefined;
    configMetadata: EffectiveRunSessionConfigMetadata | null;
    wakeResetReason?: string | null;
    preserveLegacySessionWithoutConfigMetadata?: boolean;
}): TaskSessionConfigFreshnessDecision;
export declare function shouldAutoCheckoutIssueForWake(input: {
    contextSnapshot: Record<string, unknown> | null | undefined;
    issueStatus: string | null;
    issueAssigneeAgentId: string | null;
    issueExecutionState?: unknown;
    isDependencyReady: boolean;
    agentId: string;
}): boolean;
export declare function resolvedInteractionCheckoutExpectedStatuses(): readonly ["in_progress", "in_review"];
export declare function shouldQueueFollowupForRunningIssueWake(input: {
    contextSnapshot: Record<string, unknown> | null | undefined;
    wakeCommentId: string | null;
}): boolean;
export { extractWakeCommentIds };
export declare function mergeCoalescedContextSnapshot(existingRaw: unknown, incoming: Record<string, unknown>, options?: {
    preserveExistingInteractionContinuation?: boolean;
}): Record<string, unknown>;
export declare function resolveExternalChatWakeProvider(input: {
    db: Db;
    companyId: string;
    agentId?: string | null;
    runId?: string | null;
    issueId: string | null;
    contextSnapshot: Record<string, unknown>;
}): Promise<ChatProvider | null>;
/** Bind an already-claimed chat/reply turn without checking out or approving it. */
export declare function attestReviewedExternalChatRun(input: {
    db: Db;
    companyId: string;
    agentId: string;
    issueId: string;
    runId: string;
    contextSnapshot: Record<string, unknown>;
    /** Diagnostic-only value from the committed, authorized answer; never a wake field. */
    onQuestionResponseAttested?: (answeredAtMs: number) => void;
}): Promise<boolean>;
export declare function buildPaperclipWakePayload(input: {
    db: Db;
    companyId: string;
    agentId?: string | null;
    runId?: string | null;
    contextSnapshot: Record<string, unknown>;
    continuationSummary?: {
        key: string;
        title: string | null;
        body: string;
        sourceTrust?: SourceTrustMetadata | null;
        updatedAt: Date;
    } | null;
    issueSummary?: {
        id: string;
        identifier: string | null;
        title: string;
        description: string | null;
        status: string;
        priority: string;
        workMode: string;
        projectId?: string | null;
        executionPolicy?: unknown;
    } | null;
    exposeLowTrustRaw?: boolean;
    simplifiedEnglishInteractions?: boolean;
}): Promise<{
    reason: string | null;
    executionContinuation: {} | null;
    attachmentOmissions: {
        commentId: string;
        reasons: Record<string, number>;
        notice: string;
    }[];
    externalChatProvider: "agentmail" | "discord" | "github" | "imessage-photon" | "microsoft-teams" | "slack" | "telegram" | null;
    recovery: {
        cause: string | null;
        failureSummary: string | null;
        originalAssignee: {
            id: string;
            name: string;
        } | {
            id: string;
            name: null;
        } | null;
        attemptCount: number | null;
        maxAttempts: number | null;
        nextAction: string | null;
        routingFallbackReason: string | null;
    } | null;
    issue: {
        id: string;
        identifier: string | null;
        title: string;
        description: string | null;
        descriptionTruncated: boolean;
        status: string;
        priority: string;
        workMode: string;
    } | null;
    agentMessage: {
        text: string;
        source: string | null;
        pluginKey: string | null;
        sessionId: string | null;
        untrustedToolResults?: {
            actionRequestId: string;
            toolName: string;
            resultSummary: string;
            error: string | null;
            declineReason: string | null;
        }[] | undefined;
    } | null;
    childIssueSummaries: any[];
    childIssueSummaryTruncated: boolean;
    livenessContinuation: {
        attempt: unknown;
        maxAttempts: unknown;
        sourceRunId: string | null;
        state: string | null;
        reason: string | null;
        instruction: string | null;
    } | null;
    interactionKind: string | null;
    interactionStatus: string | null;
    interactionId: string | null;
    sourceRunId: string | null;
    externalChatQuestionResponse: {} | null;
    externalInteractionContinuation: boolean;
    checkboxSelection: Record<string, unknown> | null;
    checkedOutByHarness: boolean;
    externalChatExecutionBound: boolean;
    simplifiedEnglishInteractions: boolean;
    dependencyBlockedInteraction: boolean;
    treeHoldInteraction: boolean;
    activeTreeHold: Record<string, unknown>;
    unresolvedBlockerIssueIds: string[];
    unresolvedBlockerSummaries: any[];
    executionStage: Record<string, unknown> | null;
    taskWatchdog: unknown;
    skillTest: unknown;
    continuationSummary: {
        key: string;
        title: string | null;
        body: string;
        bodyTruncated: boolean;
        sourceTrust: SourceTrustMetadata | null;
        updatedAt: string;
    } | null;
    commentIds: string[];
    latestCommentId: string;
    comments: Record<string, unknown>[];
    annotationDeltas: {
        id: string;
        issueId: string | null;
        threadId: string;
        documentKey: string;
        revisionNumber: number;
        quote: string;
        prefix: string;
        suffix: string;
        threadStatus: "open" | "resolved";
        anchorState: "active" | "orphaned" | "stale";
        anchorConfidence: "ambiguous" | "duplicate" | "exact" | "fuzzy" | "missing";
        body: string;
        bodyTruncated: boolean;
        createdAt: string;
        author: {
            type: string;
            id: string;
        } | {
            type: "agent" | "system" | "user";
            id: null;
        };
    }[];
    planReviewContext: import("@paperclipai/shared").PlanReviewContext | null;
    documentReviewContext: import("@paperclipai/shared").DocumentReviewContext | null;
    commentWindow: {
        requestedCount: number;
        includedCount: number;
        missingCount: number;
    };
    truncated: boolean;
    fallbackFetchNeeded: boolean;
} | null>;
type HeartbeatRunRuntimeStatusRunLike = {
    id: string;
    status?: string | null;
    companyId?: string | null;
    agentId?: string | null;
    issueId?: string | null;
    contextSnapshot?: Record<string, unknown> | null;
};
declare function decorateHeartbeatRunRuntimeStatus<T extends HeartbeatRunRuntimeStatusRunLike>(run: T, expected?: {
    companyId?: string | null;
    issueId?: string | null;
    agentId?: string | null;
}): T & {
    currentStatusMessage: string | null;
    currentStatusUpdatedAt: Date | null;
    currentToolName: string | null;
    lastAssistantSnippet: string | null;
    lastEventAt: Date | null;
};
export declare function buildPaperclipTaskMarkdown(input: {
    issue: {
        id: string;
        identifier: string | null;
        title: string;
        workMode?: string | null;
        conversationAgentId?: string | null;
        description?: string | null;
    } | null;
    ancestors?: Array<{
        id: string;
        identifier?: string | null;
        title?: string | null;
        status?: string | null;
        priority?: string | null;
    }> | null;
    wakeComment?: {
        id: string;
        body: string;
    } | null;
    wakeComments?: Array<{
        id: string;
        body: string;
        attachments?: Array<{
            id: string;
            filename: string;
            contentType: string;
            byteSize: number;
            contentPath: string;
        }>;
    }> | null;
    attachmentOmissions?: Array<{
        commentId: string;
        notice: string;
    }> | null;
    interaction?: {
        kind?: string | null;
        status?: string | null;
    } | null;
    planReview?: {
        status?: string | null;
        reason?: string | null;
    } | null;
    acceptedPlan?: {
        documentId?: string | null;
        revisionId?: string | null;
        revisionNumber?: number | null;
    } | null;
    acceptedPlanContinuation?: boolean;
    taskPlan?: {
        documentId: string;
        revisionId: string;
        revisionNumber: number;
        body: string;
    } | null;
    externalChatProvider?: string | null;
    nativeRunner?: boolean;
    includeDescription?: boolean;
}): string | null;
export declare function persistHeartbeatRunProcessMetadata(db: Db, runId: string, meta: {
    pid: number;
    processGroupId: number | null;
    startedAt: string;
}): Promise<{
    id: string;
    companyId: string;
    agentId: string;
    invocationSource: string;
    triggerDetail: string | null;
    status: string;
    responsibleUserId: string | null;
    activeIdentityContextId: string | null;
    startedAt: Date | null;
    finishedAt: Date | null;
    executionControlDeadlineAt: Date | null;
    executionStatusDeliveryId: string | null;
    error: string | null;
    wakeupRequestId: string | null;
    exitCode: number | null;
    signal: string | null;
    usageJson: Record<string, unknown> | null;
    resultJson: Record<string, unknown> | null;
    runtimeMode: string;
    runtimeModeResolverVersion: string | null;
    runtimeModeReason: string | null;
    runtimeModeResolvedAt: Date | null;
    runnerProfileJson: Record<string, unknown> | null;
    runnerInstanceId: string | null;
    nativeSessionId: string | null;
    nativeIssueId: string | null;
    driverKind: string | null;
    driverVersion: string | null;
    completionContractId: string | null;
    completionContractSha256: string | null;
    nextEventSeq: number;
    nativePhase: string | null;
    nativePhaseUpdatedAt: Date | null;
    sessionIdBefore: string | null;
    sessionIdAfter: string | null;
    logStore: string | null;
    logRef: string | null;
    logBytes: number | null;
    logSha256: string | null;
    logCompressed: boolean;
    stdoutExcerpt: string | null;
    stderrExcerpt: string | null;
    errorCode: string | null;
    externalRunId: string | null;
    controllerBootId: string | null;
    controllerLeaseExpiresAt: Date | null;
    executionStage: string | null;
    processPid: number | null;
    processGroupId: number | null;
    processStartedAt: Date | null;
    lastOutputAt: Date | null;
    lastOutputSeq: number;
    lastOutputStream: string | null;
    lastOutputBytes: number | null;
    retryOfRunId: string | null;
    processLossRetryCount: number;
    scheduledRetryAt: Date | null;
    scheduledRetryAttempt: number;
    scheduledRetryReason: string | null;
    issueCommentStatus: string;
    issueCommentSatisfiedByCommentId: string | null;
    issueCommentRetryQueuedAt: Date | null;
    livenessState: string | null;
    livenessReason: string | null;
    continuationAttempt: number;
    lastUsefulActionAt: Date | null;
    nextAction: string | null;
    contextSnapshot: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function normalizeSessionParams(params: Record<string, unknown> | null | undefined): Record<string, unknown> | null;
type RunSessionOutcome = "succeeded" | "interrupted" | "failed" | "cancelled" | "timed_out";
type SkillTestHeartbeatCompletion = {
    outcome: "failed" | "cancelled";
    error: string | null;
    heartbeatOutcome: RunSessionOutcome;
};
export declare function resolveSkillTestRunCompletionForHeartbeatOutcome(outcome: RunSessionOutcome, error: string | null | undefined): SkillTestHeartbeatCompletion | null;
export declare function resolveNextSessionState(input: {
    adapterType?: string | null;
    codec: AdapterSessionCodec;
    adapterResult: AdapterExecutionResult;
    outcome: RunSessionOutcome;
    previousParams: Record<string, unknown> | null;
    previousDisplayId: string | null;
    previousLegacySessionId: string | null;
}): {
    params: Record<string, unknown> | null;
    displayId: string | null;
    legacySessionId: string | null;
};
export type HeartbeatEnvironmentRuntime = ReturnType<typeof environmentRuntimeService>;
export interface HeartbeatServiceOptions {
    /** Test seam before the atomic native runtime handoff. */
    beforeNativeRuntimeSelection?: (runId: string) => Promise<void>;
    /** Test seam immediately before the durable chat-control admission check. */
    beforeChatControlRecoveryCheck?: (input: {
        runId: string;
        issueId: string;
        stage: "claim" | "dispatch";
    }) => Promise<void>;
    pluginWorkerManager?: PluginWorkerManager;
    environmentRuntime?: HeartbeatEnvironmentRuntime;
    runtimeEnv?: Record<string, string | undefined>;
    /**
     * Provider-boundary seam for persisted native-run recovery tests. Keeping
     * the seam here exercises the production reaper, claim, execution, package
     * session loop, persistence port, and finalizer without spawning a provider.
     */
    nativeSessionBackendFactory?: (execution: NativeExecutionInput) => NativeSessionBackend;
    /** Test seam for observing the native-session shutdown boundary before lease destruction. */
    closeWarmNativeSessionsForRun?: (input: {
        runId: string;
        reason: string;
    }) => Promise<{
        closed: number;
        busy: number;
        failed: number;
    }>;
    /** Test seam for changing a continuation issue at the final pre-dispatch boundary. */
    beforeResolvedInteractionContinuationDispatchCheck?: (input: {
        runId: string;
        issueId: string;
    }) => Promise<void>;
    /** Test seam for racing an issue mutation immediately before the final dispatch gate. */
    afterResolvedInteractionContinuationDispatchCheck?: (input: {
        runId: string;
        issueId: string;
    }) => Promise<void>;
}
export declare function cancelHeartbeatNativeRun(input: {
    db: Db;
    runId: string;
    reason: string;
    runtimeMode: string | null;
    cancel?: (runId: string, reason: string, options: {
        db: Db;
        scope: "run";
    }) => Promise<{
        decision: unknown | null;
        auditId: string | null;
    }>;
}): Promise<{
    decision: unknown | null;
    auditId: string | null;
}>;
type WorkspaceReadyCommentWriter = {
    addComment: (issueId: string, body: string, actor: {
        agentId?: string;
        userId?: string;
        runId?: string | null;
    }, options?: {
        presentation?: ReturnType<typeof buildWorkspaceReadyPresentation>;
        metadata?: ReturnType<typeof buildWorkspaceReadyMetadata>;
    }) => Promise<unknown>;
};
export declare function postWorkspaceReadyComment(input: {
    issuesSvc: WorkspaceReadyCommentWriter;
    issueId: string;
    agentId: string;
    runId: string;
    workspace: RealizedExecutionWorkspace;
    runtimeServices: RuntimeServiceRef[];
}): Promise<unknown>;
export declare function resolveHeartbeatSchedulingSuppression(env?: Record<string, string | undefined>, overrides?: {
    allowWorktreeRunExecution?: boolean;
}): {
    suppressed: boolean;
    reason: "worktree_instance" | "database_restore_in_progress" | "task_drain" | null;
};
export declare function heartbeatService(db: Db, options?: HeartbeatServiceOptions): {
    waitForRunExecutionDrain: (runId: string, options?: {
        timeoutMs?: number;
        intervalMs?: number;
    }) => Promise<void>;
    list: (companyId: string, agentId?: string, limit?: number, options?: {
        summary?: boolean;
    }) => Promise<({
        id: string;
        companyId: string;
        agentId: string;
        invocationSource: string;
        triggerDetail: string | null;
        status: string;
        startedAt: Date | null;
        finishedAt: Date | null;
        error: string | null;
        wakeupRequestId: string | null;
        exitCode: number | null;
        signal: string | null;
        logBytes: number | null;
        logCompressed: boolean;
        stdoutExcerpt: string | null;
        stderrExcerpt: string | null;
        errorCode: string | null;
        processStartedAt: Date | null;
        lastOutputAt: Date | null;
        lastOutputSeq: number;
        lastOutputStream: string | null;
        lastOutputBytes: number | null;
        retryOfRunId: string | null;
        processLossRetryCount: number;
        scheduledRetryAt: Date | null;
        scheduledRetryAttempt: number;
        scheduledRetryReason: string | null;
        livenessState: string | null;
        livenessReason: string | null;
        continuationAttempt: number;
        lastUsefulActionAt: Date | null;
        nextAction: string | null;
        createdAt: Date;
        updatedAt: Date;
        usageJson: Record<string, unknown> | null;
        sessionIdBefore: string | null;
        sessionIdAfter: string | null;
        logStore: string | null;
        logRef: string | null;
        logSha256: string | null;
        externalRunId: string | null;
        processPid: number | null;
        processGroupId: number | null;
        contextSnapshot: Record<string, unknown> | null;
        resultJson: Record<string, unknown> | null;
    } | {
        id: string;
        companyId: string;
        agentId: string;
        invocationSource: string;
        triggerDetail: string | null;
        status: string;
        startedAt: Date | null;
        finishedAt: Date | null;
        wakeupRequestId: string | null;
        exitCode: number | null;
        signal: string | null;
        usageJson: Record<string, unknown> | null;
        sessionIdBefore: string | null;
        sessionIdAfter: string | null;
        logStore: string | null;
        logRef: string | null;
        logBytes: number | null;
        logSha256: string | null;
        logCompressed: boolean;
        stdoutExcerpt: string | null;
        stderrExcerpt: string | null;
        errorCode: string | null;
        externalRunId: string | null;
        processPid: number | null;
        processGroupId: number | null;
        processStartedAt: Date | null;
        lastOutputAt: Date | null;
        lastOutputSeq: number;
        lastOutputStream: string | null;
        lastOutputBytes: number | null;
        retryOfRunId: string | null;
        processLossRetryCount: number;
        scheduledRetryAt: Date | null;
        scheduledRetryAttempt: number;
        scheduledRetryReason: string | null;
        livenessState: string | null;
        livenessReason: string | null;
        continuationAttempt: number;
        lastUsefulActionAt: Date | null;
        nextAction: string | null;
        createdAt: Date;
        updatedAt: Date;
        error: string | null;
        contextSnapshot: Record<string, unknown> | null;
        resultJson: Record<string, unknown> | null;
    } | {
        id: string;
        companyId: string;
        agentId: string;
        invocationSource: string;
        triggerDetail: string | null;
        status: string;
        startedAt: Date | null;
        finishedAt: Date | null;
        error: string | null;
        wakeupRequestId: string | null;
        exitCode: number | null;
        signal: string | null;
        usageJson: Record<string, unknown> | null;
        sessionIdBefore: string | null;
        sessionIdAfter: string | null;
        logStore: string | null;
        logRef: string | null;
        logBytes: number | null;
        logSha256: string | null;
        logCompressed: boolean;
        stdoutExcerpt: string | null;
        stderrExcerpt: string | null;
        errorCode: string | null;
        externalRunId: string | null;
        processPid: number | null;
        processGroupId: number | null;
        processStartedAt: Date | null;
        lastOutputAt: Date | null;
        lastOutputSeq: number;
        lastOutputStream: string | null;
        lastOutputBytes: number | null;
        retryOfRunId: string | null;
        processLossRetryCount: number;
        scheduledRetryAt: Date | null;
        scheduledRetryAttempt: number;
        scheduledRetryReason: string | null;
        livenessState: string | null;
        livenessReason: string | null;
        continuationAttempt: number;
        lastUsefulActionAt: Date | null;
        nextAction: string | null;
        createdAt: Date;
        updatedAt: Date;
        contextSnapshot: Record<string, unknown> | null;
        resultJson: Record<string, unknown> | null;
    })[]>;
    getRun: (runId: string, opts?: {
        unsafeFullResultJson?: boolean;
    }) => Promise<{
        id: string;
        companyId: string;
        agentId: string;
        invocationSource: string;
        triggerDetail: string | null;
        status: string;
        responsibleUserId: string | null;
        activeIdentityContextId: string | null;
        startedAt: Date | null;
        finishedAt: Date | null;
        executionControlDeadlineAt: Date | null;
        executionStatusDeliveryId: string | null;
        error: string | null;
        wakeupRequestId: string | null;
        exitCode: number | null;
        signal: string | null;
        usageJson: Record<string, unknown> | null;
        resultJson: Record<string, unknown> | null;
        runtimeMode: string;
        runtimeModeResolverVersion: string | null;
        runtimeModeReason: string | null;
        runtimeModeResolvedAt: Date | null;
        runnerProfileJson: Record<string, unknown> | null;
        runnerInstanceId: string | null;
        nativeSessionId: string | null;
        nativeIssueId: string | null;
        driverKind: string | null;
        driverVersion: string | null;
        completionContractId: string | null;
        completionContractSha256: string | null;
        nextEventSeq: number;
        nativePhase: string | null;
        nativePhaseUpdatedAt: Date | null;
        sessionIdBefore: string | null;
        sessionIdAfter: string | null;
        logStore: string | null;
        logRef: string | null;
        logBytes: number | null;
        logSha256: string | null;
        logCompressed: boolean;
        stdoutExcerpt: string | null;
        stderrExcerpt: string | null;
        errorCode: string | null;
        externalRunId: string | null;
        controllerBootId: string | null;
        controllerLeaseExpiresAt: Date | null;
        executionStage: string | null;
        processPid: number | null;
        processGroupId: number | null;
        processStartedAt: Date | null;
        lastOutputAt: Date | null;
        lastOutputSeq: number;
        lastOutputStream: string | null;
        lastOutputBytes: number | null;
        retryOfRunId: string | null;
        processLossRetryCount: number;
        scheduledRetryAt: Date | null;
        scheduledRetryAttempt: number;
        scheduledRetryReason: string | null;
        issueCommentStatus: string;
        issueCommentSatisfiedByCommentId: string | null;
        issueCommentRetryQueuedAt: Date | null;
        livenessState: string | null;
        livenessReason: string | null;
        continuationAttempt: number;
        lastUsefulActionAt: Date | null;
        nextAction: string | null;
        contextSnapshot: Record<string, unknown> | null;
        createdAt: Date;
        updatedAt: Date;
    } | {
        readonly id: string;
        readonly companyId: string;
        readonly agentId: string;
        readonly invocationSource: string;
        readonly triggerDetail: string | null;
        readonly status: string;
        readonly responsibleUserId: string | null;
        readonly activeIdentityContextId: string | null;
        readonly startedAt: Date | null;
        readonly finishedAt: Date | null;
        readonly executionControlDeadlineAt: Date | null;
        readonly executionStatusDeliveryId: string | null;
        readonly error: string | null;
        readonly wakeupRequestId: string | null;
        readonly exitCode: number | null;
        readonly signal: string | null;
        readonly usageJson: Record<string, unknown> | null;
        readonly runtimeMode: string;
        readonly runtimeModeResolverVersion: string | null;
        readonly runtimeModeReason: string | null;
        readonly runtimeModeResolvedAt: Date | null;
        readonly runnerProfileJson: Record<string, unknown> | null;
        readonly runnerInstanceId: string | null;
        readonly nativeSessionId: string | null;
        readonly nativeIssueId: string | null;
        readonly driverKind: string | null;
        readonly driverVersion: string | null;
        readonly completionContractId: string | null;
        readonly completionContractSha256: string | null;
        readonly nextEventSeq: number;
        readonly nativePhase: string | null;
        readonly nativePhaseUpdatedAt: Date | null;
        readonly sessionIdBefore: string | null;
        readonly sessionIdAfter: string | null;
        readonly logStore: string | null;
        readonly logRef: string | null;
        readonly logBytes: number | null;
        readonly logSha256: string | null;
        readonly logCompressed: boolean;
        readonly stdoutExcerpt: string | null;
        readonly stderrExcerpt: string | null;
        readonly errorCode: string | null;
        readonly externalRunId: string | null;
        readonly controllerBootId: string | null;
        readonly controllerLeaseExpiresAt: Date | null;
        readonly executionStage: string | null;
        readonly processPid: number | null;
        readonly processStartedAt: Date | null;
        readonly lastOutputAt: Date | null;
        readonly lastOutputSeq: number;
        readonly lastOutputStream: string | null;
        readonly lastOutputBytes: number | null;
        readonly retryOfRunId: string | null;
        readonly processLossRetryCount: number;
        readonly scheduledRetryAt: Date | null;
        readonly scheduledRetryAttempt: number;
        readonly scheduledRetryReason: string | null;
        readonly issueCommentStatus: string;
        readonly issueCommentSatisfiedByCommentId: string | null;
        readonly issueCommentRetryQueuedAt: Date | null;
        readonly livenessState: string | null;
        readonly livenessReason: string | null;
        readonly continuationAttempt: number;
        readonly lastUsefulActionAt: Date | null;
        readonly nextAction: string | null;
        readonly contextSnapshot: Record<string, unknown> | null;
        readonly createdAt: Date;
        readonly updatedAt: Date;
        readonly processGroupId: number | null;
        readonly resultJson: Record<string, unknown> | null;
    } | {
        readonly id: string;
        readonly companyId: string;
        readonly agentId: string;
        readonly invocationSource: string;
        readonly triggerDetail: string | null;
        readonly status: string;
        readonly responsibleUserId: string | null;
        readonly activeIdentityContextId: string | null;
        readonly startedAt: Date | null;
        readonly finishedAt: Date | null;
        readonly executionControlDeadlineAt: Date | null;
        readonly executionStatusDeliveryId: string | null;
        readonly wakeupRequestId: string | null;
        readonly exitCode: number | null;
        readonly signal: string | null;
        readonly usageJson: Record<string, unknown> | null;
        readonly runtimeMode: string;
        readonly runtimeModeResolverVersion: string | null;
        readonly runtimeModeReason: string | null;
        readonly runtimeModeResolvedAt: Date | null;
        readonly runnerProfileJson: Record<string, unknown> | null;
        readonly runnerInstanceId: string | null;
        readonly nativeSessionId: string | null;
        readonly nativeIssueId: string | null;
        readonly driverKind: string | null;
        readonly driverVersion: string | null;
        readonly completionContractId: string | null;
        readonly completionContractSha256: string | null;
        readonly nextEventSeq: number;
        readonly nativePhase: string | null;
        readonly nativePhaseUpdatedAt: Date | null;
        readonly sessionIdBefore: string | null;
        readonly sessionIdAfter: string | null;
        readonly logStore: string | null;
        readonly logRef: string | null;
        readonly logBytes: number | null;
        readonly logSha256: string | null;
        readonly logCompressed: boolean;
        readonly errorCode: string | null;
        readonly externalRunId: string | null;
        readonly controllerBootId: string | null;
        readonly controllerLeaseExpiresAt: Date | null;
        readonly executionStage: string | null;
        readonly processPid: number | null;
        readonly processStartedAt: Date | null;
        readonly lastOutputAt: Date | null;
        readonly lastOutputSeq: number;
        readonly lastOutputStream: string | null;
        readonly lastOutputBytes: number | null;
        readonly retryOfRunId: string | null;
        readonly processLossRetryCount: number;
        readonly scheduledRetryAt: Date | null;
        readonly scheduledRetryAttempt: number;
        readonly scheduledRetryReason: string | null;
        readonly issueCommentStatus: string;
        readonly issueCommentSatisfiedByCommentId: string | null;
        readonly issueCommentRetryQueuedAt: Date | null;
        readonly livenessState: string | null;
        readonly livenessReason: string | null;
        readonly continuationAttempt: number;
        readonly lastUsefulActionAt: Date | null;
        readonly nextAction: string | null;
        readonly contextSnapshot: Record<string, unknown> | null;
        readonly createdAt: Date;
        readonly updatedAt: Date;
        readonly processGroupId: number | null;
        readonly error: string | null;
        readonly resultJson: Record<string, unknown> | null;
        readonly stdoutExcerpt: string | null;
        readonly stderrExcerpt: string | null;
    }>;
    decorateActiveRunStatus: typeof decorateHeartbeatRunRuntimeStatus;
    recordRuntimeProgress: (run: Pick<typeof heartbeatRuns.$inferSelect, "id" | "companyId" | "agentId" | "status" | "contextSnapshot">, update: RuntimeStatusUpdate, issueId: string | null) => Promise<import("./heartbeat-run-runtime-status.js").HeartbeatRunRuntimeStatus | null>;
    sweepExpiredRuntimeStatuses: typeof sweepExpiredHeartbeatRunRuntimeStatuses;
    getRunLogAccess: (runId: string) => Promise<{
        readonly id: string;
        readonly companyId: string;
        readonly logStore: string | null;
        readonly logRef: string | null;
    }>;
    getRuntimeState: (agentId: string) => Promise<{
        agentId: string;
        companyId: string;
        adapterType: string;
        sessionId: string | null;
        stateJson: Record<string, unknown>;
        lastRunId: string | null;
        lastRunStatus: string | null;
        totalInputTokens: number;
        totalOutputTokens: number;
        totalCachedInputTokens: number;
        totalCostCents: number;
        lastError: string | null;
        createdAt: Date;
        updatedAt: Date;
        sessionDisplayId: string | null;
        sessionParamsJson: Record<string, unknown> | null;
    } | null>;
    listTaskSessions: (agentId: string) => Promise<{
        id: string;
        companyId: string;
        agentId: string;
        adapterType: string;
        taskKey: string;
        sessionParamsJson: Record<string, unknown> | null;
        sessionDisplayId: string | null;
        lastRunId: string | null;
        lastError: string | null;
        goalCapabilityJson: Record<string, unknown> | null;
        goalJson: Record<string, unknown> | null;
        goalStatus: string | null;
        goalDesiredState: string | null;
        goalSourceId: string | null;
        goalSourceCursor: number | null;
        goalRevision: number;
        goalObservedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    resetRuntimeSession: (agentId: string, opts?: {
        taskKey?: string | null;
    }) => Promise<{
        agentId: string;
        companyId: string;
        adapterType: string;
        sessionId: string | null;
        stateJson: Record<string, unknown>;
        lastRunId: string | null;
        lastRunStatus: string | null;
        totalInputTokens: number;
        totalOutputTokens: number;
        totalCachedInputTokens: number;
        totalCostCents: number;
        lastError: string | null;
        createdAt: Date;
        updatedAt: Date;
        sessionDisplayId: null;
        sessionParamsJson: null;
        clearedTaskSessions: number;
    } | null>;
    listEvents: (runId: string, afterSeq?: number, limit?: number) => Omit<import("drizzle-orm/pg-core").PgSelectBase<"heartbeat_run_events", {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "heartbeat_run_events";
            dataType: "number";
            columnType: "PgBigSerial53";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        companyId: import("drizzle-orm/pg-core").PgColumn<{
            name: "company_id";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        runId: import("drizzle-orm/pg-core").PgColumn<{
            name: "run_id";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        agentId: import("drizzle-orm/pg-core").PgColumn<{
            name: "agent_id";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        seq: import("drizzle-orm/pg-core").PgColumn<{
            name: "seq";
            tableName: "heartbeat_run_events";
            dataType: "number";
            columnType: "PgBigInt53";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        eventType: import("drizzle-orm/pg-core").PgColumn<{
            name: "event_type";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        stream: import("drizzle-orm/pg-core").PgColumn<{
            name: "stream";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        level: import("drizzle-orm/pg-core").PgColumn<{
            name: "level";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        color: import("drizzle-orm/pg-core").PgColumn<{
            name: "color";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        message: import("drizzle-orm/pg-core").PgColumn<{
            name: "message";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        payload: import("drizzle-orm/pg-core").PgColumn<{
            name: "payload";
            tableName: "heartbeat_run_events";
            dataType: "custom";
            columnType: "PgCustomColumn";
            data: Record<string, unknown>;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            pgColumnBuilderBrand: 'PgCustomColumnBuilderBrand';
        }>;
        sourceInstanceId: import("drizzle-orm/pg-core").PgColumn<{
            name: "source_instance_id";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        sourceEventId: import("drizzle-orm/pg-core").PgColumn<{
            name: "source_event_id";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        sourceSeq: import("drizzle-orm/pg-core").PgColumn<{
            name: "source_seq";
            tableName: "heartbeat_run_events";
            dataType: "number";
            columnType: "PgBigInt53";
            data: number;
            driverParam: string | number;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        sourcePayloadSha256: import("drizzle-orm/pg-core").PgColumn<{
            name: "source_payload_sha256";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        protocolSchemaVersion: import("drizzle-orm/pg-core").PgColumn<{
            name: "protocol_schema_version";
            tableName: "heartbeat_run_events";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "heartbeat_run_events";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    }, "single", Record<"heartbeat_run_events", "not-null">, false, "limit" | "orderBy" | "where", {
        id: number;
        companyId: string;
        runId: string;
        agentId: string;
        seq: number;
        eventType: string;
        stream: string | null;
        level: string | null;
        color: string | null;
        message: string | null;
        payload: Record<string, unknown> | null;
        sourceInstanceId: string | null;
        sourceEventId: string | null;
        sourceSeq: number | null;
        sourcePayloadSha256: string | null;
        protocolSchemaVersion: number | null;
        createdAt: Date;
    }[], {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "heartbeat_run_events";
            dataType: "number";
            columnType: "PgBigSerial53";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        companyId: import("drizzle-orm/pg-core").PgColumn<{
            name: "company_id";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        runId: import("drizzle-orm/pg-core").PgColumn<{
            name: "run_id";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        agentId: import("drizzle-orm/pg-core").PgColumn<{
            name: "agent_id";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        seq: import("drizzle-orm/pg-core").PgColumn<{
            name: "seq";
            tableName: "heartbeat_run_events";
            dataType: "number";
            columnType: "PgBigInt53";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        eventType: import("drizzle-orm/pg-core").PgColumn<{
            name: "event_type";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        stream: import("drizzle-orm/pg-core").PgColumn<{
            name: "stream";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        level: import("drizzle-orm/pg-core").PgColumn<{
            name: "level";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        color: import("drizzle-orm/pg-core").PgColumn<{
            name: "color";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        message: import("drizzle-orm/pg-core").PgColumn<{
            name: "message";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        payload: import("drizzle-orm/pg-core").PgColumn<{
            name: "payload";
            tableName: "heartbeat_run_events";
            dataType: "custom";
            columnType: "PgCustomColumn";
            data: Record<string, unknown>;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            pgColumnBuilderBrand: 'PgCustomColumnBuilderBrand';
        }>;
        sourceInstanceId: import("drizzle-orm/pg-core").PgColumn<{
            name: "source_instance_id";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        sourceEventId: import("drizzle-orm/pg-core").PgColumn<{
            name: "source_event_id";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        sourceSeq: import("drizzle-orm/pg-core").PgColumn<{
            name: "source_seq";
            tableName: "heartbeat_run_events";
            dataType: "number";
            columnType: "PgBigInt53";
            data: number;
            driverParam: string | number;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        sourcePayloadSha256: import("drizzle-orm/pg-core").PgColumn<{
            name: "source_payload_sha256";
            tableName: "heartbeat_run_events";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        protocolSchemaVersion: import("drizzle-orm/pg-core").PgColumn<{
            name: "protocol_schema_version";
            tableName: "heartbeat_run_events";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "heartbeat_run_events";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    }>, "limit" | "orderBy" | "where">;
    getRetryExhaustedReason: (runId: string) => Promise<string | null>;
    readLog: (runOrLookup: string | {
        id: string;
        companyId: string;
        logStore: string | null;
        logRef: string | null;
    }, opts?: {
        offset?: number;
        limitBytes?: number;
    }) => Promise<{
        nextOffset?: number;
        runId: string;
        store: string;
        logRef: string;
        content: string;
    }>;
    invoke: (agentId: string, source?: "timer" | "assignment" | "on_demand" | "automation", contextSnapshot?: Record<string, unknown>, triggerDetail?: "manual" | "ping" | "callback" | "system", actor?: {
        actorType?: "user" | "agent" | "system";
        actorId?: string | null;
    }) => Promise<{
        readonly id: string;
        readonly companyId: string;
        readonly agentId: string;
        readonly invocationSource: string;
        readonly triggerDetail: string | null;
        readonly status: string;
        readonly responsibleUserId: string | null;
        readonly activeIdentityContextId: string | null;
        readonly startedAt: Date | null;
        readonly finishedAt: Date | null;
        readonly executionControlDeadlineAt: Date | null;
        readonly executionStatusDeliveryId: string | null;
        readonly error: string | null;
        readonly wakeupRequestId: string | null;
        readonly exitCode: number | null;
        readonly signal: string | null;
        readonly usageJson: Record<string, unknown> | null;
        readonly runtimeMode: string;
        readonly runtimeModeResolverVersion: string | null;
        readonly runtimeModeReason: string | null;
        readonly runtimeModeResolvedAt: Date | null;
        readonly runnerProfileJson: Record<string, unknown> | null;
        readonly runnerInstanceId: string | null;
        readonly nativeSessionId: string | null;
        readonly nativeIssueId: string | null;
        readonly driverKind: string | null;
        readonly driverVersion: string | null;
        readonly completionContractId: string | null;
        readonly completionContractSha256: string | null;
        readonly nextEventSeq: number;
        readonly nativePhase: string | null;
        readonly nativePhaseUpdatedAt: Date | null;
        readonly sessionIdBefore: string | null;
        readonly sessionIdAfter: string | null;
        readonly logStore: string | null;
        readonly logRef: string | null;
        readonly logBytes: number | null;
        readonly logSha256: string | null;
        readonly logCompressed: boolean;
        readonly stdoutExcerpt: string | null;
        readonly stderrExcerpt: string | null;
        readonly errorCode: string | null;
        readonly externalRunId: string | null;
        readonly controllerBootId: string | null;
        readonly controllerLeaseExpiresAt: Date | null;
        readonly executionStage: string | null;
        readonly processPid: number | null;
        readonly processStartedAt: Date | null;
        readonly lastOutputAt: Date | null;
        readonly lastOutputSeq: number;
        readonly lastOutputStream: string | null;
        readonly lastOutputBytes: number | null;
        readonly retryOfRunId: string | null;
        readonly processLossRetryCount: number;
        readonly scheduledRetryAt: Date | null;
        readonly scheduledRetryAttempt: number;
        readonly scheduledRetryReason: string | null;
        readonly issueCommentStatus: string;
        readonly issueCommentSatisfiedByCommentId: string | null;
        readonly issueCommentRetryQueuedAt: Date | null;
        readonly livenessState: string | null;
        readonly livenessReason: string | null;
        readonly continuationAttempt: number;
        readonly lastUsefulActionAt: Date | null;
        readonly nextAction: string | null;
        readonly contextSnapshot: Record<string, unknown> | null;
        readonly createdAt: Date;
        readonly updatedAt: Date;
        readonly processGroupId: number | null;
        readonly resultJson: Record<string, unknown> | null;
    } | null>;
    wakeup: (agentId: string, opts?: WakeupOptions) => ReturnType<(agentId: string, opts?: WakeupOptions, executionWaitRequestId?: string) => Promise<{
        readonly id: string;
        readonly companyId: string;
        readonly agentId: string;
        readonly invocationSource: string;
        readonly triggerDetail: string | null;
        readonly status: string;
        readonly responsibleUserId: string | null;
        readonly activeIdentityContextId: string | null;
        readonly startedAt: Date | null;
        readonly finishedAt: Date | null;
        readonly executionControlDeadlineAt: Date | null;
        readonly executionStatusDeliveryId: string | null;
        readonly error: string | null;
        readonly wakeupRequestId: string | null;
        readonly exitCode: number | null;
        readonly signal: string | null;
        readonly usageJson: Record<string, unknown> | null;
        readonly runtimeMode: string;
        readonly runtimeModeResolverVersion: string | null;
        readonly runtimeModeReason: string | null;
        readonly runtimeModeResolvedAt: Date | null;
        readonly runnerProfileJson: Record<string, unknown> | null;
        readonly runnerInstanceId: string | null;
        readonly nativeSessionId: string | null;
        readonly nativeIssueId: string | null;
        readonly driverKind: string | null;
        readonly driverVersion: string | null;
        readonly completionContractId: string | null;
        readonly completionContractSha256: string | null;
        readonly nextEventSeq: number;
        readonly nativePhase: string | null;
        readonly nativePhaseUpdatedAt: Date | null;
        readonly sessionIdBefore: string | null;
        readonly sessionIdAfter: string | null;
        readonly logStore: string | null;
        readonly logRef: string | null;
        readonly logBytes: number | null;
        readonly logSha256: string | null;
        readonly logCompressed: boolean;
        readonly stdoutExcerpt: string | null;
        readonly stderrExcerpt: string | null;
        readonly errorCode: string | null;
        readonly externalRunId: string | null;
        readonly controllerBootId: string | null;
        readonly controllerLeaseExpiresAt: Date | null;
        readonly executionStage: string | null;
        readonly processPid: number | null;
        readonly processStartedAt: Date | null;
        readonly lastOutputAt: Date | null;
        readonly lastOutputSeq: number;
        readonly lastOutputStream: string | null;
        readonly lastOutputBytes: number | null;
        readonly retryOfRunId: string | null;
        readonly processLossRetryCount: number;
        readonly scheduledRetryAt: Date | null;
        readonly scheduledRetryAttempt: number;
        readonly scheduledRetryReason: string | null;
        readonly issueCommentStatus: string;
        readonly issueCommentSatisfiedByCommentId: string | null;
        readonly issueCommentRetryQueuedAt: Date | null;
        readonly livenessState: string | null;
        readonly livenessReason: string | null;
        readonly continuationAttempt: number;
        readonly lastUsefulActionAt: Date | null;
        readonly nextAction: string | null;
        readonly contextSnapshot: Record<string, unknown> | null;
        readonly createdAt: Date;
        readonly updatedAt: Date;
        readonly processGroupId: number | null;
        readonly resultJson: Record<string, unknown> | null;
    } | null>>;
    dispatchPendingNativeStatusWakeups: (input?: {
        companyId?: string;
        limit?: number;
        staleClaimMs?: number;
    }) => Promise<{
        scanned: number;
        dispatched: number;
        recovered: number;
        deferred: number;
    }>;
    triggerIssueMonitor: (issueId: string, input?: {
        now?: Date;
        actorType?: "user" | "agent" | "system";
        actorId?: string | null;
        agentId?: string | null;
        runId?: string | null;
        wakeReason?: string;
    }) => Promise<{
        outcome: "triggered";
        reason?: undefined;
    } | {
        outcome: "skipped";
        reason: string;
    }>;
    reportRunActivity: (runId: string) => Promise<{
        id: string;
        companyId: string;
        agentId: string;
        invocationSource: string;
        triggerDetail: string | null;
        status: string;
        responsibleUserId: string | null;
        activeIdentityContextId: string | null;
        startedAt: Date | null;
        finishedAt: Date | null;
        executionControlDeadlineAt: Date | null;
        executionStatusDeliveryId: string | null;
        error: string | null;
        wakeupRequestId: string | null;
        exitCode: number | null;
        signal: string | null;
        usageJson: Record<string, unknown> | null;
        resultJson: Record<string, unknown> | null;
        runtimeMode: string;
        runtimeModeResolverVersion: string | null;
        runtimeModeReason: string | null;
        runtimeModeResolvedAt: Date | null;
        runnerProfileJson: Record<string, unknown> | null;
        runnerInstanceId: string | null;
        nativeSessionId: string | null;
        nativeIssueId: string | null;
        driverKind: string | null;
        driverVersion: string | null;
        completionContractId: string | null;
        completionContractSha256: string | null;
        nextEventSeq: number;
        nativePhase: string | null;
        nativePhaseUpdatedAt: Date | null;
        sessionIdBefore: string | null;
        sessionIdAfter: string | null;
        logStore: string | null;
        logRef: string | null;
        logBytes: number | null;
        logSha256: string | null;
        logCompressed: boolean;
        stdoutExcerpt: string | null;
        stderrExcerpt: string | null;
        errorCode: string | null;
        externalRunId: string | null;
        controllerBootId: string | null;
        controllerLeaseExpiresAt: Date | null;
        executionStage: string | null;
        processPid: number | null;
        processGroupId: number | null;
        processStartedAt: Date | null;
        lastOutputAt: Date | null;
        lastOutputSeq: number;
        lastOutputStream: string | null;
        lastOutputBytes: number | null;
        retryOfRunId: string | null;
        processLossRetryCount: number;
        scheduledRetryAt: Date | null;
        scheduledRetryAttempt: number;
        scheduledRetryReason: string | null;
        issueCommentStatus: string;
        issueCommentSatisfiedByCommentId: string | null;
        issueCommentRetryQueuedAt: Date | null;
        livenessState: string | null;
        livenessReason: string | null;
        continuationAttempt: number;
        lastUsefulActionAt: Date | null;
        nextAction: string | null;
        contextSnapshot: Record<string, unknown> | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    prepareHotRestartShutdown: (signal: "SIGINT" | "SIGTERM", now?: Date) => Promise<{
        mode: "read_error";
        skipDrain: false;
        activeRunIds: string[];
        activeAcpRunIds?: undefined;
        drainRunIds?: undefined;
        drainReason?: undefined;
    } | {
        mode: "not_requested";
        skipDrain: false;
        activeRunIds: string[];
        activeAcpRunIds?: undefined;
        drainRunIds?: undefined;
        drainReason?: undefined;
    } | {
        mode: "drain_required";
        skipDrain: false;
        activeRunIds: string[];
        activeAcpRunIds?: undefined;
        drainRunIds?: undefined;
        drainReason?: undefined;
    } | {
        mode: "pid_mismatch";
        skipDrain: false;
        activeRunIds: string[];
        activeAcpRunIds?: undefined;
        drainRunIds?: undefined;
        drainReason?: undefined;
    } | {
        mode: "acp_drain_required";
        skipDrain: false;
        activeRunIds: string[];
        activeAcpRunIds: string[];
        drainRunIds: string[];
        drainReason: "active_acp_run";
    } | {
        activeAcpRunIds?: undefined;
        drainRunIds?: undefined;
        drainReason?: undefined;
        mode: "hot_restart";
        skipDrain: true;
        activeRunIds: string[];
    }>;
    reconcileHotRestartAdoption: (now?: Date) => Promise<{
        mode: "read_error";
        adoptedRunIds: string[];
        finalizedWhileDownRunIds: string[];
        lostRunIds: string[];
        skippedRunIds: string[];
    } | {
        mode: "not_requested";
        adoptedRunIds: string[];
        finalizedWhileDownRunIds: string[];
        lostRunIds: string[];
        skippedRunIds: string[];
    } | {
        mode: "reported";
        adoptedRunIds: string[];
        finalizedWhileDownRunIds: string[];
        lostRunIds: string[];
        skippedRunIds: string[];
    }>;
    recoverNativeRunsAfterRestart: (now?: Date) => Promise<{
        restartKind: "hard" | "hot";
        claims: NativeRestartRecoveryClaim[];
        dispositions: import("./native-runtime/native-restart-recovery.js").NativeRestartRecoveryDisposition[];
        scheduledRetryRunIds: string[];
        awaitingEvidenceRunIds: string[];
        blockedRunIds: string[];
    }>;
    reapOrphanedRuns: (opts?: {
        staleThresholdMs?: number;
    }) => Promise<{
        reaped: number;
        runIds: string[];
    }>;
    sweepPendingCleanupLeases: (opts?: {
        backoffMs?: number;
        /** One cleanup attempt per explicit user Retry, for this failed run only.
         * A later user Retry may try again after a provider failure; automatic
         * sweeps retain their exhausted budget and never gain extra attempts.
         */
        explicitRetry?: {
            companyId: string;
            runId: string;
            actorId: string;
            reason?: "retry_failed_run" | "queued_comment_interrupt";
        };
    }) => Promise<{
        swept: number;
        destroyed: number;
        capped: number;
    }>;
    resolveSchedulingSuppression: () => Promise<{
        suppressed: boolean;
        reason: "worktree_instance" | "database_restore_in_progress" | "task_drain" | null;
    }>;
    drainRunningRunsForShutdown: (signal: "SIGINT" | "SIGTERM", now?: Date, runIds?: readonly string[] | null) => Promise<{
        interrupted: number;
        interruptedRunIds: string[];
        retryRunIds: string[];
        restartSuspendedRunIds: string[];
    }>;
    drainActiveRunExecutions: () => Promise<void>;
    startTaskDrain: typeof startTaskDrain;
    stopTaskDrain: typeof stopTaskDrain;
    getTaskDrainStatus: typeof getTaskDrainStatus;
    computeTaskDrain: typeof computeTaskDrain;
    applyTaskDrain: typeof applyTaskDrain;
    promoteDueScheduledRetries: (now?: Date) => Promise<{
        promoted: number;
        runIds: string[];
    }>;
    retryScheduledRetryNow: (input: {
        issueId: string;
        actor?: {
            actorType?: "user" | "agent" | "system";
            actorId?: string | null;
        };
        now?: Date;
    }) => Promise<{
        outcome: "already_promoted";
        message: string;
        scheduledRetry: {
            runId: string;
            status: "scheduled_retry" | "queued" | "running" | "cancelled";
            agentId: string;
            agentName: string | null;
            retryOfRunId: string | null;
            scheduledRetryAt: Date | null;
            scheduledRetryAttempt: number;
            scheduledRetryReason: string | null;
            error: string | null;
            errorCode: string | null;
        };
    } | {
        outcome: "no_scheduled_retry";
        message: string;
        scheduledRetry: null;
    } | {
        outcome: "promoted";
        message: string;
        scheduledRetry: {
            runId: string;
            status: "scheduled_retry" | "queued" | "running" | "cancelled";
            agentId: string;
            agentName: string | null;
            retryOfRunId: string | null;
            scheduledRetryAt: Date | null;
            scheduledRetryAttempt: number;
            scheduledRetryReason: string | null;
            error: string | null;
            errorCode: string | null;
        };
    } | {
        outcome: "gate_suppressed";
        message: string;
        scheduledRetry: {
            runId: string;
            status: "scheduled_retry" | "queued" | "running" | "cancelled";
            agentId: string;
            agentName: string | null;
            retryOfRunId: string | null;
            scheduledRetryAt: Date | null;
            scheduledRetryAttempt: number;
            scheduledRetryReason: string | null;
            error: string | null;
            errorCode: string | null;
        };
    }>;
    resumeQueuedRuns: () => Promise<void>;
    scheduleBoundedRetry: (runId: string, opts?: {
        now?: Date;
        random?: () => number;
        retryReason?: string;
        wakeReason?: string;
        maxAttempts?: number;
        delayMs?: number;
    }) => Promise<{
        outcome: "retry_exhausted";
        attempt: number;
        maxAttempts: number;
        reason?: undefined;
        errorCode?: undefined;
        issueId?: undefined;
        reusedExisting?: undefined;
        run?: undefined;
        dueAt?: undefined;
    } | {
        outcome: "not_scheduled";
        reason: string;
        errorCode: "legacy_execution_requires_reconciliation";
        issueId: string | null;
        reusedExisting?: undefined;
        run?: undefined;
        dueAt?: undefined;
        attempt?: undefined;
        maxAttempts?: undefined;
    } | {
        outcome: "not_scheduled";
        reason: string;
        errorCode: import("../modules/run-dispatch/index.js").ScheduledRetryGateErrorCode;
        issueId: string | null;
        reusedExisting?: undefined;
        run?: undefined;
        dueAt?: undefined;
        attempt?: undefined;
        maxAttempts?: undefined;
    } | {
        reason?: undefined;
        errorCode?: undefined;
        issueId?: undefined;
        outcome: "scheduled";
        run: {
            activeIdentityContextId: string | null;
            agentId: string;
            companyId: string;
            completionContractId: string | null;
            completionContractSha256: string | null;
            contextSnapshot: Record<string, unknown> | null;
            continuationAttempt: number;
            controllerBootId: string | null;
            controllerLeaseExpiresAt: Date | null;
            createdAt: Date;
            driverKind: string | null;
            driverVersion: string | null;
            error: string | null;
            errorCode: string | null;
            executionControlDeadlineAt: Date | null;
            executionStage: string | null;
            executionStatusDeliveryId: string | null;
            exitCode: number | null;
            externalRunId: string | null;
            finishedAt: Date | null;
            id: string;
            invocationSource: string;
            issueCommentRetryQueuedAt: Date | null;
            issueCommentSatisfiedByCommentId: string | null;
            issueCommentStatus: string;
            lastOutputAt: Date | null;
            lastOutputBytes: number | null;
            lastOutputSeq: number;
            lastOutputStream: string | null;
            lastUsefulActionAt: Date | null;
            livenessReason: string | null;
            livenessState: string | null;
            logBytes: number | null;
            logCompressed: boolean;
            logRef: string | null;
            logSha256: string | null;
            logStore: string | null;
            nativeIssueId: string | null;
            nativePhase: string | null;
            nativePhaseUpdatedAt: Date | null;
            nativeSessionId: string | null;
            nextAction: string | null;
            nextEventSeq: number;
            processGroupId: number | null;
            processLossRetryCount: number;
            processPid: number | null;
            processStartedAt: Date | null;
            responsibleUserId: string | null;
            resultJson: Record<string, unknown> | null;
            retryOfRunId: string | null;
            runnerInstanceId: string | null;
            runnerProfileJson: Record<string, unknown> | null;
            runtimeMode: string;
            runtimeModeReason: string | null;
            runtimeModeResolvedAt: Date | null;
            runtimeModeResolverVersion: string | null;
            scheduledRetryAt: Date | null;
            scheduledRetryAttempt: number;
            scheduledRetryReason: string | null;
            sessionIdAfter: string | null;
            sessionIdBefore: string | null;
            signal: string | null;
            startedAt: Date | null;
            status: string;
            stderrExcerpt: string | null;
            stdoutExcerpt: string | null;
            triggerDetail: string | null;
            updatedAt: Date;
            usageJson: Record<string, unknown> | null;
            wakeupRequestId: string | null;
        };
        dueAt: Date;
        attempt: number;
        maxAttempts: number;
        reusedExisting: boolean;
    } | {
        reason?: undefined;
        errorCode?: undefined;
        issueId?: undefined;
        reusedExisting?: undefined;
        outcome: "scheduled";
        run: {
            activeIdentityContextId: string | null;
            agentId: string;
            companyId: string;
            completionContractId: string | null;
            completionContractSha256: string | null;
            contextSnapshot: Record<string, unknown> | null;
            continuationAttempt: number;
            controllerBootId: string | null;
            controllerLeaseExpiresAt: Date | null;
            createdAt: Date;
            driverKind: string | null;
            driverVersion: string | null;
            error: string | null;
            errorCode: string | null;
            executionControlDeadlineAt: Date | null;
            executionStage: string | null;
            executionStatusDeliveryId: string | null;
            exitCode: number | null;
            externalRunId: string | null;
            finishedAt: Date | null;
            id: string;
            invocationSource: string;
            issueCommentRetryQueuedAt: Date | null;
            issueCommentSatisfiedByCommentId: string | null;
            issueCommentStatus: string;
            lastOutputAt: Date | null;
            lastOutputBytes: number | null;
            lastOutputSeq: number;
            lastOutputStream: string | null;
            lastUsefulActionAt: Date | null;
            livenessReason: string | null;
            livenessState: string | null;
            logBytes: number | null;
            logCompressed: boolean;
            logRef: string | null;
            logSha256: string | null;
            logStore: string | null;
            nativeIssueId: string | null;
            nativePhase: string | null;
            nativePhaseUpdatedAt: Date | null;
            nativeSessionId: string | null;
            nextAction: string | null;
            nextEventSeq: number;
            processGroupId: number | null;
            processLossRetryCount: number;
            processPid: number | null;
            processStartedAt: Date | null;
            responsibleUserId: string | null;
            resultJson: Record<string, unknown> | null;
            retryOfRunId: string | null;
            runnerInstanceId: string | null;
            runnerProfileJson: Record<string, unknown> | null;
            runtimeMode: string;
            runtimeModeReason: string | null;
            runtimeModeResolvedAt: Date | null;
            runtimeModeResolverVersion: string | null;
            scheduledRetryAt: Date | null;
            scheduledRetryAttempt: number;
            scheduledRetryReason: string | null;
            sessionIdAfter: string | null;
            sessionIdBefore: string | null;
            signal: string | null;
            startedAt: Date | null;
            status: string;
            stderrExcerpt: string | null;
            stdoutExcerpt: string | null;
            triggerDetail: string | null;
            updatedAt: Date;
            usageJson: Record<string, unknown> | null;
            wakeupRequestId: string | null;
        };
        dueAt: Date;
        attempt: number;
        maxAttempts: number;
    } | {
        outcome: "missing_run";
    } | {
        outcome: "missing_agent";
    }>;
    reconcileStrandedAssignedIssues: () => Promise<{
        assignmentDispatched: number;
        dispatchRequeued: number;
        continuationRequeued: number;
        dispositionRepairRequeued: number;
        productiveContinuationObserved: number;
        successfulContinuationObserved: number;
        orphanBlockersAssigned: number;
        successfulRunHandoffEscalated: number;
        reviewParticipantRequeued: number;
        escalated: number;
        waitingOnReviewResolved: number;
        providerQuotaMonitored: number;
        recentProgressExempted: number;
        operatorCancelExempted: number;
        onboardingFirstTaskExempted: number;
        skipped: number;
        issueIds: string[];
    }>;
    recoverPendingSessionGoalActions: () => Promise<{
        scanned: number;
        enqueued: number;
        alreadyQueued: number;
        invalid: number;
    }>;
    recoverActiveSessionGoals: () => Promise<{
        scanned: number;
        enqueued: number;
    }>;
    terminalizeRunOnLeaseRelease: (run: typeof heartbeatRuns.$inferSelect) => Promise<typeof heartbeatRuns.$inferSelect>;
    releaseEnvironmentLeasesForRun: (input: {
        runId: string;
        companyId: string;
        agentId: string;
        status: string | null | undefined;
        failureReason?: string | null;
        providerResourceDisposition?: ProviderResourceDisposition;
        nativeLifecycleTelemetry?: {
            provider: string;
            harness: string;
            lifecycleMode: "per_turn" | "warm";
            sandboxResource: "keep_running" | "stop_and_reuse" | "destroy_after_turn";
        };
    }) => Promise<void>;
    resumeRemoteStopComments: (run: typeof heartbeatRuns.$inferSelect, requestId?: string) => Promise<void>;
    resumeQueuedCommentInterrupt: (companyId: string, queueId: string, opts?: {
        retryCleanup?: boolean;
    }) => Promise<void>;
    resumeExecutionWaitComments: () => Promise<void>;
    sweepStaleIssueLocks: () => Promise<{
        cleared: number;
        issueIds: string[];
        terminalizedRunIds: string[];
    }>;
    reconcileResolvedDependencyWakes: (opts?: {
        runId?: string | null;
        companyId?: string | null;
    }) => Promise<{
        checked: number;
        healed: number;
        existingWakeSkipped: number;
        livePathSkipped: number;
        interactionSkipped: number;
        pauseHoldSkipped: number;
        notReadySkipped: number;
        candidateLimitSkipped: number;
        deferredOrFailed: number;
        enqueueFailed: number;
        issueIds: string[];
    }>;
    scanSilentActiveRuns: (opts?: {
        now?: Date;
        companyId?: string;
    }) => Promise<import("../modules/active-run-watchdog/index.js").ScanSilentActiveRunsResult>;
    reconcileTaskWatchdogs: (opts?: {
        companyId?: string | null;
        runId?: string | null;
    }) => Promise<{
        checked: number;
        triggered: number;
        live: number;
        pendingFirstRun: number;
        alreadyReviewed: number;
        skipped: number;
        watchdogIssueIds: string[];
    }>;
    buildRunOutputSilence: (run: Pick<typeof heartbeatRuns.$inferSelect, "id" | "companyId" | "status" | "lastOutputAt" | "lastOutputSeq" | "lastOutputStream" | "processStartedAt" | "startedAt" | "createdAt">, now?: Date) => Promise<import("./recovery/service.js").RunOutputSilenceSummary>;
    tickTimers: (now?: Date) => Promise<{
        checked: number;
        enqueued: number;
        skipped: number;
    }>;
    cancelRun: (runId: string, reason?: string, options?: {
        errorCode?: string;
        resultJson?: Record<string, unknown>;
        eventMessage?: string;
        eventPayload?: Record<string, unknown>;
        /** Per-call graceful process shutdown window, bounded to a safe range. */
        terminationGraceMs?: number;
        /** Caller is immediately scheduling an explicit successor path. */
        suppressImmediateRecovery?: boolean;
    }) => Promise<{
        id: string;
        companyId: string;
        agentId: string;
        invocationSource: string;
        triggerDetail: string | null;
        status: string;
        responsibleUserId: string | null;
        activeIdentityContextId: string | null;
        startedAt: Date | null;
        finishedAt: Date | null;
        executionControlDeadlineAt: Date | null;
        executionStatusDeliveryId: string | null;
        error: string | null;
        wakeupRequestId: string | null;
        exitCode: number | null;
        signal: string | null;
        usageJson: Record<string, unknown> | null;
        resultJson: Record<string, unknown> | null;
        runtimeMode: string;
        runtimeModeResolverVersion: string | null;
        runtimeModeReason: string | null;
        runtimeModeResolvedAt: Date | null;
        runnerProfileJson: Record<string, unknown> | null;
        runnerInstanceId: string | null;
        nativeSessionId: string | null;
        nativeIssueId: string | null;
        driverKind: string | null;
        driverVersion: string | null;
        completionContractId: string | null;
        completionContractSha256: string | null;
        nextEventSeq: number;
        nativePhase: string | null;
        nativePhaseUpdatedAt: Date | null;
        sessionIdBefore: string | null;
        sessionIdAfter: string | null;
        logStore: string | null;
        logRef: string | null;
        logBytes: number | null;
        logSha256: string | null;
        logCompressed: boolean;
        stdoutExcerpt: string | null;
        stderrExcerpt: string | null;
        errorCode: string | null;
        externalRunId: string | null;
        controllerBootId: string | null;
        controllerLeaseExpiresAt: Date | null;
        executionStage: string | null;
        processPid: number | null;
        processGroupId: number | null;
        processStartedAt: Date | null;
        lastOutputAt: Date | null;
        lastOutputSeq: number;
        lastOutputStream: string | null;
        lastOutputBytes: number | null;
        retryOfRunId: string | null;
        processLossRetryCount: number;
        scheduledRetryAt: Date | null;
        scheduledRetryAttempt: number;
        scheduledRetryReason: string | null;
        issueCommentStatus: string;
        issueCommentSatisfiedByCommentId: string | null;
        issueCommentRetryQueuedAt: Date | null;
        livenessState: string | null;
        livenessReason: string | null;
        continuationAttempt: number;
        lastUsefulActionAt: Date | null;
        nextAction: string | null;
        contextSnapshot: Record<string, unknown> | null;
        createdAt: Date;
        updatedAt: Date;
    } | {
        readonly id: string;
        readonly companyId: string;
        readonly agentId: string;
        readonly invocationSource: string;
        readonly triggerDetail: string | null;
        readonly status: string;
        readonly responsibleUserId: string | null;
        readonly activeIdentityContextId: string | null;
        readonly startedAt: Date | null;
        readonly finishedAt: Date | null;
        readonly executionControlDeadlineAt: Date | null;
        readonly executionStatusDeliveryId: string | null;
        readonly error: string | null;
        readonly wakeupRequestId: string | null;
        readonly exitCode: number | null;
        readonly signal: string | null;
        readonly usageJson: Record<string, unknown> | null;
        readonly runtimeMode: string;
        readonly runtimeModeResolverVersion: string | null;
        readonly runtimeModeReason: string | null;
        readonly runtimeModeResolvedAt: Date | null;
        readonly runnerProfileJson: Record<string, unknown> | null;
        readonly runnerInstanceId: string | null;
        readonly nativeSessionId: string | null;
        readonly nativeIssueId: string | null;
        readonly driverKind: string | null;
        readonly driverVersion: string | null;
        readonly completionContractId: string | null;
        readonly completionContractSha256: string | null;
        readonly nextEventSeq: number;
        readonly nativePhase: string | null;
        readonly nativePhaseUpdatedAt: Date | null;
        readonly sessionIdBefore: string | null;
        readonly sessionIdAfter: string | null;
        readonly logStore: string | null;
        readonly logRef: string | null;
        readonly logBytes: number | null;
        readonly logSha256: string | null;
        readonly logCompressed: boolean;
        readonly stdoutExcerpt: string | null;
        readonly stderrExcerpt: string | null;
        readonly errorCode: string | null;
        readonly externalRunId: string | null;
        readonly controllerBootId: string | null;
        readonly controllerLeaseExpiresAt: Date | null;
        readonly executionStage: string | null;
        readonly processPid: number | null;
        readonly processStartedAt: Date | null;
        readonly lastOutputAt: Date | null;
        readonly lastOutputSeq: number;
        readonly lastOutputStream: string | null;
        readonly lastOutputBytes: number | null;
        readonly retryOfRunId: string | null;
        readonly processLossRetryCount: number;
        readonly scheduledRetryAt: Date | null;
        readonly scheduledRetryAttempt: number;
        readonly scheduledRetryReason: string | null;
        readonly issueCommentStatus: string;
        readonly issueCommentSatisfiedByCommentId: string | null;
        readonly issueCommentRetryQueuedAt: Date | null;
        readonly livenessState: string | null;
        readonly livenessReason: string | null;
        readonly continuationAttempt: number;
        readonly lastUsefulActionAt: Date | null;
        readonly nextAction: string | null;
        readonly contextSnapshot: Record<string, unknown> | null;
        readonly createdAt: Date;
        readonly updatedAt: Date;
        readonly processGroupId: number | null;
        readonly resultJson: Record<string, unknown> | null;
    } | {
        readonly id: string;
        readonly companyId: string;
        readonly agentId: string;
        readonly invocationSource: string;
        readonly triggerDetail: string | null;
        readonly status: string;
        readonly responsibleUserId: string | null;
        readonly activeIdentityContextId: string | null;
        readonly startedAt: Date | null;
        readonly finishedAt: Date | null;
        readonly executionControlDeadlineAt: Date | null;
        readonly executionStatusDeliveryId: string | null;
        readonly wakeupRequestId: string | null;
        readonly exitCode: number | null;
        readonly signal: string | null;
        readonly usageJson: Record<string, unknown> | null;
        readonly runtimeMode: string;
        readonly runtimeModeResolverVersion: string | null;
        readonly runtimeModeReason: string | null;
        readonly runtimeModeResolvedAt: Date | null;
        readonly runnerProfileJson: Record<string, unknown> | null;
        readonly runnerInstanceId: string | null;
        readonly nativeSessionId: string | null;
        readonly nativeIssueId: string | null;
        readonly driverKind: string | null;
        readonly driverVersion: string | null;
        readonly completionContractId: string | null;
        readonly completionContractSha256: string | null;
        readonly nextEventSeq: number;
        readonly nativePhase: string | null;
        readonly nativePhaseUpdatedAt: Date | null;
        readonly sessionIdBefore: string | null;
        readonly sessionIdAfter: string | null;
        readonly logStore: string | null;
        readonly logRef: string | null;
        readonly logBytes: number | null;
        readonly logSha256: string | null;
        readonly logCompressed: boolean;
        readonly errorCode: string | null;
        readonly externalRunId: string | null;
        readonly controllerBootId: string | null;
        readonly controllerLeaseExpiresAt: Date | null;
        readonly executionStage: string | null;
        readonly processPid: number | null;
        readonly processStartedAt: Date | null;
        readonly lastOutputAt: Date | null;
        readonly lastOutputSeq: number;
        readonly lastOutputStream: string | null;
        readonly lastOutputBytes: number | null;
        readonly retryOfRunId: string | null;
        readonly processLossRetryCount: number;
        readonly scheduledRetryAt: Date | null;
        readonly scheduledRetryAttempt: number;
        readonly scheduledRetryReason: string | null;
        readonly issueCommentStatus: string;
        readonly issueCommentSatisfiedByCommentId: string | null;
        readonly issueCommentRetryQueuedAt: Date | null;
        readonly livenessState: string | null;
        readonly livenessReason: string | null;
        readonly continuationAttempt: number;
        readonly lastUsefulActionAt: Date | null;
        readonly nextAction: string | null;
        readonly contextSnapshot: Record<string, unknown> | null;
        readonly createdAt: Date;
        readonly updatedAt: Date;
        readonly processGroupId: number | null;
        readonly error: string | null;
        readonly resultJson: Record<string, unknown> | null;
        readonly stdoutExcerpt: string | null;
        readonly stderrExcerpt: string | null;
    }>;
    /**
     * Pause-only. Emits errorCode "agent_paused" unconditionally; its sole caller is the
     * agent pause route. For non-pause cancellations use cancelRun, or call the internal
     * cancelActiveForAgentInternal(agentId, reason, errorCode) with an explicit errorCode.
     */
    cancelActiveForAgent: (agentId: string, reason?: string) => Promise<number>;
    cancelInvocationsForAgents: (agentIds: string[], reason: string) => Promise<{
        agentIds: string[];
        runsCancelled: number;
        wakeupsCancelled: number;
    }>;
    cancelBudgetScopeWork: (scope: BudgetEnforcementScope) => Promise<void>;
    getRunIssueSummary: (runId: string) => Promise<{
        readonly id: string;
        readonly runtimeMode: string;
        readonly status: string;
        readonly invocationSource: string;
        readonly triggerDetail: string | null;
        readonly contextCommentId: string | null;
        readonly contextWakeCommentId: string | null;
        readonly startedAt: Date | null;
        readonly finishedAt: Date | null;
        readonly createdAt: Date;
        readonly agentId: string;
        readonly logBytes: number | null;
        readonly processStartedAt: Date | null;
        readonly livenessState: string | null;
        readonly livenessReason: string | null;
        readonly continuationAttempt: number;
        readonly lastUsefulActionAt: Date | null;
        readonly nextAction: string | null;
        readonly lastOutputAt: Date | null;
        readonly lastOutputSeq: number;
        readonly lastOutputStream: string | null;
        readonly lastOutputBytes: number | null;
        readonly issueId: string | null;
    }>;
    getActiveRunForAgent: (agentId: string) => Promise<{
        id: string;
        companyId: string;
        agentId: string;
        invocationSource: string;
        triggerDetail: string | null;
        status: string;
        responsibleUserId: string | null;
        activeIdentityContextId: string | null;
        startedAt: Date | null;
        finishedAt: Date | null;
        executionControlDeadlineAt: Date | null;
        executionStatusDeliveryId: string | null;
        error: string | null;
        wakeupRequestId: string | null;
        exitCode: number | null;
        signal: string | null;
        usageJson: Record<string, unknown> | null;
        resultJson: Record<string, unknown> | null;
        runtimeMode: string;
        runtimeModeResolverVersion: string | null;
        runtimeModeReason: string | null;
        runtimeModeResolvedAt: Date | null;
        runnerProfileJson: Record<string, unknown> | null;
        runnerInstanceId: string | null;
        nativeSessionId: string | null;
        nativeIssueId: string | null;
        driverKind: string | null;
        driverVersion: string | null;
        completionContractId: string | null;
        completionContractSha256: string | null;
        nextEventSeq: number;
        nativePhase: string | null;
        nativePhaseUpdatedAt: Date | null;
        sessionIdBefore: string | null;
        sessionIdAfter: string | null;
        logStore: string | null;
        logRef: string | null;
        logBytes: number | null;
        logSha256: string | null;
        logCompressed: boolean;
        stdoutExcerpt: string | null;
        stderrExcerpt: string | null;
        errorCode: string | null;
        externalRunId: string | null;
        controllerBootId: string | null;
        controllerLeaseExpiresAt: Date | null;
        executionStage: string | null;
        processPid: number | null;
        processGroupId: number | null;
        processStartedAt: Date | null;
        lastOutputAt: Date | null;
        lastOutputSeq: number;
        lastOutputStream: string | null;
        lastOutputBytes: number | null;
        retryOfRunId: string | null;
        processLossRetryCount: number;
        scheduledRetryAt: Date | null;
        scheduledRetryAttempt: number;
        scheduledRetryReason: string | null;
        issueCommentStatus: string;
        issueCommentSatisfiedByCommentId: string | null;
        issueCommentRetryQueuedAt: Date | null;
        livenessState: string | null;
        livenessReason: string | null;
        continuationAttempt: number;
        lastUsefulActionAt: Date | null;
        nextAction: string | null;
        contextSnapshot: Record<string, unknown> | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getActiveRunIssueSummaryForAgent: (agentId: string) => Promise<{
        readonly id: string;
        readonly runtimeMode: string;
        readonly status: string;
        readonly invocationSource: string;
        readonly triggerDetail: string | null;
        readonly contextCommentId: string | null;
        readonly contextWakeCommentId: string | null;
        readonly startedAt: Date | null;
        readonly finishedAt: Date | null;
        readonly createdAt: Date;
        readonly agentId: string;
        readonly logBytes: number | null;
        readonly processStartedAt: Date | null;
        readonly livenessState: string | null;
        readonly livenessReason: string | null;
        readonly continuationAttempt: number;
        readonly lastUsefulActionAt: Date | null;
        readonly nextAction: string | null;
        readonly lastOutputAt: Date | null;
        readonly lastOutputSeq: number;
        readonly lastOutputStream: string | null;
        readonly lastOutputBytes: number | null;
        readonly issueId: string | null;
    }>;
};
//# sourceMappingURL=heartbeat.d.ts.map