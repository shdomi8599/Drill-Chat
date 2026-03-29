// ============================================
// Drill-Chat — Multi-Provider LLM Support
// ============================================
// Supports Google Gemini, OpenAI GPT, Anthropic Claude
// Uses Vercel AI SDK for unified streaming interface

import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import type { LLMProvider, LLMProviderConfig } from '@/core/types';

// ── Provider Configurations ──

export const PROVIDER_CONFIGS: Record<LLMProvider, LLMProviderConfig> = {
  google: {
    id: 'google',
    name: 'Google Gemini',
    model: 'gemini-3.1-flash-lite-preview',
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

// ── Check which providers have API keys configured ──

export function getAvailableProviders(): LLMProviderConfig[] {
  const configs = { ...PROVIDER_CONFIGS };

  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    configs.google = { ...configs.google, available: true };
  }
  if (process.env.OPENAI_API_KEY) {
    configs.openai = { ...configs.openai, available: true };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    configs.anthropic = { ...configs.anthropic, available: true };
  }

  return Object.values(configs);
}

export function getDefaultProvider(): LLMProvider {
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) return 'google';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return 'google'; // fallback
}

// ── Get the AI SDK model instance for a provider ──

export function getModel(provider: LLMProvider) {
  const config = PROVIDER_CONFIGS[provider];

  switch (provider) {
    case 'google':
      return google(config.model);
    case 'openai':
      return openai(config.model);
    case 'anthropic':
      return anthropic(config.model);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
