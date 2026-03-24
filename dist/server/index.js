"use strict";
// HayahAI SDK — Server entry point
// All server-side RAG/training/tools consolidated from knowledge-base-sdk
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeBaseClient = exports.createGetScheduleSummaryTool = exports.createGetPortInfoTool = exports.createCheckBookingStatusTool = exports.createEscalateToSupportTool = exports.createGetVehicleRatesTool = exports.createGetFareRatesTool = exports.createSearchTripsTool = exports.clearAgentCache = exports.getCurrentProvider = exports.streamQueryAgent = exports.queryAgentWithTools = exports.queryAgent = exports.deleteAgent = exports.updateAgent = exports.deleteFile = exports.getAgentFiles = exports.listAgents = exports.getAgentStatus = exports.trainAgent = exports.createChatHandler = exports.getThreadMessages = exports.appendChatMessages = exports.appendChatMessage = exports.deleteFileFromS3 = exports.uploadFilesToContextFolder = exports.uploadFileToContextFolder = exports.uploadFilesToS3 = exports.uploadFileToS3 = exports.similaritySearch = exports.getEmbeddings = exports.getPool = exports.executeQuery = void 0;
// Core DB
var db_1 = require("./core/db");
Object.defineProperty(exports, "executeQuery", { enumerable: true, get: function () { return db_1.executeQuery; } });
Object.defineProperty(exports, "getPool", { enumerable: true, get: function () { return db_1.getPool; } });
// Embeddings
var embeddings_1 = require("./core/embeddings");
Object.defineProperty(exports, "getEmbeddings", { enumerable: true, get: function () { return embeddings_1.getEmbeddings; } });
// Vector store
var vectorstore_1 = require("./core/vectorstore");
Object.defineProperty(exports, "similaritySearch", { enumerable: true, get: function () { return vectorstore_1.similaritySearch; } });
// Storage
var storage_1 = require("./core/storage");
Object.defineProperty(exports, "uploadFileToS3", { enumerable: true, get: function () { return storage_1.uploadFileToS3; } });
Object.defineProperty(exports, "uploadFilesToS3", { enumerable: true, get: function () { return storage_1.uploadFilesToS3; } });
Object.defineProperty(exports, "uploadFileToContextFolder", { enumerable: true, get: function () { return storage_1.uploadFileToContextFolder; } });
Object.defineProperty(exports, "uploadFilesToContextFolder", { enumerable: true, get: function () { return storage_1.uploadFilesToContextFolder; } });
Object.defineProperty(exports, "deleteFileFromS3", { enumerable: true, get: function () { return storage_1.deleteFileFromS3; } });
// Chat memory
var chatMemory_1 = require("./core/chatMemory");
Object.defineProperty(exports, "appendChatMessage", { enumerable: true, get: function () { return chatMemory_1.appendChatMessage; } });
Object.defineProperty(exports, "appendChatMessages", { enumerable: true, get: function () { return chatMemory_1.appendChatMessages; } });
Object.defineProperty(exports, "getThreadMessages", { enumerable: true, get: function () { return chatMemory_1.getThreadMessages; } });
// Chat handler
var chat_1 = require("./core/chat");
Object.defineProperty(exports, "createChatHandler", { enumerable: true, get: function () { return chat_1.createChatHandler; } });
// Training
var training_1 = require("./core/training");
Object.defineProperty(exports, "trainAgent", { enumerable: true, get: function () { return training_1.trainAgent; } });
Object.defineProperty(exports, "getAgentStatus", { enumerable: true, get: function () { return training_1.getAgentStatus; } });
Object.defineProperty(exports, "listAgents", { enumerable: true, get: function () { return training_1.listAgents; } });
Object.defineProperty(exports, "getAgentFiles", { enumerable: true, get: function () { return training_1.getAgentFiles; } });
Object.defineProperty(exports, "deleteFile", { enumerable: true, get: function () { return training_1.deleteFile; } });
Object.defineProperty(exports, "updateAgent", { enumerable: true, get: function () { return training_1.updateAgent; } });
Object.defineProperty(exports, "deleteAgent", { enumerable: true, get: function () { return training_1.deleteAgent; } });
// Retrieval
var retrieval_1 = require("./core/retrieval");
Object.defineProperty(exports, "queryAgent", { enumerable: true, get: function () { return retrieval_1.queryAgent; } });
Object.defineProperty(exports, "queryAgentWithTools", { enumerable: true, get: function () { return retrieval_1.queryAgentWithTools; } });
Object.defineProperty(exports, "streamQueryAgent", { enumerable: true, get: function () { return retrieval_1.streamQueryAgent; } });
Object.defineProperty(exports, "getCurrentProvider", { enumerable: true, get: function () { return retrieval_1.getCurrentProvider; } });
Object.defineProperty(exports, "clearAgentCache", { enumerable: true, get: function () { return retrieval_1.clearAgentCache; } });
// Tools
var tools_1 = require("./core/tools");
Object.defineProperty(exports, "createSearchTripsTool", { enumerable: true, get: function () { return tools_1.createSearchTripsTool; } });
Object.defineProperty(exports, "createGetFareRatesTool", { enumerable: true, get: function () { return tools_1.createGetFareRatesTool; } });
Object.defineProperty(exports, "createGetVehicleRatesTool", { enumerable: true, get: function () { return tools_1.createGetVehicleRatesTool; } });
Object.defineProperty(exports, "createEscalateToSupportTool", { enumerable: true, get: function () { return tools_1.createEscalateToSupportTool; } });
Object.defineProperty(exports, "createCheckBookingStatusTool", { enumerable: true, get: function () { return tools_1.createCheckBookingStatusTool; } });
Object.defineProperty(exports, "createGetPortInfoTool", { enumerable: true, get: function () { return tools_1.createGetPortInfoTool; } });
Object.defineProperty(exports, "createGetScheduleSummaryTool", { enumerable: true, get: function () { return tools_1.createGetScheduleSummaryTool; } });
// Client SDK (browser/frontend)
var KnowledgeBaseClient_1 = require("./client/KnowledgeBaseClient");
Object.defineProperty(exports, "KnowledgeBaseClient", { enumerable: true, get: function () { return KnowledgeBaseClient_1.KnowledgeBaseClient; } });
//# sourceMappingURL=index.js.map