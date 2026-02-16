import { HayahAIClientConfig, AgentConfig, TripData } from "./types";

export class HayahAIClient {
  private baseUrl: string;
  private apiKey?: string;
  private tenantId?: number;
  private fetchFn: typeof fetch;

  constructor(config: HayahAIClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.tenantId = config.tenantId;
    this.fetchFn = config.fetch || globalThis.fetch.bind(globalThis);
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) h["x-api-key"] = this.apiKey;
    return { ...h, ...extra };
  }

  private async request<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
    const res = await this.fetchFn(`${this.baseUrl}${endpoint}`, {
      ...init,
      headers: { ...this.headers(), ...(init.headers as Record<string, string>) },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HayahAI API ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  // ── Agent Config ────────────────────────────────────────────────────────

  async getAgentConfig(tenantId?: number, agentType = "chatbot"): Promise<AgentConfig | null> {
    const tid = tenantId ?? this.tenantId ?? 1;
    try {
      const data = await this.request<{ data?: { config?: AgentConfig }; config?: AgentConfig }>(
        `/knowledge-base/agent-config/${tid}/${agentType}`
      );
      return data?.data?.config || data?.config || null;
    } catch {
      return null;
    }
  }

  async saveAgentConfig(
    config: Partial<AgentConfig>,
    tenantId?: number,
    agentType = "chatbot"
  ): Promise<AgentConfig | null> {
    const tid = tenantId ?? this.tenantId ?? 1;
    const data = await this.request<{ data?: { config?: AgentConfig }; config?: AgentConfig }>(
      `/knowledge-base/agent-config/${tid}/${agentType}`,
      { method: "PATCH", body: JSON.stringify(config) }
    );
    return data?.data?.config || data?.config || null;
  }

  async deleteAgentConfig(tenantId?: number, agentType = "chatbot"): Promise<boolean> {
    const tid = tenantId ?? this.tenantId ?? 1;
    try {
      await this.request(`/knowledge-base/agent-config/${tid}/${agentType}`, { method: "DELETE" });
      return true;
    } catch {
      return false;
    }
  }

  // ── Chat ────────────────────────────────────────────────────────────────

  async chat(
    query: string,
    options?: {
      agentId?: string;
      tenantId?: number;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
      scope?: string;
    }
  ): Promise<string> {
    const res = await this.fetchFn(`${this.baseUrl}/knowledge-base/chat`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        agentId: options?.agentId || "default",
        query,
        history: options?.history || [],
        tenantId: options?.tenantId ?? this.tenantId ?? 1,
        scope: options?.scope,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Chat failed (${res.status}): ${text}`);
    }

    return res.text();
  }

  // ── Training ────────────────────────────────────────────────────────────

  async train(request: {
    agentId: string;
    files?: File[];
    urls?: string[];
    systemPrompt?: string;
    tenantId?: number;
  }): Promise<{ success: boolean; agentId: string; documentsProcessed: number }> {
    const form = new FormData();
    form.append("agentId", request.agentId);
    if (request.tenantId ?? this.tenantId) {
      form.append("tenantId", String(request.tenantId ?? this.tenantId));
    }
    request.files?.forEach((f) => form.append("files", f));
    if (request.urls?.length) form.append("urls", JSON.stringify(request.urls));
    if (request.systemPrompt) form.append("systemPrompt", request.systemPrompt);

    const h: Record<string, string> = {};
    if (this.apiKey) h["x-api-key"] = this.apiKey;

    const res = await this.fetchFn(`${this.baseUrl}/knowledge-base/train`, {
      method: "POST",
      headers: h,
      body: form,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Training failed (${res.status}): ${text}`);
    }

    return res.json() as Promise<{ success: boolean; agentId: string; documentsProcessed: number }>;
  }

  // ── Agents ──────────────────────────────────────────────────────────────

  async listAgents(tenantId?: number): Promise<any[]> {
    const tid = tenantId ?? this.tenantId;
    const qs = tid ? `?tenantId=${tid}` : "";
    const data = await this.request<{ data?: { agents?: any[] }; agents?: any[] }>(
      `/knowledge-base/agents${qs}`
    );
    return data?.data?.agents || data?.agents || [];
  }

  async getAgent(agentId: string): Promise<any> {
    return this.request(`/knowledge-base/agents/${agentId}`);
  }

  async deleteAgent(agentId: string): Promise<boolean> {
    try {
      await this.request(`/knowledge-base/agents/${agentId}`, { method: "DELETE" });
      return true;
    } catch {
      return false;
    }
  }

  // ── Files ───────────────────────────────────────────────────────────────

  async getAgentFiles(agentId: string): Promise<any[]> {
    const data = await this.request<{ data?: { files?: any[] }; files?: any[] }>(
      `/knowledge-base/agents/${agentId}/files`
    );
    return data?.data?.files || data?.files || [];
  }

  async deleteFile(fileId: string): Promise<boolean> {
    try {
      await this.request(`/knowledge-base/files/${fileId}`, { method: "DELETE" });
      return true;
    } catch {
      return false;
    }
  }
}
