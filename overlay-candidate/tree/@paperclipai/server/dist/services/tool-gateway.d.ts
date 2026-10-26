import type { Db } from "@paperclipai/db";
import { connectionGrants } from "@paperclipai/db";
import type { ToolRunContext } from "@paperclipai/plugin-sdk";
import type { CreateToolMcpGateway, CreateToolMcpGatewayToken, DeploymentExposure, DeploymentMode, ToolConnectionTestCallStatus, ToolMcpGatewayToken, ToolMcpGatewayTokenAction, ToolMcpGatewayTokenCreated, ToolMcpGatewayWithTokens, UpdateToolMcpGateway } from "@paperclipai/shared";
import type { AgentToolDescriptor, PluginToolDispatcher } from "./plugin-tool-dispatcher.js";
import { type LogActivityInput } from "./activity-log.js";
import { type ToolRuntimeSupervisorOptions, type ToolRuntimeSlotView } from "./tool-runtime-supervisor.js";
import type { ComposioClient } from "./composio.js";
import { type PaperclipCloudConnector } from "./paperclip-cloud-connector.js";
import { type VercelConnectClient } from "./vercel-connect.js";
export declare function resolveCredentialGrantKind(policy: "shared" | "per_user" | "per_user_with_fallback" | "per_agent", actingUserId: string | null, hasUserGrant: boolean): "organization" | "user" | "user_authorization_required";
export declare function isConnectionGrantAudienceAllowed(memberUserIds: string[], actingUserId: string | null, actingUserIsActiveMember: boolean): boolean;
type McpGatewayRateLimitConfig = {
    windowMs: number;
    max: number;
};
export type ToolGatewayProviderType = "mcp_http_fixture" | "mcp_stdio_fixture" | "mcp_remote_http" | "mcp_local_stdio" | "paperclip_self" | "paperclip_plugin" | "paperclip_virtual";
export interface ConnectedMcpGatewayMetadata {
    applicationId: string;
    applicationKey: string | null;
    applicationDisplayName: string;
    connectionId: string;
    catalogEntryId: string;
    transport: "mcp_remote" | "local_stdio";
    gatewayToolName: string;
    upstreamToolName: string;
    catalogName: string;
    inputSchema: Record<string, unknown>;
    outputSchema: Record<string, unknown> | null;
    annotations: Record<string, unknown>;
    risk: {
        level: string;
        isReadOnly: boolean;
        isWrite: boolean;
        isDestructive: boolean;
    };
    onDemandTools?: boolean;
}
export interface ToolGatewayDescriptor extends AgentToolDescriptor {
    providerType: ToolGatewayProviderType;
    risk: "read" | "write" | "destructive";
    applicationId?: string | null;
    applicationKey?: string | null;
    applicationDisplayName?: string | null;
    connectionId?: string | null;
    catalogEntryId?: string | null;
    upstreamToolName?: string | null;
    providerMetadata?: ConnectedMcpGatewayMetadata | Record<string, unknown>;
}
export interface ToolGatewaySession {
    id: string;
    token: string;
    companyId: string;
    agentId: string | null;
    runId: string | null;
    issueId: string | null;
    projectId: string | null;
    gatewayId?: string | null;
    gatewayPublicId?: string | null;
    gatewayName?: string | null;
    gatewayProfileId?: string | null;
    gatewayTokenId?: string | null;
    gatewayTokenAllowedActions?: ToolMcpGatewayTokenAction[];
    actorType?: "agent" | "user" | "system" | "plugin";
    actorId?: string | null;
    /** Human whose personal connection grant applies to this execution. */
    responsibleUserId?: string | null;
    /** Captured by the controller for this request, never accepted from tool arguments. */
    identityContextId?: string | null;
    createdAt: Date;
    expiresAt: Date;
}
export type ToolGatewayRuntimeSlot = ToolRuntimeSlotView;
export declare class ToolGatewayHttpError extends Error {
    readonly status: number;
    readonly reasonCode: string;
    readonly details: Record<string, unknown>;
    constructor(status: number, message: string, reasonCode: string, details?: Record<string, unknown>);
}
interface ExecuteGatewayToolInput {
    sessionToken: string;
    gatewayId?: string | null;
    gatewayPublicId?: string | null;
    tool: string;
    parameters?: unknown;
    timeoutMs?: number;
    approvedActionRequestId?: string | null;
    idempotencyKey?: string | null;
    callerHeaders?: Record<string, string | string[] | undefined>;
}
interface ExecuteTestCallInput {
    companyId: string;
    connectionId: string;
    agentId: string;
    userId: string;
    toolName: string;
    parameters?: unknown;
    timeoutMs?: number;
}
interface ExecutePluginToolInput {
    actor: {
        type: "agent" | "board";
        agentId?: string | null;
        companyId?: string | null;
        userId?: string | null;
        runId?: string | null;
    };
    tool: string;
    parameters: unknown;
    runContext: ToolRunContext;
}
export declare function createToolGatewayService(db: Db, options?: {
    pluginToolDispatcher?: PluginToolDispatcher;
    deploymentMode?: DeploymentMode;
    deploymentExposure?: DeploymentExposure;
    trustedLocalStdioRuntimeHost?: string | null;
    runtimeSupervisor?: ToolRuntimeSupervisorOptions;
    toolActionSigningSecret?: string;
    onToolActionSettled?: (actionRequestId: string) => Promise<unknown>;
    /** Test seam for deterministic remote MCP protocol fixtures. */
    remoteHttpRequest?: (url: string, init: RequestInit) => Promise<Response>;
    /** Test seam for Composio session creation without vendor traffic. */
    composioClientFactory?: (apiKey: string) => ComposioClient;
    /** Test seam for refreshing personal Gmail grants. */
    paperclipCloudConnector?: PaperclipCloudConnector | null;
    /** @deprecated Use paperclipCloudConnector. */
    paperclipIdGmailConnector?: PaperclipCloudConnector | null;
    /** Refreshes customer-owned/DCR OAuth grants before remote MCP execution. */
    oauthGrantRefresher?: (input: {
        companyId: string;
        connectionId: string;
        grantId: string;
        forceRefresh?: boolean;
        actor?: {
            actorType?: "agent" | "user" | "system" | "plugin";
            actorId?: string | null;
        };
        issueId?: string | null;
        heartbeatRunId?: string | null;
    }) => Promise<typeof connectionGrants.$inferSelect>;
    /** Test seam for resolving Vercel Connect credentials. */
    vercelConnectClient?: VercelConnectClient | null;
    /** Test seam for reproducing the managed-argument drift expiry race. */
    beforeManagedArgumentDriftExpiry?: () => Promise<void>;
    /** Test seam for pausing a legacy approved request before its execution claim. */
    beforeLegacyApprovedActionClaim?: () => Promise<void>;
    mcpGatewayProtocolLimits?: Partial<{
        authFailures: Partial<McpGatewayRateLimitConfig>;
        gatewayRequests: Partial<McpGatewayRateLimitConfig>;
        tokenRequests: Partial<McpGatewayRateLimitConfig>;
        sessionSetup: Partial<McpGatewayRateLimitConfig>;
    }>;
    now?: () => number;
}): {
    recordRuntimeMcpDeliveryDiagnostic(input: {
        companyId: string;
        agentId: string;
        runId: string;
        permittedNotInstalledConnections: Array<{
            id: string;
            name: string;
        }>;
    }): Promise<void>;
    listNamedGateways(companyId: string): Promise<ToolMcpGatewayWithTokens[]>;
    createNamedGateway(input: {
        companyId: string;
        body: CreateToolMcpGateway;
        actor?: {
            agentId?: string | null;
            userId?: string | null;
        };
    }): Promise<ToolMcpGatewayWithTokens>;
    updateNamedGateway(input: {
        companyId: string;
        gatewayId: string;
        body: UpdateToolMcpGateway;
    }): Promise<ToolMcpGatewayWithTokens>;
    createNamedGatewayToken(input: {
        companyId: string;
        gatewayId: string;
        body: CreateToolMcpGatewayToken;
        actor?: {
            agentId?: string | null;
            userId?: string | null;
        };
    }): Promise<ToolMcpGatewayTokenCreated>;
    revokeNamedGatewayToken(input: {
        companyId: string;
        tokenId: string;
        revokedAt?: Date;
    }): Promise<ToolMcpGatewayToken>;
    initializeNamedGatewayProtocol(input: {
        gatewayId?: string | null;
        gatewayPublicId?: string | null;
        bearerToken: string;
        callerHeaders?: Record<string, string | string[] | undefined>;
    }): Promise<ToolGatewaySession>;
    listToolsForNamedGateway(input: {
        gatewayId?: string | null;
        gatewayPublicId?: string | null;
        bearerToken: string;
        callerHeaders?: Record<string, string | string[] | undefined>;
    }): Promise<ToolGatewayDescriptor[]>;
    executeContextForNamedGateway(input: {
        gatewayId?: string | null;
        gatewayPublicId?: string | null;
        bearerToken: string;
        method: "resources/list" | "resources/read" | "prompts/list" | "prompts/get";
        params?: Record<string, unknown>;
        callerHeaders?: Record<string, string | string[] | undefined>;
    }): Promise<Record<string, unknown>>;
    createSession(input: {
        companyId: string;
        agentId: string;
        runId: string;
        issueId?: string | null;
        projectId?: string | null;
        ttlMs?: number;
        actorType?: LogActivityInput["actorType"];
        actorId?: string;
    }): Promise<ToolGatewaySession>;
    listToolsForSession(sessionToken: string): Promise<ToolGatewayDescriptor[]>;
    listPluginToolsForAgent(input: {
        companyId: string;
        agentId: string;
    }): Promise<AgentToolDescriptor[]>;
    summarizeConnectionAccessForAgent(input: {
        companyId: string;
        connectionId: string;
        agentId: string;
    }): Promise<{
        connectionId: string;
        toolCount: number;
        allowedCount: number;
        askFirstCount: number;
        offCount: number;
        lastChangedAt: string | null;
        lastChangedByAgentId: string | null;
        lastChangedByName: string | null;
        tools: {
            toolName: string;
            gatewayToolName: string;
            displayName: string;
            risk: "destructive" | "read" | "write";
            decision: string;
            reasonCode: import("@paperclipai/shared").ToolAccessReasonCode;
            matchedPolicyIds: string[];
        }[];
    }>;
    executeTestCall(input: ExecuteTestCallInput): Promise<{
        decision: "allowed";
        invocationId: string;
        result: unknown;
    } | {
        decision: "allowed";
        invocationId: string;
        error: {
            message: string;
            reasonCode: string;
        };
    } | {
        decision: "ask_first";
        invocationId: string;
        actionRequestId: string;
        error?: undefined;
    } | {
        actionRequestId?: undefined;
        decision: "off";
        invocationId: string;
        error: {
            message: string;
            reasonCode: import("@paperclipai/shared").ToolAccessReasonCode;
        };
    }>;
    /**
     * Live status of an ask-first test call, polled by the Test tab panel.
     * Scoped to the connection the panel is bound to and to test-origin
     * requests only, so it can't be used to read arbitrary action requests.
     */
    getTestCallStatus(input: {
        companyId: string;
        connectionId: string;
        actionRequestId: string;
    }): Promise<ToolConnectionTestCallStatus>;
    sweepActionReviews(): Promise<{
        scanned: number;
    }>;
    approveActionRequest(input: {
        companyId: string;
        rememberAction?: boolean;
        issueId?: string;
        interactionId?: string;
        actionRequestId: string;
        actor: {
            agentId?: string | null;
            userId?: string | null;
        };
    }): Promise<{
        approvalId: string | null;
        canonicalArgumentsHash: string;
        canonicalArgumentsSummary: import("@paperclipai/shared").ToolRedactedValueSummary;
        companyId: string;
        createdAt: Date;
        decidedAt: Date | null;
        decidedByAgentId: string | null;
        decidedByUserId: string | null;
        expiresAt: Date | null;
        id: string;
        interactionId: string | null;
        invocationId: string;
        issueId: string | null;
        previewMarkdown: string | null;
        requestedByAgentId: string | null;
        requestedByUserId: string | null;
        resolvedAt: Date | null;
        resolvedByAgentId: string | null;
        resolvedByUserId: string | null;
        signedArguments: string | null;
        status: "approved" | "cancelled" | "executed" | "executing" | "expired" | "failed" | "pending" | "rejected";
        updatedAt: Date;
    }>;
    declineActionRequest(input: {
        companyId: string;
        issueId?: string;
        interactionId?: string;
        actionRequestId: string;
        reason?: string;
        actor: {
            agentId?: string | null;
            userId?: string | null;
        };
    }): Promise<{
        id: string;
        companyId: string;
        invocationId: string;
        issueId: string | null;
        interactionId: string | null;
        approvalId: string | null;
        status: "approved" | "cancelled" | "executed" | "executing" | "expired" | "failed" | "pending" | "rejected";
        canonicalArgumentsHash: string;
        canonicalArgumentsSummary: import("@paperclipai/shared").ToolRedactedValueSummary;
        signedArguments: string | null;
        previewMarkdown: string | null;
        requestedByAgentId: string | null;
        requestedByUserId: string | null;
        resolvedByAgentId: string | null;
        resolvedByUserId: string | null;
        decidedByAgentId: string | null;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        expiresAt: Date | null;
        resolvedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    executeTool(input: ExecuteGatewayToolInput): Promise<{
        invocationId: string;
        status: "completed";
        tool: string;
        result: unknown;
        targetTool?: undefined;
    } | {
        invocationId: string;
        status: "replayed";
        tool: string;
        targetTool: string | undefined;
        result: unknown;
    } | {
        invocationId: string;
        status: "replayed";
        tool: string;
        result: import("@paperclipai/shared").ToolRedactedValueSummary | null;
        targetTool?: undefined;
    } | {
        invocationId: string;
        status: "completed";
        tool: string;
        targetTool: string | undefined;
        result: unknown;
    }>;
    executePluginTool(input: ExecutePluginToolInput): Promise<import("./plugin-tool-registry.js").ToolExecutionResult | import("@paperclipai/shared").ToolRedactedValueSummary | null>;
    revokeSession(input: {
        companyId: string;
        sessionId: string;
        revokedAt?: Date;
        actor?: {
            actorType?: LogActivityInput["actorType"];
            actorId?: string;
            agentId?: string | null;
            runId?: string | null;
        };
        agentScope?: {
            agentId: string;
            runId?: string | null;
        } | null;
    }): Promise<{
        id: string;
        token: string;
        companyId: string;
        agentId: string | null;
        runId: string | null;
        issueId: string | null;
        projectId: string | null;
        gatewayId?: string | null;
        gatewayPublicId?: string | null;
        gatewayName?: string | null;
        gatewayProfileId?: string | null;
        gatewayTokenId?: string | null;
        gatewayTokenAllowedActions?: ToolMcpGatewayTokenAction[];
        actorType?: "agent" | "user" | "system" | "plugin";
        actorId?: string | null;
        /** Human whose personal connection grant applies to this execution. */
        responsibleUserId?: string | null;
        /** Captured by the controller for this request, never accepted from tool arguments. */
        identityContextId?: string | null;
        createdAt: Date;
        expiresAt: Date;
        revokedAt: Date;
    }>;
    cleanupExpiredSessions(input?: {
        now?: Date;
    }): Promise<{
        deletedCount: number;
    }>;
    listRuntimeSlots(companyId?: string): Promise<ToolRuntimeSlotView[]>;
    stopRuntimeSlot(input: {
        companyId: string;
        slotId: string;
        actor?: {
            agentId?: string | null;
            runId?: string | null;
        };
    }): Promise<ToolRuntimeSlotView>;
    restartRuntimeSlot(input: {
        companyId: string;
        slotId: string;
        actor?: {
            agentId?: string | null;
            runId?: string | null;
        };
    }): Promise<ToolRuntimeSlotView>;
};
export type ToolGatewayService = ReturnType<typeof createToolGatewayService>;
export {};
//# sourceMappingURL=tool-gateway.d.ts.map