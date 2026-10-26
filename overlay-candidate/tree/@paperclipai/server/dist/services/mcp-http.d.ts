/** The Accept header value required by the MCP Streamable HTTP transport. */
export declare const MCP_HTTP_ACCEPT = "application/json, text/event-stream";
export declare const MCP_PROTOCOL_VERSION = "2025-06-18";
/**
 * Default headers for an MCP Streamable HTTP JSON-RPC POST. Caller-supplied
 * headers (e.g. resolved credentials) are preserved, while the required
 * Streamable HTTP Accept value is kept authoritative.
 */
export declare function mcpHttpRequestHeaders(extra?: Record<string, string>): Record<string, string>;
export declare class McpHttpInitializationError extends Error {
    readonly stage: "initialize" | "initialized_notification";
    readonly status: number | null;
    constructor(message: string, stage: "initialize" | "initialized_notification", status: number | null);
}
/**
 * Establish the short-lived Streamable HTTP session needed by stateful MCP
 * servers. The returned headers belong only to the caller's next request; no
 * session id is persisted with the connection or shared across operations.
 */
export declare function initializeMcpHttpSession(input: {
    send: (init: RequestInit) => Promise<Response>;
    headers?: Record<string, string>;
    requestId: string;
}): Promise<Record<string, string>>;
/**
 * Parse the body of an MCP Streamable HTTP response into its JSON-RPC payload.
 *
 * Handles both response shapes the transport allows:
 *  - `application/json`: the body is the JSON-RPC message directly.
 *  - `text/event-stream`: one or more SSE events; we return the JSON payload of
 *    the first `data:` event that parses as a JSON-RPC message.
 *
 * Falls back to a plain JSON parse when the content type is unknown so we stay
 * compatible with non-compliant servers that ignore the Accept header.
 */
export declare function parseMcpHttpResponseBody(bodyText: string, contentType: string | null): unknown;
/** MCP structuredContent is optional, but when present it must be a JSON object. */
export declare function mcpStructuredContent(value: unknown): {
    structuredContent?: Record<string, unknown>;
};
export declare function mcpTextResult(value: unknown): {
    structuredContent?: Record<string, unknown>;
    content: {
        type: "text";
        text: string;
    }[];
};
//# sourceMappingURL=mcp-http.d.ts.map