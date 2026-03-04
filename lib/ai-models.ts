/**
 * AI Model Registry — Gemini + OpenAI
 * Centralized list of all available models for import & grading.
 */

export interface AIModel {
    id: string;
    label: string;
    provider: "google" | "openai";
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
];

export const GEMINI_MODELS = AI_MODELS.filter(m => m.provider === "google");
export const OPENAI_MODELS = AI_MODELS.filter(m => m.provider === "openai");

export function getModelProvider(modelId: string): "google" | "openai" {
    const model = AI_MODELS.find(m => m.id === modelId);
    if (model) return model.provider;
    // Fallback: check prefix
    if (modelId.startsWith("gpt-")) return "openai";
    return "google";
}

export function isOpenAIModel(modelId: string): boolean {
    return getModelProvider(modelId) === "openai";
}
