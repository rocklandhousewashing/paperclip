import { z } from "zod";
export declare const toolApplicationTypeSchema: z.ZodEnum<{
    a2a: "a2a";
    chat: "chat";
    mcp_http: "mcp_http";
    mcp_stdio: "mcp_stdio";
    paperclip_plugin: "paperclip_plugin";
}>;
export declare const toolApplicationStatusSchema: z.ZodEnum<{
    active: "active";
    archived: "archived";
    disabled: "disabled";
    draft: "draft";
}>;
export declare const toolConnectionTransportSchema: z.ZodEnum<{
    chat_sdk: "chat_sdk";
    local_stdio: "local_stdio";
    mcp_remote: "mcp_remote";
    rest_api: "rest_api";
}>;
export declare const toolConnectionPurposeSchema: z.ZodEnum<{
    channel: "channel";
    tool: "tool";
}>;
export declare const toolConnectionAuthKindSchema: z.ZodEnum<{
    api_key: "api_key";
    none: "none";
    oauth: "oauth";
}>;
export declare const toolConnectionOwnershipSchema: z.ZodEnum<{
    customer: "customer";
    dcr: "dcr";
    platform_provisioned: "platform_provisioned";
    platform_shared: "platform_shared";
}>;
export declare const toolConnectionCredentialSourceSchema: z.ZodEnum<{
    paperclip_vault: "paperclip_vault";
    vercel_connect: "vercel_connect";
}>;
export declare const vercelConnectCredentialSummarySchema: z.ZodObject<{
    provider: z.ZodLiteral<"vercel_connect">;
    connectorId: z.ZodString;
    connectorUid: z.ZodString;
    service: z.ZodString;
    connectorType: z.ZodString;
    principalMode: z.ZodEnum<{
        app: "app";
        user: "user";
    }>;
    headerName: z.ZodString;
    headerPrefix: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    scopes: z.ZodArray<z.ZodString>;
}, z.core.$strict>;
export declare const vercelConnectGrantSummarySchema: z.ZodObject<{
    provider: z.ZodLiteral<"vercel_connect">;
    subjectType: z.ZodEnum<{
        app: "app";
        user: "user";
    }>;
    installationId: z.ZodOptional<z.ZodString>;
    tenantId: z.ZodOptional<z.ZodString>;
    tokenId: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodString>;
    lastVerifiedAt: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const connectionGrantKindSchema: z.ZodEnum<{
    agent: "agent";
    organization: "organization";
    user: "user";
}>;
export declare const connectionGrantStatusSchema: z.ZodEnum<{
    active: "active";
    expired: "expired";
    needs_reauthorization: "needs_reauthorization";
    revoked: "revoked";
}>;
export declare const createConnectionGrantDelegationSchema: z.ZodObject<{
    agentId: z.ZodString;
}, z.core.$strip>;
export type CreateConnectionGrantDelegation = z.infer<typeof createConnectionGrantDelegationSchema>;
export declare const toolConnectionCredentialPolicySchema: z.ZodEnum<{
    per_agent: "per_agent";
    per_user: "per_user";
    per_user_with_fallback: "per_user_with_fallback";
    shared: "shared";
}>;
export declare const toolConnectionStatusSchema: z.ZodEnum<{
    active: "active";
    archived: "archived";
    disabled: "disabled";
    draft: "draft";
}>;
export declare const toolConnectionInstallTargetTypeSchema: z.ZodEnum<{
    agent: "agent";
    company: "company";
}>;
export declare const toolCredentialPlacementSchema: z.ZodEnum<{
    env: "env";
    header: "header";
    url: "url";
}>;
export declare const toolConnectionKindSchema: z.ZodEnum<{
    managed: "managed";
}>;
export declare const toolConnectionHealthStatusSchema: z.ZodEnum<{
    degraded: "degraded";
    error: "error";
    failed: "failed";
    healthy: "healthy";
    missing_secret: "missing_secret";
    ok: "ok";
    unchecked: "unchecked";
    unknown: "unknown";
}>;
export declare const toolCatalogEntryKindSchema: z.ZodEnum<{
    prompt: "prompt";
    resource: "resource";
    tool: "tool";
}>;
export declare const toolCatalogEntryStatusSchema: z.ZodEnum<{
    active: "active";
    disabled: "disabled";
    quarantined: "quarantined";
    removed: "removed";
}>;
export declare const toolRiskLevelSchema: z.ZodEnum<{
    critical: "critical";
    destructive: "destructive";
    high: "high";
    low: "low";
    medium: "medium";
    read: "read";
    write: "write";
}>;
export declare const toolProfileStatusSchema: z.ZodEnum<{
    active: "active";
    archived: "archived";
    disabled: "disabled";
    draft: "draft";
}>;
export declare const toolProfileDefaultActionSchema: z.ZodEnum<{
    allow: "allow";
    deny: "deny";
}>;
export declare const toolProfileEntrySelectorTypeSchema: z.ZodEnum<{
    application: "application";
    catalog_entry: "catalog_entry";
    connection: "connection";
    risk_level: "risk_level";
    tool_name: "tool_name";
}>;
export declare const toolProfileEntryEffectSchema: z.ZodEnum<{
    exclude: "exclude";
    include: "include";
}>;
export declare const toolProfileBindingTargetTypeSchema: z.ZodEnum<{
    agent: "agent";
    company: "company";
    gateway: "gateway";
    issue: "issue";
    project: "project";
    routine: "routine";
}>;
export declare const toolPolicyTypeSchema: z.ZodEnum<{
    allow: "allow";
    block: "block";
    rate_limit: "rate_limit";
    require_approval: "require_approval";
    trust_rule: "trust_rule";
}>;
export declare const toolPolicyDecisionSchema: z.ZodEnum<{
    allow: "allow";
    defer_runtime: "defer_runtime";
    deny: "deny";
    rate_limited: "rate_limited";
    require_approval: "require_approval";
}>;
export declare const toolInvocationStatusSchema: z.ZodEnum<{
    authorized: "authorized";
    awaiting_approval: "awaiting_approval";
    cancelled: "cancelled";
    denied: "denied";
    executing: "executing";
    failed: "failed";
    pending: "pending";
    rate_limited: "rate_limited";
    succeeded: "succeeded";
    timed_out: "timed_out";
}>;
export declare const toolInvocationApprovalStateSchema: z.ZodEnum<{
    approved: "approved";
    expired: "expired";
    not_required: "not_required";
    pending: "pending";
    rejected: "rejected";
    required: "required";
}>;
export declare const toolMcpGatewayStatusSchema: z.ZodEnum<{
    active: "active";
    archived: "archived";
    disabled: "disabled";
    draft: "draft";
}>;
export declare const toolMcpGatewayDefaultProfileModeSchema: z.ZodEnum<{
    gateway_only: "gateway_only";
    gateway_then_context: "gateway_then_context";
    inherit_context_then_gateway: "inherit_context_then_gateway";
}>;
export declare const toolMcpGatewayContextScopeTypeSchema: z.ZodEnum<{
    agent: "agent";
    company: "company";
    issue: "issue";
    none: "none";
    project: "project";
    routine: "routine";
}>;
export declare const toolMcpGatewayTokenSubjectTypeSchema: z.ZodEnum<{
    agent: "agent";
    board_user: "board_user";
    gateway_client: "gateway_client";
    heartbeat_run: "heartbeat_run";
}>;
export declare const toolMcpGatewayTokenActionSchema: z.ZodEnum<{
    "prompts/get": "prompts/get";
    "prompts/list": "prompts/list";
    "resources/list": "resources/list";
    "resources/read": "resources/read";
    "tools/call": "tools/call";
    "tools/list": "tools/list";
}>;
export declare const toolActionRequestStatusSchema: z.ZodEnum<{
    approved: "approved";
    cancelled: "cancelled";
    executed: "executed";
    executing: "executing";
    expired: "expired";
    failed: "failed";
    pending: "pending";
    rejected: "rejected";
}>;
export declare const toolAuditEventTypeSchema: z.ZodEnum<{
    approval_requested: "approval_requested";
    approval_resolved: "approval_resolved";
    call_completed: "call_completed";
    call_denied: "call_denied";
    call_failed: "call_failed";
    call_started: "call_started";
    discovery: "discovery";
    invocation_created: "invocation_created";
    policy_decision: "policy_decision";
    rate_limited: "rate_limited";
    runtime_started: "runtime_started";
    runtime_stopped: "runtime_stopped";
    session_revoked: "session_revoked";
    trust_rule_created: "trust_rule_created";
    trust_rule_revoked: "trust_rule_revoked";
    trust_rule_used: "trust_rule_used";
}>;
export declare const toolAuditOutcomeSchema: z.ZodEnum<{
    cancelled: "cancelled";
    denied: "denied";
    failure: "failure";
    pending: "pending";
    success: "success";
    timeout: "timeout";
}>;
export declare const toolRuntimeKindSchema: z.ZodEnum<{
    local_stdio: "local_stdio";
    remote_session: "remote_session";
}>;
export declare const toolRuntimeSlotStatusSchema: z.ZodEnum<{
    disabled: "disabled";
    error: "error";
    failed: "failed";
    idle: "idle";
    running: "running";
    starting: "starting";
    stopped: "stopped";
}>;
export declare const toolRateLimitWindowKindSchema: z.ZodEnum<{
    day: "day";
    hour: "hour";
    minute: "minute";
    month: "month";
}>;
export declare const toolCredentialSecretRefSchema: z.ZodObject<{
    secretId: z.ZodString;
    versionSelector: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"latest">, z.ZodNumber]>>;
    configPath: z.ZodString;
    required: z.ZodOptional<z.ZodBoolean>;
    label: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    projectionClass: z.ZodOptional<z.ZodEnum<{
        class_3_static_lease: "class_3_static_lease";
        unclassified: "unclassified";
    }>>;
    projectionAllowlistKey: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    keyScope: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const mcpConnectionCredentialRefSchema: z.ZodObject<{
    name: z.ZodString;
    secretId: z.ZodString;
    version: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"latest">, z.ZodNumber]>>;
    placement: z.ZodEnum<{
        env: "env";
        header: "header";
        url: "url";
    }>;
    key: z.ZodString;
    prefix: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const toolTransportConfigSchema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
export declare const toolRedactedValueSummarySchema: z.ZodObject<{
    summary: z.ZodString;
    sizeBytes: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    sha256: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    redactedFields: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString>>>;
    artifactId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const createToolApplicationSchema: z.ZodObject<{
    applicationKey: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    type: z.ZodEnum<{
        a2a: "a2a";
        chat: "chat";
        mcp_http: "mcp_http";
        mcp_stdio: "mcp_stdio";
        paperclip_plugin: "paperclip_plugin";
    }>;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        archived: "archived";
        disabled: "disabled";
        draft: "draft";
    }>>;
    pluginId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    ownerAgentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    ownerUserId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export type CreateToolApplication = z.infer<typeof createToolApplicationSchema>;
export declare const updateToolApplicationSchema: z.ZodObject<{
    applicationKey: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    type: z.ZodOptional<z.ZodEnum<{
        a2a: "a2a";
        chat: "chat";
        mcp_http: "mcp_http";
        mcp_stdio: "mcp_stdio";
        paperclip_plugin: "paperclip_plugin";
    }>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        active: "active";
        archived: "archived";
        disabled: "disabled";
        draft: "draft";
    }>>>;
    pluginId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    ownerAgentId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    ownerUserId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    metadata: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>>;
}, z.core.$strip>;
export type UpdateToolApplication = z.infer<typeof updateToolApplicationSchema>;
export declare const createToolConnectionSchema: z.ZodObject<{
    applicationId: z.ZodOptional<z.ZodString>;
    applicationName: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    connectionPurpose: z.ZodDefault<z.ZodEnum<{
        channel: "channel";
        tool: "tool";
    }>>;
    transport: z.ZodOptional<z.ZodEnum<{
        chat_sdk: "chat_sdk";
        local_stdio: "local_stdio";
        mcp_remote: "mcp_remote";
        rest_api: "rest_api";
    }>>;
    authKind: z.ZodDefault<z.ZodEnum<{
        api_key: "api_key";
        none: "none";
        oauth: "oauth";
    }>>;
    credentialPolicy: z.ZodOptional<z.ZodEnum<{
        per_agent: "per_agent";
        per_user: "per_user";
        per_user_with_fallback: "per_user_with_fallback";
        shared: "shared";
    }>>;
    ownership: z.ZodDefault<z.ZodEnum<{
        customer: "customer";
        dcr: "dcr";
        platform_provisioned: "platform_provisioned";
        platform_shared: "platform_shared";
    }>>;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        archived: "archived";
        disabled: "disabled";
        draft: "draft";
    }>>;
    connectionKind: z.ZodDefault<z.ZodEnum<{
        managed: "managed";
    }>>;
    config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    transportConfig: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    credentialRefs: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        secretId: z.ZodString;
        version: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"latest">, z.ZodNumber]>>;
        placement: z.ZodEnum<{
            env: "env";
            header: "header";
            url: "url";
        }>;
        key: z.ZodString;
        prefix: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>>;
    credentialSecretRefs: z.ZodDefault<z.ZodArray<z.ZodObject<{
        secretId: z.ZodString;
        versionSelector: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"latest">, z.ZodNumber]>>;
        configPath: z.ZodString;
        required: z.ZodOptional<z.ZodBoolean>;
        label: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        projectionClass: z.ZodOptional<z.ZodEnum<{
            class_3_static_lease: "class_3_static_lease";
            unclassified: "unclassified";
        }>>;
        projectionAllowlistKey: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        keyScope: z.ZodOptional<z.ZodString>;
        expiresAt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    enabled: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type CreateToolConnection = z.infer<typeof createToolConnectionSchema>;
export declare const updateToolConnectionSchema: z.ZodObject<{
    applicationName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    name: z.ZodOptional<z.ZodString>;
    connectionPurpose: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        channel: "channel";
        tool: "tool";
    }>>>;
    transport: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        chat_sdk: "chat_sdk";
        local_stdio: "local_stdio";
        mcp_remote: "mcp_remote";
        rest_api: "rest_api";
    }>>>;
    authKind: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        api_key: "api_key";
        none: "none";
        oauth: "oauth";
    }>>>;
    credentialPolicy: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        per_agent: "per_agent";
        per_user: "per_user";
        per_user_with_fallback: "per_user_with_fallback";
        shared: "shared";
    }>>>;
    ownership: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        customer: "customer";
        dcr: "dcr";
        platform_provisioned: "platform_provisioned";
        platform_shared: "platform_shared";
    }>>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        active: "active";
        archived: "archived";
        disabled: "disabled";
        draft: "draft";
    }>>>;
    connectionKind: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        managed: "managed";
    }>>>;
    config: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    transportConfig: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    credentialRefs: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        secretId: z.ZodString;
        version: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"latest">, z.ZodNumber]>>;
        placement: z.ZodEnum<{
            env: "env";
            header: "header";
            url: "url";
        }>;
        key: z.ZodString;
        prefix: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>>>;
    credentialSecretRefs: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodObject<{
        secretId: z.ZodString;
        versionSelector: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"latest">, z.ZodNumber]>>;
        configPath: z.ZodString;
        required: z.ZodOptional<z.ZodBoolean>;
        label: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        projectionClass: z.ZodOptional<z.ZodEnum<{
            class_3_static_lease: "class_3_static_lease";
            unclassified: "unclassified";
        }>>;
        projectionAllowlistKey: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        keyScope: z.ZodOptional<z.ZodString>;
        expiresAt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>>;
    enabled: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export type UpdateToolConnection = z.infer<typeof updateToolConnectionSchema>;
export declare const connectionGrantSchema: z.ZodObject<{
    id: z.ZodString;
    companyId: z.ZodString;
    connectionId: z.ZodString;
    kind: z.ZodEnum<{
        agent: "agent";
        organization: "organization";
        user: "user";
    }>;
    subjectUserId: z.ZodNullable<z.ZodString>;
    subjectAgentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    providerTenant: z.ZodNullable<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        externalId: z.ZodOptional<z.ZodString>;
        oauth: z.ZodOptional<z.ZodObject<{
            strategy: z.ZodOptional<z.ZodString>;
            accessTokenExpiresAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            scopes: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tokenType: z.ZodOptional<z.ZodString>;
            refreshTokenExpiresAt: z.ZodOptional<z.ZodString>;
            refreshedAt: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        github: z.ZodOptional<z.ZodObject<{
            userId: z.ZodString;
            login: z.ZodString;
            avatarUrl: z.ZodOptional<z.ZodString>;
            installationCount: z.ZodNumber;
            repositoryCount: z.ZodNumber;
            repositorySelection: z.ZodEnum<{
                all: "all";
                mixed: "mixed";
                none: "none";
                selected: "selected";
            }>;
            installationIds: z.ZodArray<z.ZodString>;
            installationOwnerLogins: z.ZodArray<z.ZodString>;
            installationUrl: z.ZodOptional<z.ZodString>;
            managementUrl: z.ZodOptional<z.ZodString>;
            appSlug: z.ZodOptional<z.ZodString>;
            lastAccessRefreshAt: z.ZodOptional<z.ZodString>;
            lastWebhookAt: z.ZodOptional<z.ZodString>;
            webhookHealth: z.ZodOptional<z.ZodEnum<{
                healthy: "healthy";
                pending: "pending";
                unhealthy: "unhealthy";
            }>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    credentialSecretRefs: z.ZodArray<z.ZodObject<{
        secretId: z.ZodString;
        versionSelector: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"latest">, z.ZodNumber]>>;
        configPath: z.ZodString;
        required: z.ZodOptional<z.ZodBoolean>;
        label: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        projectionClass: z.ZodOptional<z.ZodEnum<{
            class_3_static_lease: "class_3_static_lease";
            unclassified: "unclassified";
        }>>;
        projectionAllowlistKey: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        keyScope: z.ZodOptional<z.ZodString>;
        expiresAt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    externalCredential: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        provider: z.ZodLiteral<"vercel_connect">;
        subjectType: z.ZodEnum<{
            app: "app";
            user: "user";
        }>;
        installationId: z.ZodOptional<z.ZodString>;
        tenantId: z.ZodOptional<z.ZodString>;
        tokenId: z.ZodOptional<z.ZodString>;
        expiresAt: z.ZodOptional<z.ZodString>;
        lastVerifiedAt: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
    status: z.ZodEnum<{
        active: "active";
        expired: "expired";
        needs_reauthorization: "needs_reauthorization";
        revoked: "revoked";
    }>;
    isDefault: z.ZodBoolean;
    createdByAgentId: z.ZodNullable<z.ZodString>;
    createdByUserId: z.ZodNullable<z.ZodString>;
    revokedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
    revokedByAgentId: z.ZodNullable<z.ZodString>;
    revokedByUserId: z.ZodNullable<z.ZodString>;
    lastUsedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
}, z.core.$strip>;
export declare const putToolConnectionInstallsSchema: z.ZodObject<{
    installs: z.ZodArray<z.ZodObject<{
        targetType: z.ZodEnum<{
            agent: "agent";
            company: "company";
        }>;
        targetId: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strict>;
export type PutToolConnectionInstalls = z.infer<typeof putToolConnectionInstallsSchema>;
/**
 * Audience replacement for an organization grant (PAP-17835). An empty array is
 * the canonical encoding of "all organization members" — the UI never exposes
 * "empty list" as the mental model, so the wire format carries the emptiness and
 * the copy layer translates it.
 */
export declare const replaceConnectionGrantMembersSchema: z.ZodObject<{
    memberUserIds: z.ZodArray<z.ZodString>;
}, z.core.$strict>;
export type ReplaceConnectionGrantMembersInput = z.infer<typeof replaceConnectionGrantMembersSchema>;
export declare const connectionTokenIssuancePathSchema: z.ZodEnum<{
    exchange: "exchange";
    oauth_access: "oauth_access";
    static: "static";
}>;
export declare const connectionTokenScopeSchema: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
export declare const connectionTokenSubjectSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"app">;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"user">;
    userId: z.ZodString;
}, z.core.$strict>], "type">;
export declare const connectionTokenRequestSchema: z.ZodObject<{
    subject: z.ZodDefault<z.ZodOptional<z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"app">;
    }, z.core.$strict>, z.ZodObject<{
        type: z.ZodLiteral<"user">;
        userId: z.ZodString;
    }, z.core.$strict>], "type">>>;
    scope: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
    requestedTtlSeconds: z.ZodOptional<z.ZodNumber>;
    grantId: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const startConnectionAuthorizationSchema: z.ZodObject<{
    subjectUserId: z.ZodString;
    scopes: z.ZodOptional<z.ZodArray<z.ZodString>>;
    returnTo: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type ConnectionTokenRequestInput = z.infer<typeof connectionTokenRequestSchema>;
export declare const toolStdioTemplateToolSchema: z.ZodObject<{
    name: z.ZodString;
    title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    inputSchema: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    annotations: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export declare const createToolStdioCommandTemplateSchema: z.ZodObject<{
    templateId: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    command: z.ZodString;
    args: z.ZodDefault<z.ZodArray<z.ZodString>>;
    envKeys: z.ZodDefault<z.ZodArray<z.ZodString>>;
    tools: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        inputSchema: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
        annotations: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type CreateToolStdioCommandTemplate = z.infer<typeof createToolStdioCommandTemplateSchema>;
export declare const disableToolStdioCommandTemplateSchema: z.ZodObject<{
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type DisableToolStdioCommandTemplate = z.infer<typeof disableToolStdioCommandTemplateSchema>;
/**
 * How an operator says a generic remote MCP endpoint authenticates (PAP-17087).
 *
 * `auto` is the default and the only value the simple path sends: Paperclip
 * probes the endpoint and branches on what it finds. The rest are the explicit
 * choices behind "Advanced authentication", where the operator already knows.
 */
export declare const GENERIC_MCP_AUTH_MODES: readonly ["auto", "none", "bearer", "custom_headers", "oauth"];
export declare const genericMcpAuthModeSchema: z.ZodEnum<{
    auto: "auto";
    bearer: "bearer";
    custom_headers: "custom_headers";
    none: "none";
    oauth: "oauth";
}>;
export type GenericMcpAuthMode = z.infer<typeof genericMcpAuthModeSchema>;
/**
 * A preregistered OAuth client an operator pasted in because the authorization
 * server supports neither CIMD nor dynamic registration. The secret is write-only:
 * it becomes a Paperclip secret ref and is never read back.
 */
export declare const genericMcpOAuthClientSchema: z.ZodObject<{
    clientId: z.ZodString;
    clientSecret: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type GenericMcpOAuthClient = z.infer<typeof genericMcpOAuthClientSchema>;
export declare const connectToolAppSchema: z.ZodObject<{
    galleryKey: z.ZodOptional<z.ZodString>;
    connectionMethodKey: z.ZodOptional<z.ZodString>;
    link: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    credentialValues: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    configValues: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    applicationId: z.ZodOptional<z.ZodString>;
    interactionId: z.ZodOptional<z.ZodString>;
    resumeConnectionId: z.ZodOptional<z.ZodString>;
    reconnectConnectionId: z.ZodOptional<z.ZodString>;
    authMode: z.ZodOptional<z.ZodEnum<{
        auto: "auto";
        bearer: "bearer";
        custom_headers: "custom_headers";
        none: "none";
        oauth: "oauth";
    }>>;
    oauthClient: z.ZodOptional<z.ZodObject<{
        clientId: z.ZodString;
        clientSecret: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
    credentialSource: z.ZodOptional<z.ZodEnum<{
        paperclip_vault: "paperclip_vault";
        vercel_connect: "vercel_connect";
    }>>;
    vercelConnect: z.ZodOptional<z.ZodObject<{
        connector: z.ZodString;
    }, z.core.$strict>>;
    grantKind: z.ZodOptional<z.ZodEnum<{
        agent: "agent";
        organization: "organization";
        user: "user";
    }>>;
    subjectAgentId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ConnectToolApp = z.infer<typeof connectToolAppSchema>;
export declare const reconnectToolAppSchema: z.ZodObject<{
    credentialValues: z.ZodRecord<z.ZodString, z.ZodString>;
}, z.core.$strip>;
export type ReconnectToolApp = z.infer<typeof reconnectToolAppSchema>;
export declare const finishToolAppSchema: z.ZodObject<{
    preserveExistingAccess: z.ZodOptional<z.ZodBoolean>;
    enabledCatalogEntryIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    askFirstCatalogEntryIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    reviewedCatalogEntryIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    access: z.ZodUnion<readonly [z.ZodLiteral<"all_agents">, z.ZodObject<{
        agentIds: z.ZodArray<z.ZodString>;
    }, z.core.$strip>]>;
}, z.core.$strip>;
export type FinishToolApp = z.infer<typeof finishToolAppSchema>;
/**
 * Legacy promotion boundary retained for connection-intent flows. Interactive
 * app setup chooses identity before OAuth and writes the token directly to that
 * credential scope.
 */
export declare const finalizeOAuthAccessSchema: z.ZodObject<{
    grantKind: z.ZodEnum<{
        agent: "agent";
        organization: "organization";
        user: "user";
    }>;
}, z.core.$strict>;
export type FinalizeOAuthAccess = z.infer<typeof finalizeOAuthAccessSchema>;
export declare const startToolOAuthSchema: z.ZodDefault<z.ZodObject<{
    asCurrentUser: z.ZodOptional<z.ZodBoolean>;
    asAgentId: z.ZodOptional<z.ZodString>;
    interactionId: z.ZodOptional<z.ZodString>;
}, z.core.$strict>>;
export type StartToolOAuth = z.infer<typeof startToolOAuthSchema>;
export declare const upsertToolCatalogEntrySchema: z.ZodObject<{
    applicationId: z.ZodString;
    connectionId: z.ZodString;
    entryKind: z.ZodDefault<z.ZodEnum<{
        prompt: "prompt";
        resource: "resource";
        tool: "tool";
    }>>;
    toolName: z.ZodString;
    title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    inputSchema: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    outputSchema: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    annotations: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    riskLevel: z.ZodDefault<z.ZodEnum<{
        critical: "critical";
        destructive: "destructive";
        high: "high";
        low: "low";
        medium: "medium";
        read: "read";
        write: "write";
    }>>;
    isReadOnly: z.ZodDefault<z.ZodBoolean>;
    isWrite: z.ZodDefault<z.ZodBoolean>;
    isDestructive: z.ZodDefault<z.ZodBoolean>;
    status: z.ZodDefault<z.ZodEnum<{
        active: "active";
        disabled: "disabled";
        quarantined: "quarantined";
        removed: "removed";
    }>>;
    version: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    schemaHash: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type UpsertToolCatalogEntry = z.infer<typeof upsertToolCatalogEntrySchema>;
export declare const createToolProfileSchema: z.ZodObject<{
    profileKey: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodEnum<{
        active: "active";
        archived: "archived";
        disabled: "disabled";
        draft: "draft";
    }>>;
    defaultAction: z.ZodDefault<z.ZodEnum<{
        allow: "allow";
        deny: "deny";
    }>>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export type CreateToolProfile = z.infer<typeof createToolProfileSchema>;
export declare const updateToolProfileSchema: z.ZodObject<{
    profileKey: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        active: "active";
        archived: "archived";
        disabled: "disabled";
        draft: "draft";
    }>>>;
    defaultAction: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        allow: "allow";
        deny: "deny";
    }>>>;
    metadata: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>>;
}, z.core.$strip>;
export type UpdateToolProfile = z.infer<typeof updateToolProfileSchema>;
export declare const createToolProfileEntrySchema: z.ZodObject<{
    profileId: z.ZodString;
    selectorType: z.ZodEnum<{
        application: "application";
        catalog_entry: "catalog_entry";
        connection: "connection";
        risk_level: "risk_level";
        tool_name: "tool_name";
    }>;
    effect: z.ZodDefault<z.ZodEnum<{
        exclude: "exclude";
        include: "include";
    }>>;
    applicationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    connectionId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    catalogEntryId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    toolName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    riskLevel: z.ZodNullable<z.ZodOptional<z.ZodEnum<{
        critical: "critical";
        destructive: "destructive";
        high: "high";
        low: "low";
        medium: "medium";
        read: "read";
        write: "write";
    }>>>;
    conditions: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export type CreateToolProfileEntry = z.infer<typeof createToolProfileEntrySchema>;
export declare const createToolProfileEntryForProfileSchema: z.ZodObject<{
    selectorType: z.ZodEnum<{
        application: "application";
        catalog_entry: "catalog_entry";
        connection: "connection";
        risk_level: "risk_level";
        tool_name: "tool_name";
    }>;
    effect: z.ZodDefault<z.ZodEnum<{
        exclude: "exclude";
        include: "include";
    }>>;
    applicationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    connectionId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    catalogEntryId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    toolName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    riskLevel: z.ZodNullable<z.ZodOptional<z.ZodEnum<{
        critical: "critical";
        destructive: "destructive";
        high: "high";
        low: "low";
        medium: "medium";
        read: "read";
        write: "write";
    }>>>;
    conditions: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export type CreateToolProfileEntryForProfile = z.infer<typeof createToolProfileEntryForProfileSchema>;
export declare const updateToolProfileEntrySchema: z.ZodObject<{
    selectorType: z.ZodOptional<z.ZodEnum<{
        application: "application";
        catalog_entry: "catalog_entry";
        connection: "connection";
        risk_level: "risk_level";
        tool_name: "tool_name";
    }>>;
    effect: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        exclude: "exclude";
        include: "include";
    }>>>;
    applicationId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    connectionId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    catalogEntryId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    toolName: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    riskLevel: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodEnum<{
        critical: "critical";
        destructive: "destructive";
        high: "high";
        low: "low";
        medium: "medium";
        read: "read";
        write: "write";
    }>>>>;
    conditions: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>>;
}, z.core.$strip>;
export type UpdateToolProfileEntry = z.infer<typeof updateToolProfileEntrySchema>;
export declare const createToolProfileWithEntriesSchema: z.ZodObject<{
    profileKey: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodEnum<{
        active: "active";
        archived: "archived";
        disabled: "disabled";
        draft: "draft";
    }>>;
    defaultAction: z.ZodDefault<z.ZodEnum<{
        allow: "allow";
        deny: "deny";
    }>>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    entries: z.ZodOptional<z.ZodArray<z.ZodObject<{
        selectorType: z.ZodEnum<{
            application: "application";
            catalog_entry: "catalog_entry";
            connection: "connection";
            risk_level: "risk_level";
            tool_name: "tool_name";
        }>;
        effect: z.ZodDefault<z.ZodEnum<{
            exclude: "exclude";
            include: "include";
        }>>;
        applicationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        connectionId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        catalogEntryId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        toolName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        riskLevel: z.ZodNullable<z.ZodOptional<z.ZodEnum<{
            critical: "critical";
            destructive: "destructive";
            high: "high";
            low: "low";
            medium: "medium";
            read: "read";
            write: "write";
        }>>>;
        conditions: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type CreateToolProfileWithEntries = z.infer<typeof createToolProfileWithEntriesSchema>;
export declare const duplicateToolProfileSchema: z.ZodObject<{
    name: z.ZodString;
    includeAssignments: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type DuplicateToolProfile = z.infer<typeof duplicateToolProfileSchema>;
export declare const updateToolProfileWithEntriesSchema: z.ZodObject<{
    profileKey: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        active: "active";
        archived: "archived";
        disabled: "disabled";
        draft: "draft";
    }>>>;
    defaultAction: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        allow: "allow";
        deny: "deny";
    }>>>;
    metadata: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>>;
    entries: z.ZodOptional<z.ZodArray<z.ZodObject<{
        selectorType: z.ZodEnum<{
            application: "application";
            catalog_entry: "catalog_entry";
            connection: "connection";
            risk_level: "risk_level";
            tool_name: "tool_name";
        }>;
        effect: z.ZodDefault<z.ZodEnum<{
            exclude: "exclude";
            include: "include";
        }>>;
        applicationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        connectionId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        catalogEntryId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        toolName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        riskLevel: z.ZodNullable<z.ZodOptional<z.ZodEnum<{
            critical: "critical";
            destructive: "destructive";
            high: "high";
            low: "low";
            medium: "medium";
            read: "read";
            write: "write";
        }>>>;
        conditions: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type UpdateToolProfileWithEntries = z.infer<typeof updateToolProfileWithEntriesSchema>;
export declare const reviewToolProfileNewToolsSchema: z.ZodObject<{
    decisions: z.ZodArray<z.ZodObject<{
        catalogEntryId: z.ZodString;
        decision: z.ZodEnum<{
            allow: "allow";
            keep_blocked: "keep_blocked";
        }>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ReviewToolProfileNewTools = z.infer<typeof reviewToolProfileNewToolsSchema>;
export declare const deleteToolProfileSchema: z.ZodPrefault<z.ZodObject<{
    force: z.ZodDefault<z.ZodBoolean>;
    reassignToProfileId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
export type DeleteToolProfile = z.infer<typeof deleteToolProfileSchema>;
export declare const createToolProfileBindingSchema: z.ZodObject<{
    profileId: z.ZodString;
    targetType: z.ZodEnum<{
        agent: "agent";
        company: "company";
        gateway: "gateway";
        issue: "issue";
        project: "project";
        routine: "routine";
    }>;
    targetId: z.ZodString;
    priority: z.ZodDefault<z.ZodNumber>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export type CreateToolProfileBinding = z.infer<typeof createToolProfileBindingSchema>;
export declare const createToolProfileBindingForProfileSchema: z.ZodObject<{
    targetType: z.ZodEnum<{
        agent: "agent";
        company: "company";
        gateway: "gateway";
        issue: "issue";
        project: "project";
        routine: "routine";
    }>;
    targetId: z.ZodString;
    priority: z.ZodDefault<z.ZodNumber>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export type CreateToolProfileBindingForProfile = z.infer<typeof createToolProfileBindingForProfileSchema>;
export declare const unbindToolProfileBindingSchema: z.ZodObject<{
    targetType: z.ZodEnum<{
        agent: "agent";
        company: "company";
        gateway: "gateway";
        issue: "issue";
        project: "project";
        routine: "routine";
    }>;
    targetId: z.ZodString;
}, z.core.$strip>;
export type UnbindToolProfileBinding = z.infer<typeof unbindToolProfileBindingSchema>;
export declare const toolMcpGatewayAuthConfigSchema: z.ZodObject<{
    version: z.ZodDefault<z.ZodLiteral<1>>;
    bearer: z.ZodPrefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        tokenPrefix: z.ZodDefault<z.ZodLiteral<"pcgw">>;
        defaultTtlSeconds: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
        requireFiniteExpiry: z.ZodDefault<z.ZodBoolean>;
        longLivedTokenRequiresOverride: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
    oauth: z.ZodPrefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodLiteral<false>>;
        reservedFor: z.ZodDefault<z.ZodLiteral<"v1_5">>;
        protectedResourceMetadataPath: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        dynamicClientRegistration: z.ZodOptional<z.ZodLiteral<false>>;
        authorizationCodePkce: z.ZodOptional<z.ZodLiteral<false>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const toolMcpGatewayHeaderPolicySchema: z.ZodObject<{
    version: z.ZodDefault<z.ZodLiteral<1>>;
    callerPassthrough: z.ZodPrefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        allowedHeaders: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    staticHeaders: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        valueRef: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        value: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>>;
    generatedMetadata: z.ZodPrefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        allowedHeaders: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    responseHeaders: z.ZodPrefault<z.ZodObject<{
        forwardMcpRequiredHeaders: z.ZodDefault<z.ZodBoolean>;
        forwardSafeCacheHeaders: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const toolMcpGatewayMetadataPolicySchema: z.ZodObject<{
    version: z.ZodDefault<z.ZodLiteral<1>>;
    forwardCompanyId: z.ZodDefault<z.ZodBoolean>;
    forwardGatewayId: z.ZodDefault<z.ZodBoolean>;
    forwardProjectId: z.ZodDefault<z.ZodBoolean>;
    forwardIssueId: z.ZodDefault<z.ZodBoolean>;
    forwardAgentId: z.ZodDefault<z.ZodBoolean>;
    forwardRunId: z.ZodDefault<z.ZodBoolean>;
    forwardCorrelationId: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const toolMcpGatewayOnDemandToolsConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    searchToolName: z.ZodDefault<z.ZodLiteral<"search_tools">>;
    runToolName: z.ZodDefault<z.ZodLiteral<"run_tool">>;
}, z.core.$strip>;
export declare const createToolMcpGatewaySchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    displaySlug: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    profileId: z.ZodString;
    defaultProfileMode: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        gateway_only: "gateway_only";
        gateway_then_context: "gateway_then_context";
        inherit_context_then_gateway: "inherit_context_then_gateway";
    }>>>;
    contextScopeType: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        agent: "agent";
        company: "company";
        issue: "issue";
        none: "none";
        project: "project";
        routine: "routine";
    }>>>;
    contextScopeId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    agentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    projectId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    issueId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    approvalIssueId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    authConfig: z.ZodOptional<z.ZodObject<{
        version: z.ZodDefault<z.ZodLiteral<1>>;
        bearer: z.ZodPrefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            tokenPrefix: z.ZodDefault<z.ZodLiteral<"pcgw">>;
            defaultTtlSeconds: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
            requireFiniteExpiry: z.ZodDefault<z.ZodBoolean>;
            longLivedTokenRequiresOverride: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>;
        oauth: z.ZodPrefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodLiteral<false>>;
            reservedFor: z.ZodDefault<z.ZodLiteral<"v1_5">>;
            protectedResourceMetadataPath: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            dynamicClientRegistration: z.ZodOptional<z.ZodLiteral<false>>;
            authorizationCodePkce: z.ZodOptional<z.ZodLiteral<false>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    headerPolicy: z.ZodOptional<z.ZodObject<{
        version: z.ZodDefault<z.ZodLiteral<1>>;
        callerPassthrough: z.ZodPrefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            allowedHeaders: z.ZodDefault<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
        staticHeaders: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            valueRef: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            value: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        }, z.core.$strip>>>;
        generatedMetadata: z.ZodPrefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            allowedHeaders: z.ZodDefault<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
        responseHeaders: z.ZodPrefault<z.ZodObject<{
            forwardMcpRequiredHeaders: z.ZodDefault<z.ZodBoolean>;
            forwardSafeCacheHeaders: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    metadataPolicy: z.ZodOptional<z.ZodObject<{
        version: z.ZodDefault<z.ZodLiteral<1>>;
        forwardCompanyId: z.ZodDefault<z.ZodBoolean>;
        forwardGatewayId: z.ZodDefault<z.ZodBoolean>;
        forwardProjectId: z.ZodDefault<z.ZodBoolean>;
        forwardIssueId: z.ZodDefault<z.ZodBoolean>;
        forwardAgentId: z.ZodDefault<z.ZodBoolean>;
        forwardRunId: z.ZodDefault<z.ZodBoolean>;
        forwardCorrelationId: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
    onDemandToolsConfig: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        searchToolName: z.ZodDefault<z.ZodLiteral<"search_tools">>;
        runToolName: z.ZodDefault<z.ZodLiteral<"run_tool">>;
    }, z.core.$strip>>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export type CreateToolMcpGateway = z.infer<typeof createToolMcpGatewaySchema>;
export declare const updateToolMcpGatewaySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    displaySlug: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    profileId: z.ZodOptional<z.ZodString>;
    defaultProfileMode: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        gateway_only: "gateway_only";
        gateway_then_context: "gateway_then_context";
        inherit_context_then_gateway: "inherit_context_then_gateway";
    }>>>>;
    contextScopeType: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        agent: "agent";
        company: "company";
        issue: "issue";
        none: "none";
        project: "project";
        routine: "routine";
    }>>>>;
    contextScopeId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    agentId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    projectId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    issueId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    approvalIssueId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    authConfig: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        version: z.ZodDefault<z.ZodLiteral<1>>;
        bearer: z.ZodPrefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            tokenPrefix: z.ZodDefault<z.ZodLiteral<"pcgw">>;
            defaultTtlSeconds: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
            requireFiniteExpiry: z.ZodDefault<z.ZodBoolean>;
            longLivedTokenRequiresOverride: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>;
        oauth: z.ZodPrefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodLiteral<false>>;
            reservedFor: z.ZodDefault<z.ZodLiteral<"v1_5">>;
            protectedResourceMetadataPath: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            dynamicClientRegistration: z.ZodOptional<z.ZodLiteral<false>>;
            authorizationCodePkce: z.ZodOptional<z.ZodLiteral<false>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
    headerPolicy: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        version: z.ZodDefault<z.ZodLiteral<1>>;
        callerPassthrough: z.ZodPrefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            allowedHeaders: z.ZodDefault<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
        staticHeaders: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            valueRef: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            value: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        }, z.core.$strip>>>;
        generatedMetadata: z.ZodPrefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            allowedHeaders: z.ZodDefault<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
        responseHeaders: z.ZodPrefault<z.ZodObject<{
            forwardMcpRequiredHeaders: z.ZodDefault<z.ZodBoolean>;
            forwardSafeCacheHeaders: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
    metadataPolicy: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        version: z.ZodDefault<z.ZodLiteral<1>>;
        forwardCompanyId: z.ZodDefault<z.ZodBoolean>;
        forwardGatewayId: z.ZodDefault<z.ZodBoolean>;
        forwardProjectId: z.ZodDefault<z.ZodBoolean>;
        forwardIssueId: z.ZodDefault<z.ZodBoolean>;
        forwardAgentId: z.ZodDefault<z.ZodBoolean>;
        forwardRunId: z.ZodDefault<z.ZodBoolean>;
        forwardCorrelationId: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>>;
    onDemandToolsConfig: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        searchToolName: z.ZodDefault<z.ZodLiteral<"search_tools">>;
        runToolName: z.ZodDefault<z.ZodLiteral<"run_tool">>;
    }, z.core.$strip>>>;
    metadata: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>>;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        archived: "archived";
        disabled: "disabled";
        draft: "draft";
    }>>;
}, z.core.$strip>;
export type UpdateToolMcpGateway = z.infer<typeof updateToolMcpGatewaySchema>;
export declare const createToolMcpGatewayTokenSchema: z.ZodObject<{
    name: z.ZodString;
    subjectType: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        agent: "agent";
        board_user: "board_user";
        gateway_client: "gateway_client";
        heartbeat_run: "heartbeat_run";
    }>>>;
    subjectId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    clientLabel: z.ZodString;
    ownerNote: z.ZodDefault<z.ZodString>;
    allowedActions: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodEnum<{
        "prompts/get": "prompts/get";
        "prompts/list": "prompts/list";
        "resources/list": "resources/list";
        "resources/read": "resources/read";
        "tools/call": "tools/call";
        "tools/list": "tools/list";
    }>>>>;
    expiresAt: z.ZodNullable<z.ZodOptional<z.ZodCoercedDate<unknown>>>;
    expiryOverrideReason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type CreateToolMcpGatewayToken = z.infer<typeof createToolMcpGatewayTokenSchema>;
export declare const toolPolicyConditionsSchema: z.ZodObject<{
    arguments: z.ZodOptional<z.ZodObject<{
        fieldEquals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        fieldNotEquals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        fieldIn: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodUnknown>>>;
        fieldMatches: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        fieldExists: z.ZodOptional<z.ZodArray<z.ZodString>>;
        fieldAbsent: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>;
    args: z.ZodOptional<z.ZodObject<{
        fieldEquals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        fieldNotEquals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        fieldIn: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodUnknown>>>;
        fieldMatches: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        fieldExists: z.ZodOptional<z.ZodArray<z.ZodString>>;
        fieldAbsent: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>;
    actor: z.ZodOptional<z.ZodObject<{
        actorType: z.ZodOptional<z.ZodEnum<{
            agent: "agent";
            plugin: "plugin";
            system: "system";
            user: "user";
        }>>;
        actorTypes: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            agent: "agent";
            plugin: "plugin";
            system: "system";
            user: "user";
        }>>>;
        agentId: z.ZodOptional<z.ZodString>;
        agentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>;
    context: z.ZodOptional<z.ZodObject<{
        projectId: z.ZodOptional<z.ZodString>;
        projectIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        routineId: z.ZodOptional<z.ZodString>;
        routineIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        issueId: z.ZodOptional<z.ZodString>;
        issueIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        requireIssue: z.ZodOptional<z.ZodBoolean>;
        requireProject: z.ZodOptional<z.ZodBoolean>;
        requireRoutine: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strict>>;
    risk: z.ZodOptional<z.ZodObject<{
        levels: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            critical: "critical";
            destructive: "destructive";
            high: "high";
            low: "low";
            medium: "medium";
            read: "read";
            write: "write";
        }>>>;
        max: z.ZodOptional<z.ZodEnum<{
            critical: "critical";
            destructive: "destructive";
            high: "high";
            low: "low";
            medium: "medium";
            read: "read";
            write: "write";
        }>>;
        isWrite: z.ZodOptional<z.ZodBoolean>;
        isDestructive: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strict>>;
    credentialScope: z.ZodOptional<z.ZodObject<{
        applicationId: z.ZodOptional<z.ZodString>;
        applicationIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        connectionId: z.ZodOptional<z.ZodString>;
        connectionIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        catalogEntryId: z.ZodOptional<z.ZodString>;
        catalogEntryIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        applicationKey: z.ZodOptional<z.ZodString>;
        applicationKeys: z.ZodOptional<z.ZodArray<z.ZodString>>;
        providerType: z.ZodOptional<z.ZodString>;
        providerTypes: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>;
    trustBoundary: z.ZodOptional<z.ZodObject<{
        providerType: z.ZodOptional<z.ZodString>;
        providerTypes: z.ZodOptional<z.ZodArray<z.ZodString>>;
        applicationKey: z.ZodOptional<z.ZodString>;
        applicationKeys: z.ZodOptional<z.ZodArray<z.ZodString>>;
        remoteHttpOnly: z.ZodOptional<z.ZodBoolean>;
        paperclipSelfOnly: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strict>>;
    timeWindow: z.ZodOptional<z.ZodObject<{
        startAt: z.ZodOptional<z.ZodString>;
        endAt: z.ZodOptional<z.ZodString>;
        daysOfWeekUtc: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
        startHourUtc: z.ZodOptional<z.ZodNumber>;
        endHourUtc: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export declare const createToolPolicySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    policyType: z.ZodEnum<{
        allow: "allow";
        block: "block";
        rate_limit: "rate_limit";
        require_approval: "require_approval";
        trust_rule: "trust_rule";
    }>;
    priority: z.ZodDefault<z.ZodNumber>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    selectors: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    conditions: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        arguments: z.ZodOptional<z.ZodObject<{
            fieldEquals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            fieldNotEquals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            fieldIn: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodUnknown>>>;
            fieldMatches: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            fieldExists: z.ZodOptional<z.ZodArray<z.ZodString>>;
            fieldAbsent: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strict>>;
        args: z.ZodOptional<z.ZodObject<{
            fieldEquals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            fieldNotEquals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            fieldIn: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodUnknown>>>;
            fieldMatches: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            fieldExists: z.ZodOptional<z.ZodArray<z.ZodString>>;
            fieldAbsent: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strict>>;
        actor: z.ZodOptional<z.ZodObject<{
            actorType: z.ZodOptional<z.ZodEnum<{
                agent: "agent";
                plugin: "plugin";
                system: "system";
                user: "user";
            }>>;
            actorTypes: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                agent: "agent";
                plugin: "plugin";
                system: "system";
                user: "user";
            }>>>;
            agentId: z.ZodOptional<z.ZodString>;
            agentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strict>>;
        context: z.ZodOptional<z.ZodObject<{
            projectId: z.ZodOptional<z.ZodString>;
            projectIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            routineId: z.ZodOptional<z.ZodString>;
            routineIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            issueId: z.ZodOptional<z.ZodString>;
            issueIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            requireIssue: z.ZodOptional<z.ZodBoolean>;
            requireProject: z.ZodOptional<z.ZodBoolean>;
            requireRoutine: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strict>>;
        risk: z.ZodOptional<z.ZodObject<{
            levels: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                critical: "critical";
                destructive: "destructive";
                high: "high";
                low: "low";
                medium: "medium";
                read: "read";
                write: "write";
            }>>>;
            max: z.ZodOptional<z.ZodEnum<{
                critical: "critical";
                destructive: "destructive";
                high: "high";
                low: "low";
                medium: "medium";
                read: "read";
                write: "write";
            }>>;
            isWrite: z.ZodOptional<z.ZodBoolean>;
            isDestructive: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strict>>;
        credentialScope: z.ZodOptional<z.ZodObject<{
            applicationId: z.ZodOptional<z.ZodString>;
            applicationIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            connectionId: z.ZodOptional<z.ZodString>;
            connectionIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            catalogEntryId: z.ZodOptional<z.ZodString>;
            catalogEntryIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            applicationKey: z.ZodOptional<z.ZodString>;
            applicationKeys: z.ZodOptional<z.ZodArray<z.ZodString>>;
            providerType: z.ZodOptional<z.ZodString>;
            providerTypes: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strict>>;
        trustBoundary: z.ZodOptional<z.ZodObject<{
            providerType: z.ZodOptional<z.ZodString>;
            providerTypes: z.ZodOptional<z.ZodArray<z.ZodString>>;
            applicationKey: z.ZodOptional<z.ZodString>;
            applicationKeys: z.ZodOptional<z.ZodArray<z.ZodString>>;
            remoteHttpOnly: z.ZodOptional<z.ZodBoolean>;
            paperclipSelfOnly: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strict>>;
        timeWindow: z.ZodOptional<z.ZodObject<{
            startAt: z.ZodOptional<z.ZodString>;
            endAt: z.ZodOptional<z.ZodString>;
            daysOfWeekUtc: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            startHourUtc: z.ZodOptional<z.ZodNumber>;
            endHourUtc: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>>;
    }, z.core.$strict>>>;
    config: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export type CreateToolPolicy = z.infer<typeof createToolPolicySchema>;
export declare const updateToolPolicySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    policyType: z.ZodOptional<z.ZodEnum<{
        allow: "allow";
        block: "block";
        rate_limit: "rate_limit";
        require_approval: "require_approval";
        trust_rule: "trust_rule";
    }>>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    enabled: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    selectors: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    conditions: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodObject<{
        arguments: z.ZodOptional<z.ZodObject<{
            fieldEquals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            fieldNotEquals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            fieldIn: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodUnknown>>>;
            fieldMatches: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            fieldExists: z.ZodOptional<z.ZodArray<z.ZodString>>;
            fieldAbsent: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strict>>;
        args: z.ZodOptional<z.ZodObject<{
            fieldEquals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            fieldNotEquals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            fieldIn: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodUnknown>>>;
            fieldMatches: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            fieldExists: z.ZodOptional<z.ZodArray<z.ZodString>>;
            fieldAbsent: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strict>>;
        actor: z.ZodOptional<z.ZodObject<{
            actorType: z.ZodOptional<z.ZodEnum<{
                agent: "agent";
                plugin: "plugin";
                system: "system";
                user: "user";
            }>>;
            actorTypes: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                agent: "agent";
                plugin: "plugin";
                system: "system";
                user: "user";
            }>>>;
            agentId: z.ZodOptional<z.ZodString>;
            agentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strict>>;
        context: z.ZodOptional<z.ZodObject<{
            projectId: z.ZodOptional<z.ZodString>;
            projectIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            routineId: z.ZodOptional<z.ZodString>;
            routineIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            issueId: z.ZodOptional<z.ZodString>;
            issueIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            requireIssue: z.ZodOptional<z.ZodBoolean>;
            requireProject: z.ZodOptional<z.ZodBoolean>;
            requireRoutine: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strict>>;
        risk: z.ZodOptional<z.ZodObject<{
            levels: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                critical: "critical";
                destructive: "destructive";
                high: "high";
                low: "low";
                medium: "medium";
                read: "read";
                write: "write";
            }>>>;
            max: z.ZodOptional<z.ZodEnum<{
                critical: "critical";
                destructive: "destructive";
                high: "high";
                low: "low";
                medium: "medium";
                read: "read";
                write: "write";
            }>>;
            isWrite: z.ZodOptional<z.ZodBoolean>;
            isDestructive: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strict>>;
        credentialScope: z.ZodOptional<z.ZodObject<{
            applicationId: z.ZodOptional<z.ZodString>;
            applicationIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            connectionId: z.ZodOptional<z.ZodString>;
            connectionIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            catalogEntryId: z.ZodOptional<z.ZodString>;
            catalogEntryIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            applicationKey: z.ZodOptional<z.ZodString>;
            applicationKeys: z.ZodOptional<z.ZodArray<z.ZodString>>;
            providerType: z.ZodOptional<z.ZodString>;
            providerTypes: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strict>>;
        trustBoundary: z.ZodOptional<z.ZodObject<{
            providerType: z.ZodOptional<z.ZodString>;
            providerTypes: z.ZodOptional<z.ZodArray<z.ZodString>>;
            applicationKey: z.ZodOptional<z.ZodString>;
            applicationKeys: z.ZodOptional<z.ZodArray<z.ZodString>>;
            remoteHttpOnly: z.ZodOptional<z.ZodBoolean>;
            paperclipSelfOnly: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strict>>;
        timeWindow: z.ZodOptional<z.ZodObject<{
            startAt: z.ZodOptional<z.ZodString>;
            endAt: z.ZodOptional<z.ZodString>;
            daysOfWeekUtc: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            startHourUtc: z.ZodOptional<z.ZodNumber>;
            endHourUtc: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>>;
    }, z.core.$strict>>>>;
    config: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>>;
}, z.core.$strip>;
export type UpdateToolPolicy = z.infer<typeof updateToolPolicySchema>;
export declare const reorderToolPoliciesSchema: z.ZodObject<{
    policyIds: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type ReorderToolPolicies = z.infer<typeof reorderToolPoliciesSchema>;
export declare const duplicateToolPolicySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type DuplicateToolPolicy = z.infer<typeof duplicateToolPolicySchema>;
export declare const createToolInvocationSchema: z.ZodObject<{
    idempotencyKey: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    issueId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    runId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    applicationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    connectionId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    catalogEntryId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    toolName: z.ZodString;
    argumentsHash: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    argumentsSummary: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        summary: z.ZodString;
        sizeBytes: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        sha256: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        redactedFields: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString>>>;
        artifactId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type CreateToolInvocation = z.infer<typeof createToolInvocationSchema>;
export declare const createToolActionRequestSchema: z.ZodObject<{
    invocationId: z.ZodString;
    issueId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    canonicalArgumentsHash: z.ZodString;
    canonicalArgumentsSummary: z.ZodObject<{
        summary: z.ZodString;
        sizeBytes: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        sha256: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        redactedFields: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString>>>;
        artifactId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>;
    signedArguments: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    previewMarkdown: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    expiresAt: z.ZodNullable<z.ZodOptional<z.ZodCoercedDate<unknown>>>;
}, z.core.$strip>;
export type CreateToolActionRequest = z.infer<typeof createToolActionRequestSchema>;
export declare const toolConnectionTestCallSchema: z.ZodObject<{
    agentId: z.ZodString;
    toolName: z.ZodString;
    parameters: z.ZodOptional<z.ZodUnknown>;
}, z.core.$strip>;
export type ToolConnectionTestCallInput = z.infer<typeof toolConnectionTestCallSchema>;
export declare const importMcpJsonSchema: z.ZodObject<{
    mcpJson: z.ZodUnion<readonly [z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>;
}, z.core.$strip>;
export type ImportMcpJson = z.infer<typeof importMcpJsonSchema>;
export declare const toolAccessSelectorSchema: z.ZodObject<{
    actorType: z.ZodOptional<z.ZodEnum<{
        agent: "agent";
        plugin: "plugin";
        system: "system";
        user: "user";
    }>>;
    agentId: z.ZodOptional<z.ZodString>;
    agentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    projectId: z.ZodOptional<z.ZodString>;
    projectIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    routineId: z.ZodOptional<z.ZodString>;
    routineIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    issueId: z.ZodOptional<z.ZodString>;
    issueIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    gatewayId: z.ZodOptional<z.ZodString>;
    gatewayIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    gatewayPublicId: z.ZodOptional<z.ZodString>;
    gatewayPublicIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    gatewayTokenId: z.ZodOptional<z.ZodString>;
    gatewayTokenIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    clientSubjectType: z.ZodOptional<z.ZodEnum<{
        agent: "agent";
        board_user: "board_user";
        gateway_client: "gateway_client";
        heartbeat_run: "heartbeat_run";
    }>>;
    clientSubjectTypes: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        agent: "agent";
        board_user: "board_user";
        gateway_client: "gateway_client";
        heartbeat_run: "heartbeat_run";
    }>>>;
    clientName: z.ZodOptional<z.ZodString>;
    clientNames: z.ZodOptional<z.ZodArray<z.ZodString>>;
    externalClient: z.ZodOptional<z.ZodBoolean>;
    applicationId: z.ZodOptional<z.ZodString>;
    applicationIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    connectionId: z.ZodOptional<z.ZodString>;
    connectionIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    catalogEntryId: z.ZodOptional<z.ZodString>;
    catalogEntryIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    toolName: z.ZodOptional<z.ZodString>;
    toolNames: z.ZodOptional<z.ZodArray<z.ZodString>>;
    riskLevel: z.ZodOptional<z.ZodEnum<{
        critical: "critical";
        destructive: "destructive";
        high: "high";
        low: "low";
        medium: "medium";
        read: "read";
        write: "write";
    }>>;
    riskLevels: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        critical: "critical";
        destructive: "destructive";
        high: "high";
        low: "low";
        medium: "medium";
        read: "read";
        write: "write";
    }>>>;
}, z.core.$strip>;
export declare const toolRateLimitRuleSchema: z.ZodObject<{
    limit: z.ZodNumber;
    windowSeconds: z.ZodNumber;
    keyBy: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        agent: "agent";
        application: "application";
        company: "company";
        connection: "connection";
        tool: "tool";
    }>>>;
}, z.core.$strip>;
export declare const toolTrustRuleArgumentFiltersSchema: z.ZodObject<{
    allowAny: z.ZodOptional<z.ZodBoolean>;
    exactHash: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    allowedHashes: z.ZodOptional<z.ZodArray<z.ZodString>>;
    fieldEquals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    fieldNotEquals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    fieldIn: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodUnknown>>>;
    fieldMatches: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    fieldExists: z.ZodOptional<z.ZodArray<z.ZodString>>;
    fieldAbsent: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const toolTrustRuleScopeSchema: z.ZodObject<{
    includeAgent: z.ZodOptional<z.ZodBoolean>;
    includeProject: z.ZodOptional<z.ZodBoolean>;
    includeIssue: z.ZodOptional<z.ZodBoolean>;
    includeApplication: z.ZodOptional<z.ZodBoolean>;
    includeConnection: z.ZodOptional<z.ZodBoolean>;
    includeCatalogEntry: z.ZodOptional<z.ZodBoolean>;
    includeTool: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const toolTrustRuleBatchApprovalSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    maxBatchSize: z.ZodOptional<z.ZodNumber>;
    windowSeconds: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const createToolTrustRuleFromActionRequestSchema: z.ZodObject<{
    argumentMode: z.ZodOptional<z.ZodEnum<{
        action: "action";
        exact: "exact";
    }>>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    priority: z.ZodDefault<z.ZodNumber>;
    approvalThreshold: z.ZodDefault<z.ZodNumber>;
    selectors: z.ZodOptional<z.ZodObject<{
        actorType: z.ZodOptional<z.ZodEnum<{
            agent: "agent";
            plugin: "plugin";
            system: "system";
            user: "user";
        }>>;
        agentId: z.ZodOptional<z.ZodString>;
        agentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        projectId: z.ZodOptional<z.ZodString>;
        projectIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        routineId: z.ZodOptional<z.ZodString>;
        routineIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        issueId: z.ZodOptional<z.ZodString>;
        issueIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        gatewayId: z.ZodOptional<z.ZodString>;
        gatewayIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        gatewayPublicId: z.ZodOptional<z.ZodString>;
        gatewayPublicIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        gatewayTokenId: z.ZodOptional<z.ZodString>;
        gatewayTokenIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        clientSubjectType: z.ZodOptional<z.ZodEnum<{
            agent: "agent";
            board_user: "board_user";
            gateway_client: "gateway_client";
            heartbeat_run: "heartbeat_run";
        }>>;
        clientSubjectTypes: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            agent: "agent";
            board_user: "board_user";
            gateway_client: "gateway_client";
            heartbeat_run: "heartbeat_run";
        }>>>;
        clientName: z.ZodOptional<z.ZodString>;
        clientNames: z.ZodOptional<z.ZodArray<z.ZodString>>;
        externalClient: z.ZodOptional<z.ZodBoolean>;
        applicationId: z.ZodOptional<z.ZodString>;
        applicationIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        connectionId: z.ZodOptional<z.ZodString>;
        connectionIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        catalogEntryId: z.ZodOptional<z.ZodString>;
        catalogEntryIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        toolName: z.ZodOptional<z.ZodString>;
        toolNames: z.ZodOptional<z.ZodArray<z.ZodString>>;
        riskLevel: z.ZodOptional<z.ZodEnum<{
            critical: "critical";
            destructive: "destructive";
            high: "high";
            low: "low";
            medium: "medium";
            read: "read";
            write: "write";
        }>>;
        riskLevels: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            critical: "critical";
            destructive: "destructive";
            high: "high";
            low: "low";
            medium: "medium";
            read: "read";
            write: "write";
        }>>>;
    }, z.core.$strip>>;
    scope: z.ZodOptional<z.ZodObject<{
        includeAgent: z.ZodOptional<z.ZodBoolean>;
        includeProject: z.ZodOptional<z.ZodBoolean>;
        includeIssue: z.ZodOptional<z.ZodBoolean>;
        includeApplication: z.ZodOptional<z.ZodBoolean>;
        includeConnection: z.ZodOptional<z.ZodBoolean>;
        includeCatalogEntry: z.ZodOptional<z.ZodBoolean>;
        includeTool: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
    argumentFilters: z.ZodOptional<z.ZodObject<{
        allowAny: z.ZodOptional<z.ZodBoolean>;
        exactHash: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        allowedHashes: z.ZodOptional<z.ZodArray<z.ZodString>>;
        fieldEquals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        fieldNotEquals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        fieldIn: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodUnknown>>>;
        fieldMatches: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        fieldExists: z.ZodOptional<z.ZodArray<z.ZodString>>;
        fieldAbsent: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    expiresAt: z.ZodNullable<z.ZodOptional<z.ZodCoercedDate<unknown>>>;
    batchApproval: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        maxBatchSize: z.ZodOptional<z.ZodNumber>;
        windowSeconds: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type CreateToolTrustRuleFromActionRequest = z.infer<typeof createToolTrustRuleFromActionRequestSchema>;
export declare const revokeToolTrustRuleSchema: z.ZodObject<{
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type RevokeToolTrustRule = z.infer<typeof revokeToolTrustRuleSchema>;
export declare const toolPolicyTestRequestSchema: z.ZodObject<{
    companyId: z.ZodString;
    actor: z.ZodObject<{
        actorType: z.ZodEnum<{
            agent: "agent";
            plugin: "plugin";
            system: "system";
            user: "user";
        }>;
        actorId: z.ZodString;
        agentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>;
    runContext: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        heartbeatRunId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        issueId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        projectId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        routineId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        gatewayId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        gatewayPublicId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        gatewayTokenId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        clientSubjectType: z.ZodNullable<z.ZodOptional<z.ZodEnum<{
            agent: "agent";
            board_user: "board_user";
            gateway_client: "gateway_client";
            heartbeat_run: "heartbeat_run";
        }>>>;
        clientSubjectId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        clientName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        externalClient: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    }, z.core.$strip>>>;
    request: z.ZodObject<{
        applicationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        connectionId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        catalogEntryId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        toolName: z.ZodString;
        arguments: z.ZodOptional<z.ZodUnknown>;
        idempotencyKey: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        sideEffecting: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
    consumeRateLimit: z.ZodOptional<z.ZodBoolean>;
    writeAuditEvent: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type ToolPolicyTestRequestInput = z.infer<typeof toolPolicyTestRequestSchema>;
//# sourceMappingURL=tool-access.d.ts.map