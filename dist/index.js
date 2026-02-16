"use strict";
// HayahAI SDK — Main entry point
// Types + Client + Theme (works in any JS environment)
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeTheme = exports.defaultTheme = exports.HayahAIClient = void 0;
__exportStar(require("./types"), exports);
var client_1 = require("./client");
Object.defineProperty(exports, "HayahAIClient", { enumerable: true, get: function () { return client_1.HayahAIClient; } });
var theme_1 = require("./theme");
Object.defineProperty(exports, "defaultTheme", { enumerable: true, get: function () { return theme_1.defaultTheme; } });
Object.defineProperty(exports, "mergeTheme", { enumerable: true, get: function () { return theme_1.mergeTheme; } });
//# sourceMappingURL=index.js.map