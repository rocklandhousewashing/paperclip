import type { Db } from "@paperclipai/db";
import type { ChatChannelService } from "../services/chat-channels.js";
import type { PluginWorkerManager } from "../services/plugin-worker-manager.js";
import { SetupTokenSessionService, type SetupTokenCleanupStore, type SetupTokenLeaseManager, type SetupTokenLoginProcessFactory, type SetupTokenSecretWriter } from "../services/setup-token-session.js";
import type { DeploymentMode } from "@paperclipai/shared";
export declare function agentRoutes(db: Db, options?: {
    chatRunRetries?: Pick<ChatChannelService, "prepareFailedChatRunRetry" | "processFailedChatRunRetry">;
    pluginWorkerManager?: PluginWorkerManager;
    /** The active deployment mode. The confidential transport guard reads it. */
    deploymentMode?: DeploymentMode;
    /**
     * The dedicated proxy IP or CIDR allowlist for the confidential setup-token
     * responses (SR-7). The global `TRUST_PROXY` setting does not satisfy the
     * guard; only a peer on this explicit allowlist may forward a TLS protocol.
     */
    confidentialProxyAllowlist?: string[];
    /**
     * The explicit operator declaration that a platform edge terminates TLS for
     * every client request (SR-7). Set from `CLAUDE_LOGIN_EDGE_TLS_TERMINATED`.
     * Use it on a managed PaaS where the app socket is always plain HTTP and
     * the edge-proxy peer addresses cannot be allowlisted.
     */
    confidentialEdgeTlsTerminated?: boolean;
    /**
     * Receives the setup-token login session service once the router builds it.
     * The caller registers the startup reaper and the graceful-shutdown cleanup.
     */
    onSetupTokenLoginService?: (service: SetupTokenSessionService) => void;
    /**
     * Binds the live setup-token login transport. When the caller provides it,
     * the session route is the live login path: the start route acquires a real
     * sandbox lease through `leases` and drives one live login process through
     * `factory`. When the caller omits it, the start route fails closed with the
     * fixed no-secret error, because the sandbox pseudo-terminal transport is not
     * bound yet. A test injects a fake factory and a fake lease manager to drive
     * the full route path.
     */
    setupTokenLogin?: {
        factory: SetupTokenLoginProcessFactory;
        leases: SetupTokenLeaseManager;
        /** The durable cleanup store. Defaults to the in-memory record store. */
        store?: SetupTokenCleanupStore;
        /**
         * The owner-bound secret writer. When the caller omits it, the completion
         * fails closed, because the secret sink is not bound yet.
         */
        completeCredential?: SetupTokenSecretWriter;
    };
}): import("express-serve-static-core").Router;
//# sourceMappingURL=agents.d.ts.map