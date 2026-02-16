import { HayahAIClientConfig, AgentConfig } from "./types";
export declare class HayahAIClient {
    private baseUrl;
    private apiKey?;
    private tenantId?;
    private fetchFn;
    constructor(config: HayahAIClientConfig);
    private headers;
    private request;
    getAgentConfig(tenantId?: number, agentType?: string): Promise<AgentConfig | null>;
    saveAgentConfig(config: Partial<AgentConfig>, tenantId?: number, agentType?: string): Promise<AgentConfig | null>;
    deleteAgentConfig(tenantId?: number, agentType?: string): Promise<boolean>;
    chat(query: string, options?: {
        agentId?: string;
        tenantId?: number;
        history?: Array<{
            role: "user" | "assistant";
            content: string;
        }>;
        scope?: string;
    }): Promise<string>;
    train(request: {
        agentId: string;
        files?: File[];
        urls?: string[];
        systemPrompt?: string;
        tenantId?: number;
    }): Promise<{
        success: boolean;
        agentId: string;
        documentsProcessed: number;
    }>;
    listAgents(tenantId?: number): Promise<any[]>;
    getAgent(agentId: string): Promise<any>;
    deleteAgent(agentId: string): Promise<boolean>;
    getAgentFiles(agentId: string): Promise<any[]>;
    deleteFile(fileId: string): Promise<boolean>;
}
//# sourceMappingURL=client.d.ts.map