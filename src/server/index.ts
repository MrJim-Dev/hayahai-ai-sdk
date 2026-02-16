// HayahAI SDK — Server entry point
// Re-exports all server-side RAG/training/tools from the knowledge-base-sdk

export {
  // Core DB
  executeQuery,
  getPool,
  // Embeddings
  getEmbeddings,
  // Vector store
  similaritySearch,
  // Storage
  uploadFileToS3,
  uploadFilesToS3,
  uploadFileToContextFolder,
  uploadFilesToContextFolder,
  deleteFileFromS3,
  // Chat memory
  appendChatMessage,
  appendChatMessages,
  getThreadMessages,
  // Chat handler
  createChatHandler,
  // Training
  trainAgent,
  getAgentStatus,
  listAgents,
  getAgentFiles,
  deleteFile,
  updateAgent,
  deleteAgent,
  // Retrieval
  queryAgent,
  queryAgentWithTools,
  streamQueryAgent,
  // Tools
  createSearchTripsTool,
  createGetFareRatesTool,
  createGetVehicleRatesTool,
  // Client
  KnowledgeBaseClient,
} from "@ayahay/knowledge-base-sdk";

export type {
  Document,
  TrainingResult,
  Agent,
  AgentFile,
  TrainOptions,
  QueryOptions,
  ChatMessageRow,
  AppendChatMessageInput,
  GetThreadMessagesInput,
  CreateChatHandlerOptions,
  UploadResult,
  ClientConfig,
  ClientTrainRequest,
  ClientQueryRequest,
  ClientQueryResponse,
  ToolContext,
} from "@ayahay/knowledge-base-sdk";
