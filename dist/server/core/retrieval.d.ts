import { QueryOptions } from "../types";
import { ToolContext } from "./tools";
export declare function queryAgent(agentId: string, query: string, options?: QueryOptions): Promise<string>;
/**
 * Query agent with tool calling support (non-streaming)
 */
export declare function queryAgentWithTools(agentId: string, query: string, options?: QueryOptions & {
    toolContext?: ToolContext;
}): Promise<string>;
export declare function streamQueryAgent(agentId: string, query: string, options?: QueryOptions & {
    toolContext?: ToolContext;
}): AsyncGenerator<string, void, unknown>;
/**
 * Clear agent cache for specific agent or all agents
 * @param agentId - Optional agent ID to clear cache for specific agent only
 */
export declare function clearAgentCache(agentId?: string): void;
/** Returns the name of the currently active LLM provider */
export declare function getCurrentProvider(): string;
//# sourceMappingURL=retrieval.d.ts.map