"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HayahAIClient = void 0;
class HayahAIClient {
    constructor(config) {
        this.baseUrl = config.baseUrl.replace(/\/$/, "");
        this.apiKey = config.apiKey;
        this.tenantId = config.tenantId;
        this.fetchFn = config.fetch || globalThis.fetch.bind(globalThis);
    }
    headers(extra) {
        const h = { "Content-Type": "application/json" };
        if (this.apiKey)
            h["x-api-key"] = this.apiKey;
        return { ...h, ...extra };
    }
    async request(endpoint, init = {}) {
        const res = await this.fetchFn(`${this.baseUrl}${endpoint}`, {
            ...init,
            headers: { ...this.headers(), ...init.headers },
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`HayahAI API ${res.status}: ${text}`);
        }
        return res.json();
    }
    // ── Agent Config ────────────────────────────────────────────────────────
    async getAgentConfig(tenantId, agentType = "chatbot") {
        const tid = tenantId ?? this.tenantId ?? 1;
        try {
            const data = await this.request(`/knowledge-base/agent-config/${tid}/${agentType}`);
            return data?.data?.config || data?.config || null;
        }
        catch {
            return null;
        }
    }
    async saveAgentConfig(config, tenantId, agentType = "chatbot") {
        const tid = tenantId ?? this.tenantId ?? 1;
        const data = await this.request(`/knowledge-base/agent-config/${tid}/${agentType}`, { method: "PATCH", body: JSON.stringify(config) });
        return data?.data?.config || data?.config || null;
    }
    async deleteAgentConfig(tenantId, agentType = "chatbot") {
        const tid = tenantId ?? this.tenantId ?? 1;
        try {
            await this.request(`/knowledge-base/agent-config/${tid}/${agentType}`, { method: "DELETE" });
            return true;
        }
        catch {
            return false;
        }
    }
    // ── Chat ────────────────────────────────────────────────────────────────
    async chat(query, options) {
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
    async train(request) {
        const form = new FormData();
        form.append("agentId", request.agentId);
        if (request.tenantId ?? this.tenantId) {
            form.append("tenantId", String(request.tenantId ?? this.tenantId));
        }
        request.files?.forEach((f) => form.append("files", f));
        if (request.urls?.length)
            form.append("urls", JSON.stringify(request.urls));
        if (request.systemPrompt)
            form.append("systemPrompt", request.systemPrompt);
        const h = {};
        if (this.apiKey)
            h["x-api-key"] = this.apiKey;
        const res = await this.fetchFn(`${this.baseUrl}/knowledge-base/train`, {
            method: "POST",
            headers: h,
            body: form,
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Training failed (${res.status}): ${text}`);
        }
        return res.json();
    }
    // ── Agents ──────────────────────────────────────────────────────────────
    async listAgents(tenantId) {
        const tid = tenantId ?? this.tenantId;
        const qs = tid ? `?tenantId=${tid}` : "";
        const data = await this.request(`/knowledge-base/agents${qs}`);
        return data?.data?.agents || data?.agents || [];
    }
    async getAgent(agentId) {
        return this.request(`/knowledge-base/agents/${agentId}`);
    }
    async deleteAgent(agentId) {
        try {
            await this.request(`/knowledge-base/agents/${agentId}`, { method: "DELETE" });
            return true;
        }
        catch {
            return false;
        }
    }
    // ── Files ───────────────────────────────────────────────────────────────
    async getAgentFiles(agentId) {
        const data = await this.request(`/knowledge-base/agents/${agentId}/files`);
        return data?.data?.files || data?.files || [];
    }
    async deleteFile(fileId) {
        try {
            await this.request(`/knowledge-base/files/${fileId}`, { method: "DELETE" });
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.HayahAIClient = HayahAIClient;
//# sourceMappingURL=client.js.map