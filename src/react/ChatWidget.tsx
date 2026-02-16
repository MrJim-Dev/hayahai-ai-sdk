"use client";

import React, { useEffect, useMemo, useRef, useState, FormEvent, CSSProperties } from "react";
import { IconBot, IconSend, IconX, IconChat, IconLoader } from "./icons";
import { mergeTheme } from "../theme";
import type { ChatWidgetProps, HayahAITheme, AgentConfig } from "../types";

// ─── Keyframes injected once ─────────────────────────────────────────────────
let styleInjected = false;
function injectKeyframes() {
  if (styleInjected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.textContent = `
    @keyframes hayahai-spin { to { transform: rotate(360deg); } }
    @keyframes hayahai-fadeIn { from { opacity:0; transform:translateY(8px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
    @keyframes hayahai-bounce { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-6px); } }
  `;
  document.head.appendChild(style);
  styleInjected = true;
}

// ─── Message type ────────────────────────────────────────────────────────────
interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function ChatWidget({
  chatApiUrl = "/api/chat",
  configApiUrl = "/api/agent-config",
  tenantId = 1,
  agentId: propAgentId,
  threadId: propThreadId,
  theme: themeOverrides,
  displayName: propDisplayName,
  welcomeMessage: propWelcomeMessage,
  subtitle = "Ask about trip schedules, ticket prices, or booking assistance.",
  position = "bottom-right",
  defaultOpen = false,
  poweredByText = "Powered by HayahAI",
  onMessageSent,
  onResponseReceived,
  onError,
  className,
  zIndex = 100,
}: ChatWidgetProps) {
  const t = useMemo(() => mergeTheme(themeOverrides), [themeOverrides]);

  // ── State ───────────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const [displayName, setDisplayName] = useState(propDisplayName || "AyahAI Assistant");
  const [welcomeMessage, setWelcomeMessage] = useState(propWelcomeMessage || "How can we help today?");
  const [resolvedAgentId, setResolvedAgentId] = useState(propAgentId || "");

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { injectKeyframes(); }, []);

  // ── Load config ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (propDisplayName && propAgentId) return; // skip if all overrides set
    (async () => {
      try {
        const res = await fetch(`${configApiUrl}?tenantId=${tenantId}&type=chatbot`);
        if (!res.ok) return;
        const data = await res.json();
        const cfg: AgentConfig | null = data?.config ?? data?.data?.config ?? null;
        if (!cfg) return;
        if (!propDisplayName && cfg.displayName) setDisplayName(cfg.displayName);
        if (!propWelcomeMessage && cfg.welcomeMessage) setWelcomeMessage(cfg.welcomeMessage);
        if (!propAgentId && cfg.model) setResolvedAgentId(cfg.model);
      } catch { /* silent */ }
    })();
  }, [tenantId, configApiUrl, propDisplayName, propWelcomeMessage, propAgentId]);

  const agentId = propAgentId || resolvedAgentId || "default";

  // ── Thread ID ───────────────────────────────────────────────────────────
  const threadId = useMemo(() => {
    if (propThreadId) return propThreadId;
    if (typeof window === "undefined") return "";
    const key = "hayahai_thread_id";
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.sessionStorage.setItem(key, id);
    return id;
  }, [propThreadId]);

  // ── Auto-scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, status]);

  // ── Send ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || status === "loading") return;

    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStatus("loading");
    onMessageSent?.(text);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.text }));
      const res = await fetch(
        `${chatApiUrl}?agentId=${encodeURIComponent(agentId)}&tenantId=${tenantId}&threadId=${encodeURIComponent(threadId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...history, { role: "user", content: text }],
          }),
        }
      );

      if (!res.ok) throw new Error(`${res.status}`);
      const answer = await res.text();

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: answer },
      ]);
      setStatus("idle");
      onResponseReceived?.(answer);
    } catch (err) {
      setStatus("error");
      onError?.(err instanceof Error ? err : new Error(String(err)));
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────
  const isRight = position === "bottom-right";

  const s = buildStyles(t, isRight, zIndex);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className={className} style={{ fontFamily: t.fontFamily }}>
      {/* Chat Panel */}
      {isOpen && (
        <div style={s.panel}>
          {/* Header */}
          <div style={s.header}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={s.headerIcon}>
                <IconBot size={20} color={t.colors.headerSubtext} />
              </div>
              <div>
                <div style={{ fontSize: t.fontSize?.sm, fontWeight: 700, color: t.colors.headerText }}>{displayName}</div>
                <div style={{ fontSize: "10px", color: t.colors.headerSubtext }}>Support & Booking Helper</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={s.closeBtn} aria-label="Close chat">
              <IconX size={20} color="rgba(255,255,255,0.7)" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={s.messagesArea}>
            {messages.length === 0 ? (
              <div style={s.emptyState}>
                <div style={s.emptyIcon}><IconChat size={32} color={t.colors.primary} /></div>
                <div style={{ maxWidth: 220 }}>
                  <p style={{ fontSize: t.fontSize?.sm, fontWeight: 600, color: t.colors.inputText, margin: 0 }}>{welcomeMessage}</p>
                  <p style={{ fontSize: t.fontSize?.xs, color: t.colors.mutedText, marginTop: 4 }}>{subtitle}</p>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      ...s.bubble,
                      ...(m.role === "user" ? s.userBubble : s.botBubble),
                    }}
                  >
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{m.text}</div>
                  </div>
                ))}

                {/* Loading dots */}
                {status === "loading" && (
                  <div style={{ ...s.bubble, ...s.botBubble, display: "flex", gap: 4, padding: "10px 16px" }}>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        style={{
                          width: 8, height: 8, borderRadius: "50%",
                          backgroundColor: t.colors.primary,
                          animation: `hayahai-bounce 1s ease-in-out ${i * 150}ms infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Error */}
                {status === "error" && (
                  <div style={s.errorBox}>Unable to connect. Please try again.</div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <div style={s.inputArea}>
            <form onSubmit={handleSubmit} style={s.inputForm}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                style={s.input}
                disabled={status === "loading"}
              />
              <button
                type="submit"
                disabled={status === "loading" || !input.trim()}
                style={{
                  ...s.sendBtn,
                  opacity: status === "loading" || !input.trim() ? 0.5 : 1,
                }}
                aria-label="Send message"
              >
                <IconSend size={16} color="#fff" />
              </button>
            </form>
            {poweredByText && (
              <div style={s.poweredBy}>
                <IconBot size={12} /> <span>{poweredByText}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Toggle */}
      <button onClick={() => setIsOpen(!isOpen)} style={s.fab} aria-label="Toggle chat">
        {isOpen ? <IconX size={28} color="#fff" /> : <IconChat size={28} color="#fff" />}
      </button>
    </div>
  );
}

// ─── Style builder ───────────────────────────────────────────────────────────
function buildStyles(t: HayahAITheme, isRight: boolean, zIndex: number) {
  const base: Record<string, CSSProperties> = {
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
      height: 420, overflowY: "auto" as const,
      background: t.colors.background,
      padding: 16,
      scrollBehavior: "smooth" as const,
    },
    emptyState: {
      display: "flex", flexDirection: "column" as const, alignItems: "center",
      justifyContent: "center", height: "100%", gap: 16, textAlign: "center" as const,
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
      position: "fixed" as const,
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
