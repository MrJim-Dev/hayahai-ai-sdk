"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ChatWidget;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const icons_1 = require("./icons");
const theme_1 = require("../theme");
// ─── Keyframes injected once ─────────────────────────────────────────────────
let styleInjected = false;
function injectKeyframes() {
    if (styleInjected || typeof document === "undefined")
        return;
    const style = document.createElement("style");
    style.textContent = `
    @keyframes hayahai-spin { to { transform: rotate(360deg); } }
    @keyframes hayahai-fadeIn { from { opacity:0; transform:translateY(8px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
    @keyframes hayahai-bounce { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-6px); } }
  `;
    document.head.appendChild(style);
    styleInjected = true;
}
// ─── Component ───────────────────────────────────────────────────────────────
function ChatWidget({ chatApiUrl = "/api/chat", configApiUrl = "/api/agent-config", tenantId = 1, agentId: propAgentId, threadId: propThreadId, theme: themeOverrides, displayName: propDisplayName, welcomeMessage: propWelcomeMessage, subtitle = "Ask about trip schedules, ticket prices, or booking assistance.", position = "bottom-right", defaultOpen = false, poweredByText = "Powered by HayahAI", onMessageSent, onResponseReceived, onError, className, zIndex = 100, }) {
    const t = (0, react_1.useMemo)(() => (0, theme_1.mergeTheme)(themeOverrides), [themeOverrides]);
    // ── State ───────────────────────────────────────────────────────────────
    const [isOpen, setIsOpen] = (0, react_1.useState)(defaultOpen);
    const [input, setInput] = (0, react_1.useState)("");
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [status, setStatus] = (0, react_1.useState)("idle");
    const [displayName, setDisplayName] = (0, react_1.useState)(propDisplayName || "AyahAI Assistant");
    const [welcomeMessage, setWelcomeMessage] = (0, react_1.useState)(propWelcomeMessage || "How can we help today?");
    const [resolvedAgentId, setResolvedAgentId] = (0, react_1.useState)(propAgentId || "");
    const scrollRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => { injectKeyframes(); }, []);
    // ── Load config ─────────────────────────────────────────────────────────
    (0, react_1.useEffect)(() => {
        if (propDisplayName && propAgentId)
            return; // skip if all overrides set
        (async () => {
            try {
                const res = await fetch(`${configApiUrl}?tenantId=${tenantId}&type=chatbot`);
                if (!res.ok)
                    return;
                const data = await res.json();
                const cfg = data?.config ?? data?.data?.config ?? null;
                if (!cfg)
                    return;
                if (!propDisplayName && cfg.displayName)
                    setDisplayName(cfg.displayName);
                if (!propWelcomeMessage && cfg.welcomeMessage)
                    setWelcomeMessage(cfg.welcomeMessage);
                if (!propAgentId && cfg.model)
                    setResolvedAgentId(cfg.model);
            }
            catch { /* silent */ }
        })();
    }, [tenantId, configApiUrl, propDisplayName, propWelcomeMessage, propAgentId]);
    const agentId = propAgentId || resolvedAgentId || "default";
    // ── Thread ID ───────────────────────────────────────────────────────────
    const threadId = (0, react_1.useMemo)(() => {
        if (propThreadId)
            return propThreadId;
        if (typeof window === "undefined")
            return "";
        const key = "hayahai_thread_id";
        const existing = window.sessionStorage.getItem(key);
        if (existing)
            return existing;
        const id = crypto.randomUUID();
        window.sessionStorage.setItem(key, id);
        return id;
    }, [propThreadId]);
    // ── Auto-scroll ─────────────────────────────────────────────────────────
    (0, react_1.useEffect)(() => {
        if (isOpen && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, status]);
    // ── Send ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || status === "loading")
            return;
        const userMsg = { id: crypto.randomUUID(), role: "user", text };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setStatus("loading");
        onMessageSent?.(text);
        try {
            const history = messages.map((m) => ({ role: m.role, content: m.text }));
            const res = await fetch(`${chatApiUrl}?agentId=${encodeURIComponent(agentId)}&tenantId=${tenantId}&threadId=${encodeURIComponent(threadId)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...history, { role: "user", content: text }],
                }),
            });
            if (!res.ok)
                throw new Error(`${res.status}`);
            const answer = await res.text();
            setMessages((prev) => [
                ...prev,
                { id: crypto.randomUUID(), role: "assistant", text: answer },
            ]);
            setStatus("idle");
            onResponseReceived?.(answer);
        }
        catch (err) {
            setStatus("error");
            onError?.(err instanceof Error ? err : new Error(String(err)));
            setTimeout(() => setStatus("idle"), 3000);
        }
    };
    // ── Styles ──────────────────────────────────────────────────────────────
    const isRight = position === "bottom-right";
    const s = buildStyles(t, isRight, zIndex);
    // ── Render ──────────────────────────────────────────────────────────────
    return ((0, jsx_runtime_1.jsxs)("div", { className: className, style: { fontFamily: t.fontFamily }, children: [isOpen && ((0, jsx_runtime_1.jsxs)("div", { style: s.panel, children: [(0, jsx_runtime_1.jsxs)("div", { style: s.header, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [(0, jsx_runtime_1.jsx)("div", { style: s.headerIcon, children: (0, jsx_runtime_1.jsx)(icons_1.IconBot, { size: 20, color: t.colors.headerSubtext }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: t.fontSize?.sm, fontWeight: 700, color: t.colors.headerText }, children: displayName }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: "10px", color: t.colors.headerSubtext }, children: "Support & Booking Helper" })] })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setIsOpen(false), style: s.closeBtn, "aria-label": "Close chat", children: (0, jsx_runtime_1.jsx)(icons_1.IconX, { size: 20, color: "rgba(255,255,255,0.7)" }) })] }), (0, jsx_runtime_1.jsx)("div", { ref: scrollRef, style: s.messagesArea, children: messages.length === 0 ? ((0, jsx_runtime_1.jsxs)("div", { style: s.emptyState, children: [(0, jsx_runtime_1.jsx)("div", { style: s.emptyIcon, children: (0, jsx_runtime_1.jsx)(icons_1.IconChat, { size: 32, color: t.colors.primary }) }), (0, jsx_runtime_1.jsxs)("div", { style: { maxWidth: 220 }, children: [(0, jsx_runtime_1.jsx)("p", { style: { fontSize: t.fontSize?.sm, fontWeight: 600, color: t.colors.inputText, margin: 0 }, children: welcomeMessage }), (0, jsx_runtime_1.jsx)("p", { style: { fontSize: t.fontSize?.xs, color: t.colors.mutedText, marginTop: 4 }, children: subtitle })] })] })) : ((0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "12px" }, children: [messages.map((m) => ((0, jsx_runtime_1.jsx)("div", { style: {
                                        ...s.bubble,
                                        ...(m.role === "user" ? s.userBubble : s.botBubble),
                                    }, children: (0, jsx_runtime_1.jsx)("div", { style: { whiteSpace: "pre-wrap", lineHeight: 1.5 }, children: m.text }) }, m.id))), status === "loading" && ((0, jsx_runtime_1.jsx)("div", { style: { ...s.bubble, ...s.botBubble, display: "flex", gap: 4, padding: "10px 16px" }, children: [0, 1, 2].map((i) => ((0, jsx_runtime_1.jsx)("span", { style: {
                                            width: 8, height: 8, borderRadius: "50%",
                                            backgroundColor: t.colors.primary,
                                            animation: `hayahai-bounce 1s ease-in-out ${i * 150}ms infinite`,
                                        } }, i))) })), status === "error" && ((0, jsx_runtime_1.jsx)("div", { style: s.errorBox, children: "Unable to connect. Please try again." }))] })) }), (0, jsx_runtime_1.jsxs)("div", { style: s.inputArea, children: [(0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, style: s.inputForm, children: [(0, jsx_runtime_1.jsx)("input", { value: input, onChange: (e) => setInput(e.target.value), placeholder: "Type your message...", style: s.input, disabled: status === "loading" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: status === "loading" || !input.trim(), style: {
                                            ...s.sendBtn,
                                            opacity: status === "loading" || !input.trim() ? 0.5 : 1,
                                        }, "aria-label": "Send message", children: (0, jsx_runtime_1.jsx)(icons_1.IconSend, { size: 16, color: "#fff" }) })] }), poweredByText && ((0, jsx_runtime_1.jsxs)("div", { style: s.poweredBy, children: [(0, jsx_runtime_1.jsx)(icons_1.IconBot, { size: 12 }), " ", (0, jsx_runtime_1.jsx)("span", { children: poweredByText })] }))] })] })), (0, jsx_runtime_1.jsx)("button", { onClick: () => setIsOpen(!isOpen), style: s.fab, "aria-label": "Toggle chat", children: isOpen ? (0, jsx_runtime_1.jsx)(icons_1.IconX, { size: 28, color: "#fff" }) : (0, jsx_runtime_1.jsx)(icons_1.IconChat, { size: 28, color: "#fff" }) })] }));
}
// ─── Style builder ───────────────────────────────────────────────────────────
function buildStyles(t, isRight, zIndex) {
    const base = {
        panel: {
            position: "fixed",
            bottom: 80,
            [isRight ? "right" : "left"]: 16,
            zIndex,
            width: "min(380px, 90vw)",
            overflow: "hidden",
            borderRadius: t.borderRadius.widget,
            border: `1px solid ${t.colors.border}`,
            backgroundColor: "#fff",
            boxShadow: t.shadow,
            animation: "hayahai-fadeIn .2s ease",
            display: "flex",
            flexDirection: "column",
        },
        header: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: t.colors.headerBg,
            padding: "12px 16px",
            color: t.colors.headerText,
        },
        headerIcon: {
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
        },
        closeBtn: {
            background: "none", border: "none", cursor: "pointer", padding: 6,
            borderRadius: "50%", display: "flex",
        },
        messagesArea: {
            height: 420, overflowY: "auto",
            background: t.colors.background,
            padding: 16,
            scrollBehavior: "smooth",
        },
        emptyState: {
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", height: "100%", gap: 16, textAlign: "center",
            color: t.colors.mutedText,
        },
        emptyIcon: {
            width: 64, height: 64, borderRadius: "50%",
            background: `${t.colors.primary}11`, display: "flex",
            alignItems: "center", justifyContent: "center",
            border: `1px solid ${t.colors.primary}22`,
        },
        bubble: {
            maxWidth: "85%", borderRadius: t.borderRadius.bubble,
            padding: "10px 16px", fontSize: t.fontSize?.sm,
            boxShadow: "0 1px 2px rgba(0,0,0,.05)",
        },
        userBubble: {
            marginLeft: "auto",
            background: t.colors.userBubble, color: t.colors.userBubbleText,
            borderBottomRightRadius: "4px",
        },
        botBubble: {
            background: t.colors.botBubble, color: t.colors.botBubbleText,
            border: `1px solid ${t.colors.botBubbleBorder}`,
            borderBottomLeftRadius: "4px",
        },
        errorBox: {
            borderRadius: 8, padding: 12, fontSize: t.fontSize?.xs,
            background: t.colors.errorBg, color: t.colors.errorText,
            border: `1px solid ${t.colors.errorBorder}`,
        },
        inputArea: {
            borderTop: `1px solid ${t.colors.border}`,
            background: "#fff", padding: 12,
        },
        inputForm: {
            display: "flex", alignItems: "center", gap: 8,
            borderRadius: t.borderRadius.input, border: `1px solid ${t.colors.inputBorder}`,
            background: t.colors.inputBg, padding: "4px 8px",
        },
        input: {
            flex: 1, background: "transparent", border: "none", outline: "none",
            padding: "6px 12px", fontSize: t.fontSize?.sm,
            color: t.colors.inputText, fontFamily: "inherit",
        },
        sendBtn: {
            width: 32, height: 32, borderRadius: "50%",
            background: t.colors.primary, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "opacity .15s",
        },
        poweredBy: {
            marginTop: 8, display: "flex", justifyContent: "center",
            alignItems: "center", gap: 6, opacity: 0.5,
            fontSize: "10px", fontWeight: 500, color: t.colors.mutedText,
        },
        fab: {
            position: "fixed",
            bottom: 24,
            [isRight ? "right" : "left"]: 24,
            zIndex,
            width: 56, height: 56, borderRadius: "50%",
            background: t.colors.primary, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(37,99,235,.3)",
            transition: "transform .15s, background .15s",
        },
    };
    return base;
}
//# sourceMappingURL=ChatWidget.js.map