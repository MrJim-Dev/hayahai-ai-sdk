"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultTheme = void 0;
exports.mergeTheme = mergeTheme;
exports.defaultTheme = {
    colors: {
        primary: "#2563eb",
        primaryHover: "#1d4ed8",
        headerBg: "#1a2b3b",
        headerText: "#ffffff",
        headerSubtext: "rgba(186, 230, 253, 0.8)",
        userBubble: "#2563eb",
        userBubbleText: "#ffffff",
        botBubble: "#ffffff",
        botBubbleText: "#1f2937",
        botBubbleBorder: "#f3f4f6",
        background: "#f8fafc",
        inputBg: "#f9fafb",
        inputText: "#111827",
        inputPlaceholder: "#9ca3af",
        inputBorder: "#e5e7eb",
        inputFocusBorder: "#93c5fd",
        border: "#e5e7eb",
        quickReplyBg: "#ffffff",
        quickReplyText: "#2563eb",
        quickReplyBorder: "#bfdbfe",
        quickReplyHoverBg: "#eff6ff",
        errorBg: "#fef2f2",
        errorText: "#dc2626",
        errorBorder: "#fee2e2",
        mutedText: "#6b7280",
    },
    borderRadius: {
        widget: "16px",
        bubble: "16px",
        button: "9999px",
        input: "9999px",
    },
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: {
        xs: "11px",
        sm: "13px",
        base: "14px",
        lg: "16px",
    },
    shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
};
/** Deep-merge a partial theme into the default theme */
function mergeTheme(overrides) {
    if (!overrides)
        return { ...exports.defaultTheme };
    const merged = { ...exports.defaultTheme };
    for (const key of Object.keys(overrides)) {
        const val = overrides[key];
        if (val && typeof val === "object" && !Array.isArray(val)) {
            merged[key] = { ...exports.defaultTheme[key], ...val };
        }
        else if (val !== undefined) {
            merged[key] = val;
        }
    }
    return merged;
}
//# sourceMappingURL=theme.js.map