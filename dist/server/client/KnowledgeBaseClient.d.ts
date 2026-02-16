import { ClientConfig, ClientTrainRequest, ClientQueryRequest, ClientQueryResponse, Agent, AgentFile } from "../types";
export declare class KnowledgeBaseClient {
    private baseUrl;
    private apiKey?;
    constructor(config: ClientConfig);
    private getHeaders;
    private request;
    /**
     * Train an agent with files and/or URLs
     */
    train(request: ClientTrainRequest): Promise<{
        success: boolean;
        agentId: string;
        documentsProcessed: number;
        tokensUsed: number;
    }>;
    /**
     * Query an agent
     */
    query(request: ClientQueryRequest): Promise<ClientQueryResponse>;
    /**
     * Stream query an agent
     */
    streamQuery(request: ClientQueryRequest): AsyncGenerator<string, void, unknown>;
    /**
     * Get agent status
     */
    getAgent(agentId: string): Promise<Agent>;
    /**
     * List all agents
     */
    listAgents(tenantId?: number): Promise<Agent[]>;
    /**
     * Get agent files
     */
    getAgentFiles(agentId: string): Promise<AgentFile[]>;
    /**
     * Delete a file
     */
    deleteFile(fileId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Update agent
     */
    updateAgent(agentId: string, data: {
        systemPrompt?: string;
    }): Promise<Agent>;
    /**
     * Delete an agent
     */
    deleteAgent(agentId: string): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=KnowledgeBaseClient.d.ts.map