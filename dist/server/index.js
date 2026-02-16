"use strict";
// HayahAI SDK — Server entry point
// Re-exports all server-side RAG/training/tools from the knowledge-base-sdk
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeBaseClient = exports.createGetVehicleRatesTool = exports.createGetFareRatesTool = exports.createSearchTripsTool = exports.streamQueryAgent = exports.queryAgentWithTools = exports.queryAgent = exports.deleteAgent = exports.updateAgent = exports.deleteFile = exports.getAgentFiles = exports.listAgents = exports.getAgentStatus = exports.trainAgent = exports.createChatHandler = exports.getThreadMessages = exports.appendChatMessages = exports.appendChatMessage = exports.deleteFileFromS3 = exports.uploadFilesToContextFolder = exports.uploadFileToContextFolder = exports.uploadFilesToS3 = exports.uploadFileToS3 = exports.similaritySearch = exports.getEmbeddings = exports.getPool = exports.executeQuery = void 0;
var knowledge_base_sdk_1 = require("@ayahay/knowledge-base-sdk");
// Core DB
Object.defineProperty(exports, "executeQuery", { enumerable: true, get: function () { return knowledge_base_sdk_1.executeQuery; } });
Object.defineProperty(exports, "getPool", { enumerable: true, get: function () { return knowledge_base_sdk_1.getPool; } });
// Embeddings
Object.defineProperty(exports, "getEmbeddings", { enumerable: true, get: function () { return knowledge_base_sdk_1.getEmbeddings; } });
// Vector store
Object.defineProperty(exports, "similaritySearch", { enumerable: true, get: function () { return knowledge_base_sdk_1.similaritySearch; } });
// Storage
Object.defineProperty(exports, "uploadFileToS3", { enumerable: true, get: function () { return knowledge_base_sdk_1.uploadFileToS3; } });
Object.defineProperty(exports, "uploadFilesToS3", { enumerable: true, get: function () { return knowledge_base_sdk_1.uploadFilesToS3; } });
Object.defineProperty(exports, "uploadFileToContextFolder", { enumerable: true, get: function () { return knowledge_base_sdk_1.uploadFileToContextFolder; } });
Object.defineProperty(exports, "uploadFilesToContextFolder", { enumerable: true, get: function () { return knowledge_base_sdk_1.uploadFilesToContextFolder; } });
Object.defineProperty(exports, "deleteFileFromS3", { enumerable: true, get: function () { return knowledge_base_sdk_1.deleteFileFromS3; } });
// Chat memory
Object.defineProperty(exports, "appendChatMessage", { enumerable: true, get: function () { return knowledge_base_sdk_1.appendChatMessage; } });
Object.defineProperty(exports, "appendChatMessages", { enumerable: true, get: function () { return knowledge_base_sdk_1.appendChatMessages; } });
Object.defineProperty(exports, "getThreadMessages", { enumerable: true, get: function () { return knowledge_base_sdk_1.getThreadMessages; } });
// Chat handler
Object.defineProperty(exports, "createChatHandler", { enumerable: true, get: function () { return knowledge_base_sdk_1.createChatHandler; } });
// Training
Object.defineProperty(exports, "trainAgent", { enumerable: true, get: function () { return knowledge_base_sdk_1.trainAgent; } });
Object.defineProperty(exports, "getAgentStatus", { enumerable: true, get: function () { return knowledge_base_sdk_1.getAgentStatus; } });
Object.defineProperty(exports, "listAgents", { enumerable: true, get: function () { return knowledge_base_sdk_1.listAgents; } });
Object.defineProperty(exports, "getAgentFiles", { enumerable: true, get: function () { return knowledge_base_sdk_1.getAgentFiles; } });
Object.defineProperty(exports, "deleteFile", { enumerable: true, get: function () { return knowledge_base_sdk_1.deleteFile; } });
Object.defineProperty(exports, "updateAgent", { enumerable: true, get: function () { return knowledge_base_sdk_1.updateAgent; } });
Object.defineProperty(exports, "deleteAgent", { enumerable: true, get: function () { return knowledge_base_sdk_1.deleteAgent; } });
// Retrieval
Object.defineProperty(exports, "queryAgent", { enumerable: true, get: function () { return knowledge_base_sdk_1.queryAgent; } });
Object.defineProperty(exports, "queryAgentWithTools", { enumerable: true, get: function () { return knowledge_base_sdk_1.queryAgentWithTools; } });
Object.defineProperty(exports, "streamQueryAgent", { enumerable: true, get: function () { return knowledge_base_sdk_1.streamQueryAgent; } });
// Tools
Object.defineProperty(exports, "createSearchTripsTool", { enumerable: true, get: function () { return knowledge_base_sdk_1.createSearchTripsTool; } });
Object.defineProperty(exports, "createGetFareRatesTool", { enumerable: true, get: function () { return knowledge_base_sdk_1.createGetFareRatesTool; } });
Object.defineProperty(exports, "createGetVehicleRatesTool", { enumerable: true, get: function () { return knowledge_base_sdk_1.createGetVehicleRatesTool; } });
// Client
Object.defineProperty(exports, "KnowledgeBaseClient", { enumerable: true, get: function () { return knowledge_base_sdk_1.KnowledgeBaseClient; } });
//# sourceMappingURL=index.js.map