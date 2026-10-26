import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { mcpStructuredContent, mcpTextResult } from "../services/mcp-http.js";
import { mcpGatewayProtocolRoutes } from "../routes/tool-gateway.js";
import type { ToolGatewayService } from "../services/tool-gateway.js";
import { runtimeConnectionIntentRoutes } from "../routes/connection-intents.js";

const runtime = vi.hoisted(() => ({ validate: vi.fn(), search: vi.fn(), request: vi.fn() }));
vi.mock("../services/connection-intents.js", () => ({ connectionIntentService: () => runtime }));
vi.mock("../runtime-tools-token.js", () => ({ verifyRuntimeToolsToken: () => ({ company_id: "fixture-company" }) }));

// MCP CallToolResult fields, with the text/image blocks exercised here. Validate
// the serialized wire response, so null cannot hide behind an optional TS type.
const callToolResultSchema = z.object({
  content: z.array(z.discriminatedUnion("type", [
    z.object({ type: z.literal("text"), text: z.string() }),
    z.object({ type: z.literal("image"), data: z.string(), mimeType: z.string() }),
  ])),
  structuredContent: z.record(z.string(), z.unknown()).optional(),
  isError: z.boolean().optional(),
});

afterEach(() => vi.clearAllMocks());

describe("MCP tool result serialization", () => {
  it.each([undefined, null, false, 42, "not an object", [], new Date(0)])("omits non-record structuredContent (%j)", (value) => {
    expect(mcpStructuredContent(value)).toEqual({});
    expect(mcpTextResult(value)).not.toHaveProperty("structuredContent");
    expect(callToolResultSchema.safeParse(JSON.parse(JSON.stringify(mcpTextResult(value)))).success).toBe(true);
  });

  it.each([{}, { asset: "fixture", nested: { frames: [1, 2] } }, Object.create(null)])("retains JSON objects (%j)", (value) => {
    expect(mcpStructuredContent(value)).toEqual({ structuredContent: value });
  });

  it.each([undefined, null, false, 42, "invalid", [], { code: "invalid_dimensions" }])("gateway sends valid provider error results (%j)", async (structuredContent) => {
    const content = [
      { type: "text", text: "generate-image failed: invalid image dimensions" },
      { type: "image", mimeType: "image/png", data: "Zml4dHVyZQ==" },
    ];
    const executeTool = vi.fn().mockResolvedValue({ result: {
      content: content[0]!.text,
      data: { content, structuredContent, isError: true, transport: "mcp_http" },
      error: "MCP tool returned an error result",
    } });
    const app = express().use(express.json()).use(mcpGatewayProtocolRoutes({ executeTool } as unknown as ToolGatewayService));
    const response = await request(app).post("/mcp/gateways/fixture")
      .set("authorization", "Bearer fixture-token")
      .send({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "generate-image", arguments: {} } }).expect(200);
    expect(callToolResultSchema.safeParse(response.body.result).success).toBe(true);
    expect(response.body.result).toMatchObject({ content: [content[0]], isError: true });
    if (structuredContent && typeof structuredContent === "object" && !Array.isArray(structuredContent)) {
      expect(response.body.result.structuredContent).toEqual(structuredContent);
    } else expect(response.body.result).not.toHaveProperty("structuredContent");
  });

  it("keeps arbitrary builtin data.content arrays inside the text result", async () => {
    const data = { content: [42, { arbitrary: true }] };
    const executeTool = vi.fn().mockResolvedValue({ result: { data } });
    const app = express().use(express.json()).use(mcpGatewayProtocolRoutes({ executeTool } as unknown as ToolGatewayService));
    const response = await request(app).post("/mcp/gateways/fixture")
      .set("authorization", "Bearer fixture-token")
      .send({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "builtin", arguments: {} } }).expect(200);
    expect(callToolResultSchema.safeParse(response.body.result).success).toBe(true);
    expect(response.body.result.content).toEqual([{ type: "text", text: JSON.stringify(data) }]);
    expect(response.body.result.structuredContent).toEqual(data);
  });

  it.each([undefined, null, "text", [], { results: [] }])("runtime-tools sends valid results (%j)", async (value) => {
    runtime.search.mockResolvedValue(value);
    const app = express().use(express.json()).use(runtimeConnectionIntentRoutes({} as never));
    const response = await request(app).post("/mcp/runtime-tools")
      .set("authorization", "Bearer fixture-token")
      .send({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "connections_search", arguments: {} } }).expect(200);
    expect(callToolResultSchema.safeParse(response.body.result).success).toBe(true);
    expect(response.body.result.content[0].text).toBe(JSON.stringify(value) ?? "null");
    expect(runtime.validate).toHaveBeenCalledOnce();
  });
});
