"use strict";
// HayahAI SDK — React entry point
// Customizable AI chatbot & trip search widgets
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeTheme = exports.defaultTheme = exports.TripSearchWidget = exports.ChatWidget = void 0;
var ChatWidget_1 = require("./ChatWidget");
Object.defineProperty(exports, "ChatWidget", { enumerable: true, get: function () { return __importDefault(ChatWidget_1).default; } });
var TripSearchWidget_1 = require("./TripSearchWidget");
Object.defineProperty(exports, "TripSearchWidget", { enumerable: true, get: function () { return __importDefault(TripSearchWidget_1).default; } });
// Re-export theme utilities
var theme_1 = require("../theme");
Object.defineProperty(exports, "defaultTheme", { enumerable: true, get: function () { return theme_1.defaultTheme; } });
Object.defineProperty(exports, "mergeTheme", { enumerable: true, get: function () { return theme_1.mergeTheme; } });
//# sourceMappingURL=index.js.map