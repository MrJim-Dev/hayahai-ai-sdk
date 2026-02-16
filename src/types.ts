// ─── Theme ───────────────────────────────────────────────────────────────────

export interface HayahAITheme {
  colors: {
    primary: string;
    primaryHover: string;
    headerBg: string;
    headerText: string;
    headerSubtext: string;
    userBubble: string;
    userBubbleText: string;
    botBubble: string;
    botBubbleText: string;
    botBubbleBorder: string;
    background: string;
    inputBg: string;
    inputText: string;
    inputPlaceholder: string;
    inputBorder: string;
    inputFocusBorder: string;
    border: string;
    quickReplyBg: string;
    quickReplyText: string;
    quickReplyBorder: string;
    quickReplyHoverBg: string;
    errorBg: string;
    errorText: string;
    errorBorder: string;
    mutedText: string;
  };
  borderRadius: {
    widget: string;
    bubble: string;
    button: string;
    input: string;
  };
  fontFamily?: string;
  fontSize?: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
  };
  shadow?: string;
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ─── Agent Config ────────────────────────────────────────────────────────────

export interface HttpTool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface AgentConfig {
  displayName?: string;
  welcomeMessage?: string;
  enabled?: boolean;
  model?: string;
  httpTools?: HttpTool[];
  agentType?: string;
}

// ─── Chat Types ──────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export type ChatStatus = "idle" | "submitted" | "streaming" | "error";

// ─── Trip Types ──────────────────────────────────────────────────────────────

export interface TripData {
  id: string;
  shippingLine: string;
  vesselName: string;
  srcPort: string;
  destPort: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  availableSeats: number;
  tripDate?: string;
}

export interface RouteData {
  id: number;
  tenant_id: number;
  tenant_route_id: number;
  src_port_code: string;
  src_port_id: number;
  src_port_name: string;
  dest_port_code: string;
  dest_port_id: number;
  dest_port_name: string;
}

export interface QuickReplyOption {
  label: string;
  value: string;
  icon?: string;
}

export interface BookingContext {
  originPort?: { id: number; name: string; code: string };
  destinationPort?: { id: number; name: string; code: string };
  departureDate?: string;
  departureDateLabel?: string;
  returnDate?: string;
  tripType?: "single" | "roundTrip";
  passengerCount?: number;
  vehicleCount?: number;
  selectedRoute?: RouteData;
}

// ─── Widget Props ────────────────────────────────────────────────────────────

export interface ChatWidgetProps {
  /** API base URL for the chat endpoint (e.g. "/api/chat" or "https://api.example.com/chat") */
  chatApiUrl?: string;
  /** API base URL for agent config (e.g. "/api/agent-config") */
  configApiUrl?: string;
  /** Tenant ID for multi-tenant setups */
  tenantId?: number;
  /** Override the agent/model ID */
  agentId?: string;
  /** Thread ID for conversation continuity */
  threadId?: string;
  /** Theme overrides */
  theme?: DeepPartial<HayahAITheme>;
  /** Override display name (skips config fetch if set) */
  displayName?: string;
  /** Override welcome message */
  welcomeMessage?: string;
  /** Override subtitle text */
  subtitle?: string;
  /** Position of the floating button */
  position?: "bottom-right" | "bottom-left";
  /** Whether the widget starts open */
  defaultOpen?: boolean;
  /** Powered-by footer text (set to null to hide) */
  poweredByText?: string | null;
  /** Callback when a message is sent */
  onMessageSent?: (message: string) => void;
  /** Callback when a response is received */
  onResponseReceived?: (response: string) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
  /** Custom CSS class for the widget container */
  className?: string;
  /** Z-index for the floating widget */
  zIndex?: number;
}

export interface TripSearchWidgetProps {
  /** API base URL for chat/booking endpoint */
  chatApiUrl?: string;
  /** API base URL for routes */
  routesApiUrl?: string;
  /** API base URL for trip search */
  tripsApiUrl?: string;
  /** API base URL for agent config */
  configApiUrl?: string;
  /** Tenant ID */
  tenantId?: number;
  /** Agent config (if already loaded) */
  agentConfig?: AgentConfig | null;
  /** Theme overrides */
  theme?: DeepPartial<HayahAITheme>;
  /** Display name override */
  displayName?: string;
  /** Welcome message override */
  welcomeMessage?: string;
  /** Show toggle to switch to form mode */
  showFormToggle?: boolean;
  /** Callback when user switches to form */
  onSwitchToForm?: () => void;
  /** Callback when a trip is selected */
  onTripSelect?: (trip: TripData) => void;
  /** Powered-by footer text */
  poweredByText?: string | null;
  /** Custom CSS class */
  className?: string;
  /** Currency for price formatting */
  currency?: string;
  /** Locale for formatting */
  locale?: string;
}

// ─── Client Config ───────────────────────────────────────────────────────────

export interface HayahAIClientConfig {
  /** Base URL of the API (e.g. "http://localhost:3002" or "https://api.example.com") */
  baseUrl: string;
  /** API key for authentication */
  apiKey?: string;
  /** Tenant ID */
  tenantId?: number;
  /** Custom fetch implementation */
  fetch?: typeof fetch;
}

// ─── Server re-exports ───────────────────────────────────────────────────────

export type {
  Document,
  TrainingResult,
  Agent,
  AgentFile,
  TrainOptions,
  QueryOptions,
  ClientConfig,
  ClientTrainRequest,
  ClientQueryRequest,
  ClientQueryResponse,
} from "@ayahay/knowledge-base-sdk";
