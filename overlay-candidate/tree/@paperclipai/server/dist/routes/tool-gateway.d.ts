import type { Db } from "@paperclipai/db";
import { type ToolGatewayService } from "../services/tool-gateway.js";
export declare function mcpGatewayProtocolRoutes(toolGateway: ToolGatewayService): import("express-serve-static-core").Router;
export declare function toolGatewayRoutes(db: Db, toolGateway: ToolGatewayService): import("express-serve-static-core").Router;
//# sourceMappingURL=tool-gateway.d.ts.map