// HayahAI SDK — Server entry point
// All server-side RAG/training/tools consolidated from knowledge-base-sdk

// Core DB
export { executeQuery, getPool } from "./core/db";

// Embeddings
export { getEmbeddings } from "./core/embeddings";

// Vector store
export { similaritySearch } from "./core/vectorstore";

// Storage
export {
  uploadFileToS3,
  uploadFilesToS3,
  uploadFileToContextFolder,
  uploadFilesToContextFolder,
  deleteFileFromS3,
} from "./core/storage";

// Chat memory
export {
  appendChatMessage,
  appendChatMessages,
  getThreadMessages,
} from "./core/chatMemory";

// Chat handler
export { createChatHandler } from "./core/chat";

// Training
export {
  trainAgent,
  getAgentStatus,
  listAgents,
  getAgentFiles,
  deleteFile,
  updateAgent,
  deleteAgent,
} from "./core/training";

// Retrieval
export {
  queryAgent,
  queryAgentWithTools,
  streamQueryAgent,
} from "./core/retrieval";

// Tools
export {
  createSearchTripsTool,
  createGetFareRatesTool,
  createGetVehicleRatesTool,
} from "./core/tools";
export type { ToolContext } from "./core/tools";

// Client SDK (browser/frontend)
export { KnowledgeBaseClient } from "./client/KnowledgeBaseClient";

// Types
export type {
  Document,
  TrainingResult,
  Agent,
  AgentFile,
  TrainOptions,
  QueryOptions,
  ClientConfig,
  ClientTrainRequest,
  ClientQueryRequest,
  ClientQueryResponse,
} from "./types";

// Chat types
export type {
  ChatMessageRow,
  AppendChatMessageInput,
  GetThreadMessagesInput,
} from "./core/chatMemory";
export type { CreateChatHandlerOptions } from "./core/chat";

// Storage types
export type { UploadResult } from "./core/storage";
