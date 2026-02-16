/**
 * Vercel AI SDK integration helpers.
 *
 * This module is intentionally framework-agnostic: it returns a `(req) => Response` handler
 * that works in Next.js route handlers and other Fetch-based runtimes.
 */
export interface CreateChatHandlerOptions {
    /**
     * Resolve tenantId from the incoming request (e.g., from headers/session).
     * Return null/undefined for the default tenant.
     */
    tenantResolver?: (req: Request) => Promise<number | null> | number | null;
    /**
     * How many historical messages to load from Postgres for memory.
     */
    historyLimit?: number;
    /**
     * Default model id (if your consumer wants to pass it through).
     * Not used directly by the SDK.
     */
    defaultModel?: string;
    /**
     * Override system prompt fallback.
     */
    defaultSystemPrompt?: string;
    /**
     * Retrieve RAG docs; defaults to pgvector similarity search.
     */
    retrieveContext?: (args: {
        agentId: string;
        input: string;
        k: number;
        minSimilarity: number;
    }) => Promise<{
        pageContent: string;
        metadata?: any;
    }[]>;
    /**
     * Vercel AI SDK streamText + helpers; passed in from the consuming app.
     * Example (Next.js): `{ streamText, convertToCoreMessages }` from "ai".
     */
    ai: {
        streamText: any;
    };
    /**
     * Model instance (LanguageModelV1) from the consuming app.
     * Example: `openai("gpt-4o")` from "@ai-sdk/openai".
     */
    model: any;
}
export declare function createChatHandler(options: CreateChatHandlerOptions): (req: Request) => Promise<Response>;
//# sourceMappingURL=chat.d.ts.map