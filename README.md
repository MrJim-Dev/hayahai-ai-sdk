# HayahAI SDK

Unified SDK for AI-powered chatbot and trip search widgets. Includes customizable React components, a REST API client, and server-side RAG engine.

## Installation

```bash
pnpm add @oltek/hayahai-sdk
```

## Entry Points

| Import | Description |
|---|---|
| `@oltek/hayahai-sdk` | Types, API client, theme utilities |
| `@oltek/hayahai-sdk/react` | React UI components (ChatWidget, TripSearchWidget) |
| `@oltek/hayahai-sdk/server` | Server-side RAG, vectorstore, tools, training |

---

## React Components

### ChatWidget — Floating AI Chatbot

```tsx
import { ChatWidget } from "@oltek/hayahai-sdk/react";

export default function App() {
  return (
    <ChatWidget
      tenantId={1}
      chatApiUrl="/api/chat"
      configApiUrl="/api/agent-config"
      position="bottom-right"
      theme={{
        colors: {
          primary: "#0ea5e9",
          headerBg: "#0c4a6e",
        },
      }}
    />
  );
}
```

#### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `chatApiUrl` | `string` | `"/api/chat"` | Chat API endpoint |
| `configApiUrl` | `string` | `"/api/agent-config"` | Agent config endpoint |
| `tenantId` | `number` | `1` | Tenant ID |
| `agentId` | `string` | from config | Override agent/model ID |
| `theme` | `DeepPartial<HayahAITheme>` | default | Theme overrides |
| `displayName` | `string` | from config | Override display name |
| `welcomeMessage` | `string` | from config | Override welcome message |
| `subtitle` | `string` | generic | Subtitle under welcome |
| `position` | `"bottom-right" \| "bottom-left"` | `"bottom-right"` | FAB position |
| `defaultOpen` | `boolean` | `false` | Start open |
| `poweredByText` | `string \| null` | `"Powered by HayahAI"` | Footer text |
| `onMessageSent` | `(msg) => void` | — | Callback |
| `onResponseReceived` | `(res) => void` | — | Callback |
| `onError` | `(err) => void` | — | Callback |
| `zIndex` | `number` | `100` | Z-index |

### TripSearchWidget — Guided Trip Search

```tsx
import { TripSearchWidget } from "@oltek/hayahai-sdk/react";

export default function SearchSection() {
  return (
    <TripSearchWidget
      tenantId={1}
      tripsApiUrl="/api/trips"
      routesApiUrl="/api/routes"
      chatApiUrl="/api/chat-booking"
      onTripSelect={(trip) => router.push(`/trips/${trip.id}`)}
      theme={{
        colors: {
          primary: "#2563eb",
          headerBg: "#1e3a5f",
        },
      }}
    />
  );
}
```

#### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `chatApiUrl` | `string` | `"/api/chat-booking"` | Booking chat API |
| `routesApiUrl` | `string` | `"/api/routes"` | Routes endpoint |
| `tripsApiUrl` | `string` | `"/api/trips"` | Trips search endpoint |
| `configApiUrl` | `string` | `"/api/agent-config"` | Agent config endpoint |
| `tenantId` | `number` | `1` | Tenant ID |
| `agentConfig` | `AgentConfig` | fetched | Pre-loaded config |
| `theme` | `DeepPartial<HayahAITheme>` | default | Theme overrides |
| `displayName` | `string` | from config | Override |
| `welcomeMessage` | `string` | from config | Override |
| `showFormToggle` | `boolean` | `true` | Show form switch button |
| `onSwitchToForm` | `() => void` | — | Form toggle callback |
| `onTripSelect` | `(trip) => void` | — | Trip selection callback |
| `currency` | `string` | `"PHP"` | Price currency |
| `locale` | `string` | `"en-PH"` | Formatting locale |

---

## Theme System

All components accept a `theme` prop with deep-partial overrides:

```tsx
import { defaultTheme } from "@oltek/hayahai-sdk/react";

const customTheme = {
  colors: {
    primary: "#e11d48",        // Rose
    primaryHover: "#be123c",
    headerBg: "#1c1917",       // Dark stone
    userBubble: "#e11d48",
    quickReplyText: "#e11d48",
    quickReplyBorder: "#fecdd3",
  },
  borderRadius: {
    widget: "24px",
    bubble: "20px",
  },
};

<ChatWidget theme={customTheme} />
```

### Theme Properties

```typescript
interface HayahAITheme {
  colors: {
    primary, primaryHover,
    headerBg, headerText, headerSubtext,
    userBubble, userBubbleText,
    botBubble, botBubbleText, botBubbleBorder,
    background, border,
    inputBg, inputText, inputPlaceholder, inputBorder, inputFocusBorder,
    quickReplyBg, quickReplyText, quickReplyBorder, quickReplyHoverBg,
    errorBg, errorText, errorBorder,
    mutedText,
  };
  borderRadius: { widget, bubble, button, input };
  fontFamily?: string;
  fontSize?: { xs, sm, base, lg };
  shadow?: string;
}
```

---

## API Client

```typescript
import { HayahAIClient } from "@oltek/hayahai-sdk";

const client = new HayahAIClient({
  baseUrl: "https://api.example.com",
  apiKey: process.env.HAYAHAI_API_KEY,
  tenantId: 1,
});

// Chat
const answer = await client.chat("Show trips from Cebu to Bogo", {
  agentId: "Miguel",
});

// Agent config
const config = await client.getAgentConfig(1, "chatbot");
await client.saveAgentConfig({ displayName: "My Bot" }, 1, "chatbot");

// Training
await client.train({
  agentId: "my-agent",
  urls: ["https://example.com/faq"],
  systemPrompt: "You are a helpful assistant.",
});

// Agents
const agents = await client.listAgents();
```

---

## Server-Side (Node.js)

```typescript
import {
  queryAgentWithTools,
  trainAgent,
  createSearchTripsTool,
} from "@oltek/hayahai-sdk/server";

// Query with tools
const answer = await queryAgentWithTools("Miguel", "Show trips from Cebu", {
  toolContext: { tenantId: 1 },
  systemPromptSuffix: "Use tools for live data.",
});

// Train
const result = await trainAgent(files, "my-agent", urls, tenantId);
```

---

## Zero-Dependency UI

The React components use **inline styles** and **built-in SVG icons** — no Tailwind CSS, no icon library, no CSS framework required. Drop them into any React 18+ app.

---

## License

MIT — Oltek Solutions
