// ============================================
// Drill-Chat — Multi-Provider LLM Support
// ============================================
// Supports Google Gemini, OpenAI GPT, Anthropic Claude
// Uses Vercel AI SDK for unified streaming interface
// BYOK: Users can provide their own API keys

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { LLMProvider, LLMProviderConfig } from '@/core/types';

// ── Provider Configurations ──

export const PROVIDER_CONFIGS: Record<LLMProvider, LLMProviderConfig> = {
  google: {
    id: 'google',
    name: 'Google Gemini',
    model: 'gemini-2.5-flash-preview-05-20',
    available: false,
  },
  openai: {
    id: 'openai',
    name: 'OpenAI GPT-4o',
    model: 'gpt-4o',
    available: false,
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    model: 'claude-sonnet-4-20250514',
    available: false,
  },
};

// ── Get the AI SDK model instance for a provider with a custom API key ──

export function getModelWithKey(provider: LLMProvider, apiKey?: string) {
  const config = PROVIDER_CONFIGS[provider];

  switch (provider) {
    case 'google': {
      const google = createGoogleGenerativeAI({
        apiKey: apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
      });
      return google(config.model);
    }
    case 'openai': {
      const openai = createOpenAI({
        apiKey: apiKey || process.env.OPENAI_API_KEY || '',
      });
      return openai(config.model);
    }
    case 'anthropic': {
      const anthropic = createAnthropic({
        apiKey: apiKey || process.env.ANTHROPIC_API_KEY || '',
      });
      return anthropic(config.model);
    }
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Extract provider and API key from request headers.
 */
export function extractKeyFromHeaders(req: Request): {
  provider: LLMProvider;
  apiKey?: string;
} {
  const provider = (req.headers.get('x-provider') || 'google') as LLMProvider;
  const apiKey = req.headers.get('x-api-key') || undefined;
  return { provider, apiKey };
}

// ── Legacy helpers (kept for backward compatibility) ──

export function getAvailableProviders(): LLMProviderConfig[] {
  return Object.values(PROVIDER_CONFIGS);
}

export function getDefaultProvider(): LLMProvider {
  return 'google';
}
