// ============================================
// Drill-Chat — Multi-Provider LLM Support
// ============================================
// Supports Google Gemini, OpenAI GPT, Anthropic Claude
// Uses Vercel AI SDK for unified streaming interface

import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import type { LLMProvider, LLMProviderConfig } from './types';

// ── Provider Configurations ──

export const PROVIDER_CONFIGS: Record<LLMProvider, LLMProviderConfig> = {
  google: {
    id: 'google',
    name: 'Google Gemini',
    model: 'gemini-3.1-flash-preview',
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

// ── Sync-back system prompt ──

export const SYNC_BACK_SYSTEM_PROMPT = `You are an AI assistant helping to integrate information from a sub-conversation back into an original answer.

The user explored a specific part of your previous answer in a sub-conversation. Now they want to sync the insights back into the original answer.

Rules:
1. Update ONLY the relevant section (the anchor text area) with the new information
2. Keep the rest of the original answer unchanged
3. Make the updated section richer and more detailed based on the sub-conversation
4. Maintain the same formatting style as the original answer
5. Mark the updated section naturally — don't add artificial markers
6. Respond with the COMPLETE updated answer (not just the changed part)`;
