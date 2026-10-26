import { aiConnectionBindingSchema } from "../ai-connections.js";
import { z } from "zod";
import { AGENT_ICON_NAMES, AGENT_ROLES, AGENT_STATUSES, INBOX_MINE_ISSUE_STATUS_FILTER, } from "../constants.js";
import { agentAdapterTypeSchema } from "../adapter-type.js";
import { envConfigSchema } from "./secret.js";
import { trustAuthorizationPolicySchema, trustPresetSchema } from "./trust-policy.js";
import { agentDesiredSkillSelectionSchema } from "./adapter-skills.js";
import { objectWithoutDefaults } from "./partial.js";
export const agentPermissionsSchema = z.object({
    // No schema default: the server derives the default (enabled unless the
    // permissions record marks the agent low-trust) when the field is omitted.
    canCreateAgents: z.boolean().optional(),
    canCreateSkills: z.boolean().optional().default(true),
    trustPreset: trustPresetSchema.optional(),
    authorizationPolicy: trustAuthorizationPolicySchema.optional(),
}).catchall(z.unknown());
export const agentInstructionsBundleModeSchema = z.enum(["managed", "external"]);
export const updateAgentInstructionsBundleSchema = z.object({
    mode: agentInstructionsBundleModeSchema.optional(),
    rootPath: z.string().trim().min(1).nullable().optional(),
    entryFile: z.string().trim().min(1).optional(),
    clearLegacyPromptTemplate: z.boolean().optional().default(false),
});
export const upsertAgentInstructionsFileSchema = z.object({
    path: z.string().trim().min(1),
    content: z.string(),
    clearLegacyPromptTemplate: z.boolean().optional().default(false),
});
const adapterConfigSchema = z.record(z.string(), z.unknown()).superRefine((value, ctx) => {
    const envValue = value.env;
    if (envValue === undefined)
        return;
    const parsed = envConfigSchema.safeParse(envValue);
    if (!parsed.success) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "adapterConfig.env must be a map of valid env bindings",
            path: ["env"],
        });
    }
});
export const createAgentInstructionsBundleSchema = z.object({
    entryFile: z.string().trim().min(1).optional(),
    files: z.record(z.string(), z.string()).refine((files) => Object.keys(files).length > 0, {
        message: "instructionsBundle.files must contain at least one file",
    }),
});
export const agentRuntimeConfigSchema = z.object({
    aiConnection: aiConnectionBindingSchema.optional(),
    debug: z.object({
        providerTrace: z.literal("raw").optional(),
    }).strict().optional(),
}).catchall(z.unknown()).superRefine((value, ctx) => {
    if (Object.prototype.hasOwnProperty.call(value, "modelProfiles")) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["modelProfiles"],
            message: "runtimeConfig.modelProfiles is no longer supported",
        });
    }
});
export const createAgentSchema = z.object({
    name: z.string().min(1),
    role: z.enum(AGENT_ROLES).optional().default("general"),
    title: z.string().optional().nullable(),
    icon: z.enum(AGENT_ICON_NAMES).optional().nullable(),
    reportsTo: z.string().guid().optional().nullable(),
    capabilities: z.string().optional().nullable(),
    desiredSkills: z.array(agentDesiredSkillSelectionSchema).optional(),
    adapterType: agentAdapterTypeSchema,
    adapterConfig: adapterConfigSchema.optional().default({}),
    instructionsBundle: createAgentInstructionsBundleSchema.optional(),
    runtimeConfig: agentRuntimeConfigSchema.optional().default({}),
    defaultEnvironmentId: z.string().guid().optional().nullable(),
    budgetMonthlyCents: z.number().int().nonnegative().optional().default(0),
    permissions: agentPermissionsSchema.optional(),
    metadata: z.record(z.string(), z.unknown()).optional().nullable(),
    // The optional stored-session claim from a completed Claude login session. It
    // is the non-secret `storedSessionId`; it carries no token. The agent-create
    // transaction consumes it as the one-time stored-session claim.
    storedSessionId: z.string().min(1).max(256).optional(),
    // The optional apply-existing flag. When true, the caller binds the fixed
    // Claude OAuth token reference to the owner stored value with no new login
    // round trip. The server permits the no-claim bind only for a user actor and
    // only when that owner already has a stored value. It carries no token.
    applyStoredClaudeLogin: z.boolean().optional(),
    // Narrow intent flag set by the onboarding wizard when it hires the very first
    // agent (the chief of staff). It is not an agent column: the server consumes
    // it to seed the server-owned chief-of-staff persona over the agent's entry
    // instruction file instead of the generic default, and honors it only for
    // board-authored requests. Mirrors onboardingFirstTask on issue create.
    onboardingFirstAgent: z.boolean().optional(),
});
export const builtInAgentProvisionSchema = z.object({
    adapterType: agentAdapterTypeSchema.optional(),
    adapterConfig: adapterConfigSchema.optional(),
    budgetMonthlyCents: z.number().int().nonnegative().optional(),
}).strict();
export const builtInAgentEmptyMutationSchema = z.object({}).strict().default({});
export const builtInAgentResetSchema = z.object({
    resources: z.array(z.enum(["agent", "instructions", "skill", "routine"])).optional(),
}).strict().default({});
export const createAgentHireSchema = createAgentSchema.extend({
    sourceIssueId: z.string().guid().optional().nullable(),
    sourceIssueIds: z.array(z.string().guid()).optional(),
});
export const updateAgentSchema = objectWithoutDefaults(createAgentSchema.omit({ permissions: true, onboardingFirstAgent: true }))
    .partial()
    .extend({
    permissions: z.never().optional(),
    replaceAdapterConfig: z.boolean().optional(),
    status: z.enum(AGENT_STATUSES).optional(),
    spentMonthlyCents: z.number().int().nonnegative().optional(),
});
export const updateAgentInstructionsPathSchema = z.object({
    path: z.string().trim().min(1).nullable(),
    adapterConfigKey: z.string().trim().min(1).optional(),
});
export const taskBridgeAgentKeyScopeSchema = z.object({
    kind: z.literal("task_bridge"),
    projectId: z.string().guid().optional().nullable(),
    projectIds: z.array(z.string().guid()).max(50).optional(),
    parentIssueId: z.string().guid().optional().nullable(),
    parentIssueIds: z.array(z.string().guid()).max(50).optional(),
    allowedAssigneeAgentIds: z.array(z.string().guid()).max(50).optional(),
}).strict().superRefine((value, ctx) => {
    const hasProjectBoundary = Boolean(value.projectId) || Boolean(value.projectIds?.length);
    const hasParentBoundary = Boolean(value.parentIssueId) || Boolean(value.parentIssueIds?.length);
    if (!hasProjectBoundary && !hasParentBoundary) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "task_bridge keys require at least one project or parent issue boundary",
            path: ["projectId"],
        });
    }
});
export const standardAgentKeyScopeSchema = z.object({
    kind: z.literal("standard"),
}).strict();
export const skillTestAgentKeyScopeSchema = z.object({
    kind: z.literal("skill_test"),
    issueId: z.string().guid(),
}).strict();
export const agentApiKeyScopeSchema = z.union([
    standardAgentKeyScopeSchema,
    taskBridgeAgentKeyScopeSchema,
    skillTestAgentKeyScopeSchema,
]);
export function normalizeAgentApiKeyScope(value) {
    const parsed = agentApiKeyScopeSchema.safeParse(value);
    return parsed.success ? parsed.data : { kind: "standard" };
}
export const createAgentKeySchema = z.object({
    name: z.string().min(1).default("default"),
    scope: agentApiKeyScopeSchema.optional().default({ kind: "standard" }),
});
export const agentMineInboxQuerySchema = z.object({
    userId: z.string().trim().min(1),
    status: z.string().trim().min(1).optional().default(INBOX_MINE_ISSUE_STATUS_FILTER),
});
export const wakeAgentSchema = z.object({
    source: z
        .enum(["timer", "assignment", "on_demand", "automation"])
        .optional()
        .default("on_demand"),
    triggerDetail: z.enum(["manual", "ping", "callback", "system"]).optional(),
    reason: z.string().optional().nullable(),
    /** Select an exact failed run; its chat request and actor are server-derived. */
    failedRunId: z.string().uuid().optional(),
    // Compatibility alias; the wakeup route merges it into payload.issueId.
    issueId: z.string().uuid().optional(),
    payload: z.record(z.string(), z.unknown()).optional().nullable(),
    idempotencyKey: z.string().optional().nullable(),
    forceFreshSession: z.preprocess((value) => (value === null ? undefined : value), z.boolean().optional().default(false)),
    debug: z
        .object({
        providerTrace: z.literal("raw"),
    })
        .strict()
        .optional(),
});
export const resetAgentSessionSchema = z.object({
    taskKey: z.string().min(1).optional().nullable(),
});
export const testAdapterEnvironmentSchema = z.object({
    aiConnection: aiConnectionBindingSchema.optional(),
    /** Saved agent whose redacted environment entries are restored for this probe. */
    agentId: z.string().guid().optional(),
    /** One-shot provider keys for a probe. Never persist these in agent config. */
    testCredentials: z.object({
        ANTHROPIC_API_KEY: z.string().max(16384),
        OPENAI_API_KEY: z.string().max(16384),
        OPENROUTER_API_KEY: z.string().max(16384),
        GEMINI_API_KEY: z.string().max(16384),
        XAI_API_KEY: z.string().max(16384),
        GROQ_API_KEY: z.string().max(16384),
        OPENCODE_API_KEY: z.string().max(16384),
        CURSOR_API_KEY: z.string().max(16384),
        KIMI_MODEL_API_KEY: z.string().max(16384),
        API_SERVER_KEY: z.string().max(16384),
        ZAI_API_KEY: z.string().max(16384),
        KIMI_API_KEY: z.string().max(16384),
        MINIMAX_API_KEY: z.string().max(16384),
    }).partial().strict().optional(),
    adapterConfig: adapterConfigSchema.optional().default({}),
    /**
     * Optional environment to run the adapter test inside. When omitted, the
     * test runs against the local Paperclip host. When provided and the
     * environment is non-local (SSH/sandbox), the test probes are executed
     * inside that environment so the result reflects real agent execution.
     */
    environmentId: z.string().guid().optional().nullable(),
});
export const updateAgentPermissionsSchema = z.object({
    canCreateAgents: z.boolean(),
    canCreateSkills: z.boolean().optional(),
    canAssignTasks: z.boolean(),
    trustPreset: trustPresetSchema.optional(),
    authorizationPolicy: trustAuthorizationPolicySchema.optional(),
});
//# sourceMappingURL=agent.js.map