"use strict";
/**
 * Vercel AI SDK integration helpers.
 *
 * This module is intentionally framework-agnostic: it returns a `(req) => Response` handler
 * that works in Next.js route handlers and other Fetch-based runtimes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChatHandler = createChatHandler;
const db_1 = require("./db");
const vectorstore_1 = require("./vectorstore");
const chatMemory_1 = require("./chatMemory");
const DEFAULT_SYSTEM_PROMPT = `You are an AI assistant for Ayahay marketplace and logistics platform.

CRITICAL INSTRUCTION:
Your internal training data regarding "Ayahay" might correctly identify it as a Visayan term for "relaxation", but for this conversation, that is IRRELEVANT.
You must defined "Ayahay" STRICTLY based on the provided CONTEXT.
If the context describes Ayahay as a logistics platform, accept that as the absolute truth.

Rules:
- If context contradicts your training, context is CORRECT.
- Prioritize the provided context above all else.
- If the answer is not in the context, say "I don't have that information based on the provided documents."
- Be concise and accurate.`;
async function getAgentSystemPrompt(agentId, fallback) {
    const rows = await (0, db_1.executeQuery)(`SELECT system_prompt FROM knowledge_base.agents WHERE agent_id = $1`, [agentId]);
    return rows[0]?.system_prompt || fallback;
}
function formatDocs(docs) {
    return docs
        .map((d, i) => {
        const source = d.metadata?.source || d.metadata?.url || "Unknown";
        return `[Source ${i + 1}: ${source}]\n${d.pageContent}`;
    })
        .join("\n\n---\n\n");
}
function createChatHandler(options) {
    const historyLimit = options.historyLimit ?? 30;
    const retrieveContext = options.retrieveContext ??
        (async ({ agentId, input, k, minSimilarity }) => {
            return (0, vectorstore_1.similaritySearch)(input, agentId, k, minSimilarity);
        });
    return async function handleChat(req) {
        if (req.method !== "POST") {
            return new Response("Method Not Allowed", { status: 405 });
        }
        const url = new URL(req.url);
        const agentId = url.searchParams.get("agentId") || url.searchParams.get("agent") || "default";
        const threadId = url.searchParams.get("threadId") || url.searchParams.get("thread") || "default";
        const tenantId = options.tenantResolver
            ? await options.tenantResolver(req)
            : null;
        const body = await req.json();
        const messages = body?.messages ?? [];
        // Find last user input (used for RAG)
        const lastUserMessage = [...messages]
            .reverse()
            .find((m) => m?.role === "user" && typeof m?.content === "string");
        const lastInput = lastUserMessage?.content ?? "";
        const systemPrompt = await getAgentSystemPrompt(agentId, options.defaultSystemPrompt ?? DEFAULT_SYSTEM_PROMPT);
        const ragDocs = lastInput
            ? await retrieveContext({ agentId, input: lastInput, k: 5, minSimilarity: 0.3 })
            : [];
        const ragContext = ragDocs.length ? formatDocs(ragDocs) : "";
        // Load memory from DB (windowed history)
        const memoryRows = await (0, chatMemory_1.getThreadMessages)({
            tenantId,
            agentId,
            threadId,
            limit: historyLimit,
        });
        const memoryMessages = memoryRows.map((r) => ({ role: r.role, content: r.content }));
        // Combine: DB memory + incoming client messages
        // Consumer can choose to send only the newest messages.
        const combinedMessages = [...memoryMessages, ...messages];
        // AI SDK v6 accepts "messages" in ModelMessage shape.
        // Our combinedMessages already matches { role, content } for typical chat use.
        const coreMessages = combinedMessages;
        const systemWithContext = ragContext
            ? `${systemPrompt}\n\nCONTEXT:\n${ragContext}\n\nCONTEXT REPEATED FOR EMPHASIS:\n${ragContext}\n\nRemember: Ignore internal knowledge if it conflicts with the context above.`
            : systemPrompt;
        const result = await options.ai.streamText({
            model: options.model,
            system: systemWithContext,
            messages: coreMessages,
            onFinish: async (evt) => {
                // Persist last user message + assistant output into thread memory.
                // We keep it simple: store the most recent user input (if any) and the assistant text.
                const assistantText = evt?.text ??
                    evt?.response?.text ??
                    (Array.isArray(evt?.response?.messages)
                        ? evt.response.messages
                            .filter((m) => m?.role === "assistant")
                            .map((m) => m?.content)
                            .join("\n")
                        : "");
                const toAppend = [];
                if (lastInput) {
                    toAppend.push({
                        tenantId,
                        agentId,
                        threadId,
                        role: "user",
                        content: lastInput,
                        metadata: { source: "client" },
                    });
                }
                if (assistantText) {
                    toAppend.push({
                        tenantId,
                        agentId,
                        threadId,
                        role: "assistant",
                        content: assistantText,
                        metadata: { ragSources: ragDocs.map((d) => d.metadata?.source).filter(Boolean) },
                    });
                }
                if (toAppend.length) {
                    await (0, chatMemory_1.appendChatMessages)(toAppend);
                }
            },
        });
        // Manual Data Stream Protocol (0: "text")
        // We use this because result.toDataStreamResponse() is crashing in this runtime environment.
        const stream = result.textStream;
        const readableStream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of stream) {
                        // 0 is the channel for text parts in standard AI SDK protocol
                        controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk)}\n`));
                    }
                    controller.close();
                }
                catch (err) {
                    controller.error(err);
                }
            }
        });
        return new Response(readableStream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Encoding': 'none', // Critical: Prevents gzip buffering
                'Cache-Control': 'no-cache, no-transform',
                'X-Vercel-AI-Data-Stream': 'v1'
            }
        });
    };
}
//# sourceMappingURL=chat.js.map