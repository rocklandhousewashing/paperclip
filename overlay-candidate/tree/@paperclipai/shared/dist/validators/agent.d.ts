import { z } from "zod";
export declare const agentPermissionsSchema: z.ZodObject<{
    canCreateAgents: z.ZodOptional<z.ZodBoolean>;
    canCreateSkills: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    trustPreset: z.ZodOptional<z.ZodEnum<{
        low_trust_review: "low_trust_review";
        standard: "standard";
    }>>;
    authorizationPolicy: z.ZodOptional<z.ZodObject<{
        trustPreset: z.ZodOptional<z.ZodEnum<{
            low_trust_review: "low_trust_review";
            standard: "standard";
        }>>;
        reviewPreset: z.ZodOptional<z.ZodObject<{
            id: z.ZodLiteral<"low_trust_review">;
            version: z.ZodLiteral<1>;
            rawOutputDisposition: z.ZodLiteral<"quarantine">;
        }, z.core.$strict>>;
        trustBoundary: z.ZodOptional<z.ZodObject<{
            mode: z.ZodLiteral<"low_trust_review">;
            companyId: z.ZodOptional<z.ZodString>;
            projectIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            rootIssueId: z.ZodOptional<z.ZodString>;
            issueIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            allowedAgentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            allowedSecretBindingIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            allowedToolClasses: z.ZodOptional<z.ZodArray<z.ZodString>>;
            outputPromotionTarget: z.ZodOptional<z.ZodObject<{
                type: z.ZodLiteral<"issue">;
                issueId: z.ZodString;
            }, z.core.$strict>>;
        }, z.core.$strict>>;
        assignmentPolicy: z.ZodOptional<z.ZodObject<{
            mode: z.ZodOptional<z.ZodEnum<{
                company_default: "company_default";
                protected: "protected";
            }>>;
            protectedAgentRequiresApproval: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$catchall<z.ZodUnknown>>>;
        protectedAgent: z.ZodOptional<z.ZodObject<{
            blockAssignment: z.ZodOptional<z.ZodBoolean>;
            blockReason: z.ZodOptional<z.ZodString>;
            requiresApproval: z.ZodOptional<z.ZodBoolean>;
            approvalReason: z.ZodOptional<z.ZodString>;
        }, z.core.$catchall<z.ZodUnknown>>>;
    }, z.core.$catchall<z.ZodUnknown>>>;
}, z.core.$catchall<z.ZodUnknown>>;
export declare const agentInstructionsBundleModeSchema: z.ZodEnum<{
    external: "external";
    managed: "managed";
}>;
export declare const updateAgentInstructionsBundleSchema: z.ZodObject<{
    mode: z.ZodOptional<z.ZodEnum<{
        external: "external";
        managed: "managed";
    }>>;
    rootPath: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    entryFile: z.ZodOptional<z.ZodString>;
    clearLegacyPromptTemplate: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export type UpdateAgentInstructionsBundle = z.infer<typeof updateAgentInstructionsBundleSchema>;
export declare const upsertAgentInstructionsFileSchema: z.ZodObject<{
    path: z.ZodString;
    content: z.ZodString;
    clearLegacyPromptTemplate: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export type UpsertAgentInstructionsFile = z.infer<typeof upsertAgentInstructionsFileSchema>;
export declare const createAgentInstructionsBundleSchema: z.ZodObject<{
    entryFile: z.ZodOptional<z.ZodString>;
    files: z.ZodRecord<z.ZodString, z.ZodString>;
}, z.core.$strip>;
export declare const agentRuntimeConfigSchema: z.ZodObject<{
    aiConnection: z.ZodOptional<z.ZodDiscriminatedUnion<[z.ZodObject<{
        provider: z.ZodEnum<{
            anthropic: "anthropic";
            openai: "openai";
            openrouter: "openrouter";
            xai: "xai";
        }>;
        method: z.ZodEnum<{
            api_key: "api_key";
            subscription: "subscription";
        }>;
        mode: z.ZodLiteral<"responsible_user">;
    }, z.core.$strict>, z.ZodObject<{
        provider: z.ZodEnum<{
            anthropic: "anthropic";
            openai: "openai";
            openrouter: "openrouter";
            xai: "xai";
        }>;
        method: z.ZodEnum<{
            api_key: "api_key";
            subscription: "subscription";
        }>;
        mode: z.ZodLiteral<"shared">;
        connectionId: z.ZodString;
        grantId: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        provider: z.ZodEnum<{
            anthropic: "anthropic";
            openai: "openai";
            openrouter: "openrouter";
            xai: "xai";
        }>;
        method: z.ZodEnum<{
            api_key: "api_key";
            subscription: "subscription";
        }>;
        mode: z.ZodLiteral<"delegated">;
        connectionId: z.ZodString;
        grantId: z.ZodString;
    }, z.core.$strict>], "mode">>;
    debug: z.ZodOptional<z.ZodObject<{
        providerTrace: z.ZodOptional<z.ZodLiteral<"raw">>;
    }, z.core.$strict>>;
}, z.core.$catchall<z.ZodUnknown>>;
export declare const createAgentSchema: z.ZodObject<{
    name: z.ZodString;
    role: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        ceo: "ceo";
        cfo: "cfo";
        cmo: "cmo";
        cto: "cto";
        designer: "designer";
        devops: "devops";
        engineer: "engineer";
        general: "general";
        pm: "pm";
        qa: "qa";
        researcher: "researcher";
        security: "security";
    }>>>;
    title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    icon: z.ZodNullable<z.ZodOptional<z.ZodEnum<{
        atom: "atom";
        bot: "bot";
        brain: "brain";
        bug: "bug";
        "circuit-board": "circuit-board";
        code: "code";
        cog: "cog";
        cpu: "cpu";
        crown: "crown";
        database: "database";
        eye: "eye";
        "file-code": "file-code";
        fingerprint: "fingerprint";
        flame: "flame";
        gem: "gem";
        "git-branch": "git-branch";
        globe: "globe";
        hammer: "hammer";
        heart: "heart";
        hexagon: "hexagon";
        lightbulb: "lightbulb";
        lock: "lock";
        mail: "mail";
        "message-square": "message-square";
        microscope: "microscope";
        package: "package";
        pentagon: "pentagon";
        puzzle: "puzzle";
        radar: "radar";
        rocket: "rocket";
        search: "search";
        shield: "shield";
        sparkles: "sparkles";
        star: "star";
        swords: "swords";
        target: "target";
        telescope: "telescope";
        terminal: "terminal";
        wand: "wand";
        wrench: "wrench";
        zap: "zap";
    }>>>;
    reportsTo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    capabilities: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    desiredSkills: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        key: z.ZodString;
        versionId: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>]>>>;
    adapterType: z.ZodDefault<z.ZodString>;
    adapterConfig: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    instructionsBundle: z.ZodOptional<z.ZodObject<{
        entryFile: z.ZodOptional<z.ZodString>;
        files: z.ZodRecord<z.ZodString, z.ZodString>;
    }, z.core.$strip>>;
    runtimeConfig: z.ZodDefault<z.ZodOptional<z.ZodObject<{
        aiConnection: z.ZodOptional<z.ZodDiscriminatedUnion<[z.ZodObject<{
            provider: z.ZodEnum<{
                anthropic: "anthropic";
                openai: "openai";
                openrouter: "openrouter";
                xai: "xai";
            }>;
            method: z.ZodEnum<{
                api_key: "api_key";
                subscription: "subscription";
            }>;
            mode: z.ZodLiteral<"responsible_user">;
        }, z.core.$strict>, z.ZodObject<{
            provider: z.ZodEnum<{
                anthropic: "anthropic";
                openai: "openai";
                openrouter: "openrouter";
                xai: "xai";
            }>;
            method: z.ZodEnum<{
                api_key: "api_key";
                subscription: "subscription";
            }>;
            mode: z.ZodLiteral<"shared">;
            connectionId: z.ZodString;
            grantId: z.ZodString;
        }, z.core.$strict>, z.ZodObject<{
            provider: z.ZodEnum<{
                anthropic: "anthropic";
                openai: "openai";
                openrouter: "openrouter";
                xai: "xai";
            }>;
            method: z.ZodEnum<{
                api_key: "api_key";
                subscription: "subscription";
            }>;
            mode: z.ZodLiteral<"delegated">;
            connectionId: z.ZodString;
            grantId: z.ZodString;
        }, z.core.$strict>], "mode">>;
        debug: z.ZodOptional<z.ZodObject<{
            providerTrace: z.ZodOptional<z.ZodLiteral<"raw">>;
        }, z.core.$strict>>;
    }, z.core.$catchall<z.ZodUnknown>>>>;
    defaultEnvironmentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    budgetMonthlyCents: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    permissions: z.ZodOptional<z.ZodObject<{
        canCreateAgents: z.ZodOptional<z.ZodBoolean>;
        canCreateSkills: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        trustPreset: z.ZodOptional<z.ZodEnum<{
            low_trust_review: "low_trust_review";
            standard: "standard";
        }>>;
        authorizationPolicy: z.ZodOptional<z.ZodObject<{
            trustPreset: z.ZodOptional<z.ZodEnum<{
                low_trust_review: "low_trust_review";
                standard: "standard";
            }>>;
            reviewPreset: z.ZodOptional<z.ZodObject<{
                id: z.ZodLiteral<"low_trust_review">;
                version: z.ZodLiteral<1>;
                rawOutputDisposition: z.ZodLiteral<"quarantine">;
            }, z.core.$strict>>;
            trustBoundary: z.ZodOptional<z.ZodObject<{
                mode: z.ZodLiteral<"low_trust_review">;
                companyId: z.ZodOptional<z.ZodString>;
                projectIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
                rootIssueId: z.ZodOptional<z.ZodString>;
                issueIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
                allowedAgentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
                allowedSecretBindingIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
                allowedToolClasses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                outputPromotionTarget: z.ZodOptional<z.ZodObject<{
                    type: z.ZodLiteral<"issue">;
                    issueId: z.ZodString;
                }, z.core.$strict>>;
            }, z.core.$strict>>;
            assignmentPolicy: z.ZodOptional<z.ZodObject<{
                mode: z.ZodOptional<z.ZodEnum<{
                    company_default: "company_default";
                    protected: "protected";
                }>>;
                protectedAgentRequiresApproval: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$catchall<z.ZodUnknown>>>;
            protectedAgent: z.ZodOptional<z.ZodObject<{
                blockAssignment: z.ZodOptional<z.ZodBoolean>;
                blockReason: z.ZodOptional<z.ZodString>;
                requiresApproval: z.ZodOptional<z.ZodBoolean>;
                approvalReason: z.ZodOptional<z.ZodString>;
            }, z.core.$catchall<z.ZodUnknown>>>;
        }, z.core.$catchall<z.ZodUnknown>>>;
    }, z.core.$catchall<z.ZodUnknown>>>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    storedSessionId: z.ZodOptional<z.ZodString>;
    applyStoredClaudeLogin: z.ZodOptional<z.ZodBoolean>;
    onboardingFirstAgent: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type CreateAgent = z.infer<typeof createAgentSchema>;
export declare const builtInAgentProvisionSchema: z.ZodObject<{
    adapterType: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    adapterConfig: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    budgetMonthlyCents: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export type BuiltInAgentProvision = z.infer<typeof builtInAgentProvisionSchema>;
export declare const builtInAgentEmptyMutationSchema: z.ZodDefault<z.ZodObject<{}, z.core.$strict>>;
export type BuiltInAgentEmptyMutation = z.infer<typeof builtInAgentEmptyMutationSchema>;
export declare const builtInAgentResetSchema: z.ZodDefault<z.ZodObject<{
    resources: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        agent: "agent";
        instructions: "instructions";
        routine: "routine";
        skill: "skill";
    }>>>;
}, z.core.$strict>>;
export type BuiltInAgentReset = z.infer<typeof builtInAgentResetSchema>;
export declare const createAgentHireSchema: z.ZodObject<{
    name: z.ZodString;
    role: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        ceo: "ceo";
        cfo: "cfo";
        cmo: "cmo";
        cto: "cto";
        designer: "designer";
        devops: "devops";
        engineer: "engineer";
        general: "general";
        pm: "pm";
        qa: "qa";
        researcher: "researcher";
        security: "security";
    }>>>;
    title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    icon: z.ZodNullable<z.ZodOptional<z.ZodEnum<{
        atom: "atom";
        bot: "bot";
        brain: "brain";
        bug: "bug";
        "circuit-board": "circuit-board";
        code: "code";
        cog: "cog";
        cpu: "cpu";
        crown: "crown";
        database: "database";
        eye: "eye";
        "file-code": "file-code";
        fingerprint: "fingerprint";
        flame: "flame";
        gem: "gem";
        "git-branch": "git-branch";
        globe: "globe";
        hammer: "hammer";
        heart: "heart";
        hexagon: "hexagon";
        lightbulb: "lightbulb";
        lock: "lock";
        mail: "mail";
        "message-square": "message-square";
        microscope: "microscope";
        package: "package";
        pentagon: "pentagon";
        puzzle: "puzzle";
        radar: "radar";
        rocket: "rocket";
        search: "search";
        shield: "shield";
        sparkles: "sparkles";
        star: "star";
        swords: "swords";
        target: "target";
        telescope: "telescope";
        terminal: "terminal";
        wand: "wand";
        wrench: "wrench";
        zap: "zap";
    }>>>;
    reportsTo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    capabilities: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    desiredSkills: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        key: z.ZodString;
        versionId: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>]>>>;
    adapterType: z.ZodDefault<z.ZodString>;
    adapterConfig: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    instructionsBundle: z.ZodOptional<z.ZodObject<{
        entryFile: z.ZodOptional<z.ZodString>;
        files: z.ZodRecord<z.ZodString, z.ZodString>;
    }, z.core.$strip>>;
    runtimeConfig: z.ZodDefault<z.ZodOptional<z.ZodObject<{
        aiConnection: z.ZodOptional<z.ZodDiscriminatedUnion<[z.ZodObject<{
            provider: z.ZodEnum<{
                anthropic: "anthropic";
                openai: "openai";
                openrouter: "openrouter";
                xai: "xai";
            }>;
            method: z.ZodEnum<{
                api_key: "api_key";
                subscription: "subscription";
            }>;
            mode: z.ZodLiteral<"responsible_user">;
        }, z.core.$strict>, z.ZodObject<{
            provider: z.ZodEnum<{
                anthropic: "anthropic";
                openai: "openai";
                openrouter: "openrouter";
                xai: "xai";
            }>;
            method: z.ZodEnum<{
                api_key: "api_key";
                subscription: "subscription";
            }>;
            mode: z.ZodLiteral<"shared">;
            connectionId: z.ZodString;
            grantId: z.ZodString;
        }, z.core.$strict>, z.ZodObject<{
            provider: z.ZodEnum<{
                anthropic: "anthropic";
                openai: "openai";
                openrouter: "openrouter";
                xai: "xai";
            }>;
            method: z.ZodEnum<{
                api_key: "api_key";
                subscription: "subscription";
            }>;
            mode: z.ZodLiteral<"delegated">;
            connectionId: z.ZodString;
            grantId: z.ZodString;
        }, z.core.$strict>], "mode">>;
        debug: z.ZodOptional<z.ZodObject<{
            providerTrace: z.ZodOptional<z.ZodLiteral<"raw">>;
        }, z.core.$strict>>;
    }, z.core.$catchall<z.ZodUnknown>>>>;
    defaultEnvironmentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    budgetMonthlyCents: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    permissions: z.ZodOptional<z.ZodObject<{
        canCreateAgents: z.ZodOptional<z.ZodBoolean>;
        canCreateSkills: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        trustPreset: z.ZodOptional<z.ZodEnum<{
            low_trust_review: "low_trust_review";
            standard: "standard";
        }>>;
        authorizationPolicy: z.ZodOptional<z.ZodObject<{
            trustPreset: z.ZodOptional<z.ZodEnum<{
                low_trust_review: "low_trust_review";
                standard: "standard";
            }>>;
            reviewPreset: z.ZodOptional<z.ZodObject<{
                id: z.ZodLiteral<"low_trust_review">;
                version: z.ZodLiteral<1>;
                rawOutputDisposition: z.ZodLiteral<"quarantine">;
            }, z.core.$strict>>;
            trustBoundary: z.ZodOptional<z.ZodObject<{
                mode: z.ZodLiteral<"low_trust_review">;
                companyId: z.ZodOptional<z.ZodString>;
                projectIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
                rootIssueId: z.ZodOptional<z.ZodString>;
                issueIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
                allowedAgentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
                allowedSecretBindingIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
                allowedToolClasses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                outputPromotionTarget: z.ZodOptional<z.ZodObject<{
                    type: z.ZodLiteral<"issue">;
                    issueId: z.ZodString;
                }, z.core.$strict>>;
            }, z.core.$strict>>;
            assignmentPolicy: z.ZodOptional<z.ZodObject<{
                mode: z.ZodOptional<z.ZodEnum<{
                    company_default: "company_default";
                    protected: "protected";
                }>>;
                protectedAgentRequiresApproval: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$catchall<z.ZodUnknown>>>;
            protectedAgent: z.ZodOptional<z.ZodObject<{
                blockAssignment: z.ZodOptional<z.ZodBoolean>;
                blockReason: z.ZodOptional<z.ZodString>;
                requiresApproval: z.ZodOptional<z.ZodBoolean>;
                approvalReason: z.ZodOptional<z.ZodString>;
            }, z.core.$catchall<z.ZodUnknown>>>;
        }, z.core.$catchall<z.ZodUnknown>>>;
    }, z.core.$catchall<z.ZodUnknown>>>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    storedSessionId: z.ZodOptional<z.ZodString>;
    applyStoredClaudeLogin: z.ZodOptional<z.ZodBoolean>;
    onboardingFirstAgent: z.ZodOptional<z.ZodBoolean>;
    sourceIssueId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sourceIssueIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type CreateAgentHire = z.infer<typeof createAgentHireSchema>;
export declare const updateAgentSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        ceo: "ceo";
        cfo: "cfo";
        cmo: "cmo";
        cto: "cto";
        designer: "designer";
        devops: "devops";
        engineer: "engineer";
        general: "general";
        pm: "pm";
        qa: "qa";
        researcher: "researcher";
        security: "security";
    }>>>>;
    title: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    icon: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodEnum<{
        atom: "atom";
        bot: "bot";
        brain: "brain";
        bug: "bug";
        "circuit-board": "circuit-board";
        code: "code";
        cog: "cog";
        cpu: "cpu";
        crown: "crown";
        database: "database";
        eye: "eye";
        "file-code": "file-code";
        fingerprint: "fingerprint";
        flame: "flame";
        gem: "gem";
        "git-branch": "git-branch";
        globe: "globe";
        hammer: "hammer";
        heart: "heart";
        hexagon: "hexagon";
        lightbulb: "lightbulb";
        lock: "lock";
        mail: "mail";
        "message-square": "message-square";
        microscope: "microscope";
        package: "package";
        pentagon: "pentagon";
        puzzle: "puzzle";
        radar: "radar";
        rocket: "rocket";
        search: "search";
        shield: "shield";
        sparkles: "sparkles";
        star: "star";
        swords: "swords";
        target: "target";
        telescope: "telescope";
        terminal: "terminal";
        wand: "wand";
        wrench: "wrench";
        zap: "zap";
    }>>>>;
    reportsTo: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    capabilities: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    desiredSkills: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        key: z.ZodString;
        versionId: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>]>>>>;
    adapterType: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    adapterConfig: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>>;
    instructionsBundle: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        entryFile: z.ZodOptional<z.ZodString>;
        files: z.ZodRecord<z.ZodString, z.ZodString>;
    }, z.core.$strip>>>;
    runtimeConfig: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodObject<{
        aiConnection: z.ZodOptional<z.ZodDiscriminatedUnion<[z.ZodObject<{
            provider: z.ZodEnum<{
                anthropic: "anthropic";
                openai: "openai";
                openrouter: "openrouter";
                xai: "xai";
            }>;
            method: z.ZodEnum<{
                api_key: "api_key";
                subscription: "subscription";
            }>;
            mode: z.ZodLiteral<"responsible_user">;
        }, z.core.$strict>, z.ZodObject<{
            provider: z.ZodEnum<{
                anthropic: "anthropic";
                openai: "openai";
                openrouter: "openrouter";
                xai: "xai";
            }>;
            method: z.ZodEnum<{
                api_key: "api_key";
                subscription: "subscription";
            }>;
            mode: z.ZodLiteral<"shared">;
            connectionId: z.ZodString;
            grantId: z.ZodString;
        }, z.core.$strict>, z.ZodObject<{
            provider: z.ZodEnum<{
                anthropic: "anthropic";
                openai: "openai";
                openrouter: "openrouter";
                xai: "xai";
            }>;
            method: z.ZodEnum<{
                api_key: "api_key";
                subscription: "subscription";
            }>;
            mode: z.ZodLiteral<"delegated">;
            connectionId: z.ZodString;
            grantId: z.ZodString;
        }, z.core.$strict>], "mode">>;
        debug: z.ZodOptional<z.ZodObject<{
            providerTrace: z.ZodOptional<z.ZodLiteral<"raw">>;
        }, z.core.$strict>>;
    }, z.core.$catchall<z.ZodUnknown>>>>>;
    defaultEnvironmentId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    budgetMonthlyCents: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodNumber>>>;
    metadata: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>>;
    storedSessionId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    applyStoredClaudeLogin: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    permissions: z.ZodOptional<z.ZodNever>;
    replaceAdapterConfig: z.ZodOptional<z.ZodBoolean>;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        error: "error";
        idle: "idle";
        paused: "paused";
        pending_approval: "pending_approval";
        running: "running";
        terminated: "terminated";
    }>>;
    spentMonthlyCents: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type UpdateAgent = z.infer<typeof updateAgentSchema>;
export declare const updateAgentInstructionsPathSchema: z.ZodObject<{
    path: z.ZodNullable<z.ZodString>;
    adapterConfigKey: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type UpdateAgentInstructionsPath = z.infer<typeof updateAgentInstructionsPathSchema>;
export declare const taskBridgeAgentKeyScopeSchema: z.ZodObject<{
    kind: z.ZodLiteral<"task_bridge">;
    projectId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    projectIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    parentIssueId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    parentIssueIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    allowedAssigneeAgentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export declare const standardAgentKeyScopeSchema: z.ZodObject<{
    kind: z.ZodLiteral<"standard">;
}, z.core.$strict>;
export declare const skillTestAgentKeyScopeSchema: z.ZodObject<{
    kind: z.ZodLiteral<"skill_test">;
    issueId: z.ZodString;
}, z.core.$strict>;
export declare const agentApiKeyScopeSchema: z.ZodUnion<readonly [z.ZodObject<{
    kind: z.ZodLiteral<"standard">;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"task_bridge">;
    projectId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    projectIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    parentIssueId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    parentIssueIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    allowedAssigneeAgentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"skill_test">;
    issueId: z.ZodString;
}, z.core.$strict>]>;
export type AgentApiKeyScope = z.infer<typeof agentApiKeyScopeSchema>;
export type TaskBridgeAgentKeyScope = z.infer<typeof taskBridgeAgentKeyScopeSchema>;
export type SkillTestAgentKeyScope = z.infer<typeof skillTestAgentKeyScopeSchema>;
export declare function normalizeAgentApiKeyScope(value: unknown): AgentApiKeyScope;
export declare const createAgentKeySchema: z.ZodObject<{
    name: z.ZodDefault<z.ZodString>;
    scope: z.ZodDefault<z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
        kind: z.ZodLiteral<"standard">;
    }, z.core.$strict>, z.ZodObject<{
        kind: z.ZodLiteral<"task_bridge">;
        projectId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        projectIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        parentIssueId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        parentIssueIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        allowedAssigneeAgentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        kind: z.ZodLiteral<"skill_test">;
        issueId: z.ZodString;
    }, z.core.$strict>]>>>;
}, z.core.$strip>;
export type CreateAgentKey = z.infer<typeof createAgentKeySchema>;
export declare const agentMineInboxQuerySchema: z.ZodObject<{
    userId: z.ZodString;
    status: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type AgentMineInboxQuery = z.infer<typeof agentMineInboxQuerySchema>;
export declare const wakeAgentSchema: z.ZodObject<{
    source: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        assignment: "assignment";
        automation: "automation";
        on_demand: "on_demand";
        timer: "timer";
    }>>>;
    triggerDetail: z.ZodOptional<z.ZodEnum<{
        callback: "callback";
        manual: "manual";
        ping: "ping";
        system: "system";
    }>>;
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    failedRunId: z.ZodOptional<z.ZodString>;
    issueId: z.ZodOptional<z.ZodNever>;
    payload: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    idempotencyKey: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    forceFreshSession: z.ZodPreprocess<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    debug: z.ZodOptional<z.ZodObject<{
        providerTrace: z.ZodLiteral<"raw">;
    }, z.core.$strict>>;
}, z.core.$strip>;
export type WakeAgent = z.infer<typeof wakeAgentSchema>;
export declare const resetAgentSessionSchema: z.ZodObject<{
    taskKey: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type ResetAgentSession = z.infer<typeof resetAgentSessionSchema>;
export declare const testAdapterEnvironmentSchema: z.ZodObject<{
    aiConnection: z.ZodOptional<z.ZodDiscriminatedUnion<[z.ZodObject<{
        provider: z.ZodEnum<{
            anthropic: "anthropic";
            openai: "openai";
            openrouter: "openrouter";
            xai: "xai";
        }>;
        method: z.ZodEnum<{
            api_key: "api_key";
            subscription: "subscription";
        }>;
        mode: z.ZodLiteral<"responsible_user">;
    }, z.core.$strict>, z.ZodObject<{
        provider: z.ZodEnum<{
            anthropic: "anthropic";
            openai: "openai";
            openrouter: "openrouter";
            xai: "xai";
        }>;
        method: z.ZodEnum<{
            api_key: "api_key";
            subscription: "subscription";
        }>;
        mode: z.ZodLiteral<"shared">;
        connectionId: z.ZodString;
        grantId: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        provider: z.ZodEnum<{
            anthropic: "anthropic";
            openai: "openai";
            openrouter: "openrouter";
            xai: "xai";
        }>;
        method: z.ZodEnum<{
            api_key: "api_key";
            subscription: "subscription";
        }>;
        mode: z.ZodLiteral<"delegated">;
        connectionId: z.ZodString;
        grantId: z.ZodString;
    }, z.core.$strict>], "mode">>;
    agentId: z.ZodOptional<z.ZodString>;
    testCredentials: z.ZodOptional<z.ZodObject<{
        ANTHROPIC_API_KEY: z.ZodOptional<z.ZodString>;
        OPENAI_API_KEY: z.ZodOptional<z.ZodString>;
        OPENROUTER_API_KEY: z.ZodOptional<z.ZodString>;
        GEMINI_API_KEY: z.ZodOptional<z.ZodString>;
        XAI_API_KEY: z.ZodOptional<z.ZodString>;
        GROQ_API_KEY: z.ZodOptional<z.ZodString>;
        OPENCODE_API_KEY: z.ZodOptional<z.ZodString>;
        CURSOR_API_KEY: z.ZodOptional<z.ZodString>;
        KIMI_MODEL_API_KEY: z.ZodOptional<z.ZodString>;
        API_SERVER_KEY: z.ZodOptional<z.ZodString>;
        ZAI_API_KEY: z.ZodOptional<z.ZodString>;
        KIMI_API_KEY: z.ZodOptional<z.ZodString>;
        MINIMAX_API_KEY: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
    adapterConfig: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    environmentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type TestAdapterEnvironment = z.infer<typeof testAdapterEnvironmentSchema>;
export declare const updateAgentPermissionsSchema: z.ZodObject<{
    canCreateAgents: z.ZodBoolean;
    canCreateSkills: z.ZodOptional<z.ZodBoolean>;
    canAssignTasks: z.ZodBoolean;
    trustPreset: z.ZodOptional<z.ZodEnum<{
        low_trust_review: "low_trust_review";
        standard: "standard";
    }>>;
    authorizationPolicy: z.ZodOptional<z.ZodObject<{
        trustPreset: z.ZodOptional<z.ZodEnum<{
            low_trust_review: "low_trust_review";
            standard: "standard";
        }>>;
        reviewPreset: z.ZodOptional<z.ZodObject<{
            id: z.ZodLiteral<"low_trust_review">;
            version: z.ZodLiteral<1>;
            rawOutputDisposition: z.ZodLiteral<"quarantine">;
        }, z.core.$strict>>;
        trustBoundary: z.ZodOptional<z.ZodObject<{
            mode: z.ZodLiteral<"low_trust_review">;
            companyId: z.ZodOptional<z.ZodString>;
            projectIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            rootIssueId: z.ZodOptional<z.ZodString>;
            issueIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            allowedAgentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            allowedSecretBindingIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            allowedToolClasses: z.ZodOptional<z.ZodArray<z.ZodString>>;
            outputPromotionTarget: z.ZodOptional<z.ZodObject<{
                type: z.ZodLiteral<"issue">;
                issueId: z.ZodString;
            }, z.core.$strict>>;
        }, z.core.$strict>>;
        assignmentPolicy: z.ZodOptional<z.ZodObject<{
            mode: z.ZodOptional<z.ZodEnum<{
                company_default: "company_default";
                protected: "protected";
            }>>;
            protectedAgentRequiresApproval: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$catchall<z.ZodUnknown>>>;
        protectedAgent: z.ZodOptional<z.ZodObject<{
            blockAssignment: z.ZodOptional<z.ZodBoolean>;
            blockReason: z.ZodOptional<z.ZodString>;
            requiresApproval: z.ZodOptional<z.ZodBoolean>;
            approvalReason: z.ZodOptional<z.ZodString>;
        }, z.core.$catchall<z.ZodUnknown>>>;
    }, z.core.$catchall<z.ZodUnknown>>>;
}, z.core.$strip>;
export type UpdateAgentPermissions = z.infer<typeof updateAgentPermissionsSchema>;
//# sourceMappingURL=agent.d.ts.map