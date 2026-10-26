import { type Db } from "@paperclipai/db";
import type { PaperclipSkillEntry } from "@paperclipai/adapter-utils/server-utils";
import { type NativeRuntimeAssetReference, type NativeRuntimeContextSnapshot } from "../../vendor/paperclip-runner/index.js";
type RuntimeAgent = {
    id: string;
    companyId: string;
    name: string;
    adapterType?: string | null;
    adapterConfig: unknown;
};
type AssetFile = {
    path: string;
    content: Buffer;
    mode: number;
};
export declare function materializeAsset(files: AssetFile[]): Promise<NativeRuntimeAssetReference>;
export declare function resolveNativeRuntimeMcpSnapshot(input: {
    db: Db;
    agent: Pick<RuntimeAgent, "id" | "companyId">;
    runId: string;
}): Promise<{
    assignmentSetId: string;
    digest: string;
    bindingId: string | null;
}>;
export declare function buildNativeRuntimeContext(input: {
    db: Db;
    agent: RuntimeAgent;
    runId: string;
    runtimeConfig: Record<string, unknown>;
    runtimeSkillEntries: PaperclipSkillEntry[];
}): Promise<NativeRuntimeContextSnapshot>;
export {};
//# sourceMappingURL=runtime-context.d.ts.map