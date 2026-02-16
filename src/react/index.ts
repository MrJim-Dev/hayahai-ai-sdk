// HayahAI SDK — React entry point
// Customizable AI chatbot & trip search widgets

export { default as ChatWidget } from "./ChatWidget";
export { default as TripSearchWidget } from "./TripSearchWidget";

// Re-export types consumers need for props
export type {
  ChatWidgetProps,
  TripSearchWidgetProps,
  HayahAITheme,
  DeepPartial,
  AgentConfig,
  HttpTool,
  TripData,
  RouteData,
  QuickReplyOption,
  BookingContext,
} from "../types";

// Re-export theme utilities
export { defaultTheme, mergeTheme } from "../theme";
