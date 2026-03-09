/**
 * AI Model Registry — Gemini + OpenAI
 * Centralized list of all available models for import & grading.
 */

export interface AIModel {
    id: string;
    label: string;
    provider: "google" | "openai" | "anthropic";
    tier: "pro" | "fast" | "nano" | "stable";
}

export const AI_MODELS: AIModel[] = [
    // === Google Gemini ===
    { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview", provider: "google", tier: "pro" },
    { id: "gemini-3-flash-preview", label: "Gemini 3 Flash Preview", provider: "google", tier: "fast" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "google", tier: "stable" },

    // === OpenAI ChatGPT ===
    { id: "gpt-5.2", label: "GPT-5.2 (Mạnh nhất, Mới nhất)", provider: "openai", tier: "pro" },
    { id: "gpt-5.1", label: "GPT-5.1 (Coding & Agentic)", provider: "openai", tier: "pro" },
    { id: "gpt-5", label: "GPT-5", provider: "openai", tier: "pro" },
    { id: "gpt-5-mini", label: "GPT-5 Mini (Nhanh, Rẻ)", provider: "openai", tier: "fast" },
    { id: "gpt-4.1", label: "GPT-4.1", provider: "openai", tier: "stable" },
    { id: "gpt-4.1-mini", label: "GPT-4.1 Mini", provider: "openai", tier: "fast" },
    { id: "gpt-4.1-nano", label: "GPT-4.1 Nano (Siêu nhanh)", provider: "openai", tier: "nano" },
    { id: "gpt-4o", label: "GPT-4o (Legacy)", provider: "openai", tier: "stable" },
    { id: "gpt-4o-mini", label: "GPT-4o Mini (Legacy)", provider: "openai", tier: "fast" },

    // === Anthropic Claude ===
    { id: "claude-opus-4-6", label: "Claude Opus 4.6 (Mạnh nhất)", provider: "anthropic", tier: "pro" },
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "anthropic", tier: "pro" },
    { id: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5", provider: "anthropic", tier: "stable" },
    { id: "claude-opus-4-5-20251101", label: "Claude Opus 4.5", provider: "anthropic", tier: "stable" },
    { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (Nhanh, Rẻ)", provider: "anthropic", tier: "fast" },
    { id: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet", provider: "anthropic", tier: "stable" },
    { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", provider: "anthropic", tier: "stable" },
    { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", provider: "anthropic", tier: "fast" },
    { id: "claude-3-opus-20240229", label: "Claude 3 Opus", provider: "anthropic", tier: "stable" },
];

export const GEMINI_MODELS = AI_MODELS.filter(m => m.provider === "google");
export const OPENAI_MODELS = AI_MODELS.filter(m => m.provider === "openai");
export const ANTHROPIC_MODELS = AI_MODELS.filter(m => m.provider === "anthropic");

export function getModelProvider(modelId: string): "google" | "openai" | "anthropic" {
    const model = AI_MODELS.find(m => m.id === modelId);
    if (model) return model.provider;
    // Fallback: check prefix
    if (modelId.startsWith("claude-")) return "anthropic";
    if (modelId.startsWith("gpt-") || modelId.startsWith("o1") || modelId.startsWith("o3")) return "openai";
    return "google";
}

export function isOpenAIModel(modelId: string): boolean {
    return getModelProvider(modelId) === "openai";
}

export function isAnthropicModel(modelId: string): boolean {
    return getModelProvider(modelId) === "anthropic";
}
