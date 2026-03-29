// ============================================
// Drill-Chat — Multi-Provider LLM Support
// ============================================
// Supports Google Gemini, OpenAI GPT, Anthropic Claude
// 2026 March Edition: Gemini 3.1, GPT-5.4, Claude 4.6
// BYOK: Users provide their own API keys and choose models

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { LLMProvider, LLMProviderConfig } from '@/core/types';

// ── Provider & Model Configurations (Updated March 2026) ──

export const PROVIDER_CONFIGS: Record<LLMProvider, LLMProviderConfig> = {
  google: {
    id: 'google',
    name: 'Google Gemini',
    defaultModelId: 'gemini-3.1-pro-preview',
    models: [
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro' },
      { id: 'gemini-3-flash-001', name: 'Gemini 3 Flash' },
      { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash-Lite' },
      { id: 'gemini-3-deep-think-preview', name: 'Gemini 3 Deep Think' },
    ],
    available: true,
  },
  openai: {
    id: 'openai',
    name: 'OpenAI GPT',
    defaultModelId: 'gpt-5.4',
    models: [
      { id: 'gpt-5.4', name: 'GPT-5.4' },
      { id: 'gpt-5.4-thinking', name: 'GPT-5.4 Thinking' },
      { id: 'gpt-5.4-mini', name: 'GPT-5.4 mini' },
      { id: 'gpt-5.4-nano', name: 'GPT-5.4 nano' },
    ],
    available: true,
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    defaultModelId: 'claude-sonnet-4.6',
    models: [
      { id: 'claude-opus-4.6', name: 'Claude Opus 4.6' },
      { id: 'claude-sonnet-4.6', name: 'Claude Sonnet 4.6' },
      { id: 'claude-haiku-4.5', name: 'Claude Haiku 4.5' },
    ],
    available: true,
  },
};

// ── Helper to resolve model instance with API Key ──

export function getModelWithKey(provider: LLMProvider, apiKey?: string, modelId?: string) {
  const config = PROVIDER_CONFIGS[provider];
  const finalModelId = modelId || config.defaultModelId;

  switch (provider) {
    case 'google': {
      const google = createGoogleGenerativeAI({
        apiKey: apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
      });
      return google(finalModelId);
    }
    case 'openai': {
      const openai = createOpenAI({
        apiKey: apiKey || process.env.OPENAI_API_KEY || '',
      });
      return openai(finalModelId);
    }
    case 'anthropic': {
      const anthropic = createAnthropic({
        apiKey: apiKey || process.env.ANTHROPIC_API_KEY || '',
      });
      return anthropic(finalModelId);
    }
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Extract provider, API key, and specific model ID from request headers.
 */
export function extractKeyFromHeaders(req: Request): {
  provider: LLMProvider;
  apiKey?: string;
  modelId?: string;
} {
  const provider = (req.headers.get('x-provider') || 'google') as LLMProvider;
  const apiKey = req.headers.get('x-api-key') || undefined;
  const modelId = req.headers.get('x-model-id') || undefined;
  return { provider, apiKey, modelId };
}

// ── Legacy helpers ──

export function getAvailableProviders(): LLMProviderConfig[] {
  return Object.values(PROVIDER_CONFIGS);
}

export function getDefaultProvider(): LLMProvider {
  return 'google';
}
