import { HayahAITheme, DeepPartial } from "./types";

export const defaultTheme: HayahAITheme = {
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
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: {
    xs: "11px",
    sm: "13px",
    base: "14px",
    lg: "16px",
  },
  shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
};

/** Deep-merge a partial theme into the default theme */
export function mergeTheme(overrides?: DeepPartial<HayahAITheme>): HayahAITheme {
  if (!overrides) return { ...defaultTheme };

  const merged: any = { ...defaultTheme };

  for (const key of Object.keys(overrides) as (keyof HayahAITheme)[]) {
    const val = overrides[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      merged[key] = { ...(defaultTheme[key] as any), ...(val as any) };
    } else if (val !== undefined) {
      merged[key] = val;
    }
  }

  return merged as HayahAITheme;
}
