import type { Db } from "@paperclipai/db";
import type { heartbeatService } from "../services/heartbeat.js";
export { RUNTIME_CONNECTION_TOOL_DEFINITIONS } from "../services/connection-tool-definitions.js";
/** Public, token-authenticated routes mounted before the general actor middleware. */
export declare function runtimeConnectionIntentRoutes(db: Db): import("express-serve-static-core").Router;
type Heartbeat = ReturnType<typeof heartbeatService>;
export { wakeConnectionIntentAfterResolution } from "../services/connection-intent-delivery.js";
export declare function connectionIntentBoardRoutes(db: Db, heartbeat: Heartbeat): import("express-serve-static-core").Router;
//# sourceMappingURL=connection-intents.d.ts.map