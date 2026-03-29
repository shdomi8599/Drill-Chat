'use client';

import { useState } from 'react';
import { useChatStore } from '@/lib/chat-store';
import { PROVIDER_CONFIGS } from '@/lib/llm-providers';
import type { LLMProvider } from '@/core/types';
import { ChevronDown, Check } from 'lucide-react';

export function ProviderSelector() {
  const { provider, setProvider, apiKeys, selectedModels } = useChatStore();
  const [open, setOpen] = useState(false);

  const providers: LLMProvider[] = ['google', 'openai', 'anthropic'];

  const current = PROVIDER_CONFIGS[provider];

  const handleSelect = (id: LLMProvider) => {
    setProvider(id);
    setOpen(false);
  };

  const currentModelId = selectedModels[provider];
  const currentModel = current.models.find((m) => m.id === currentModelId) || current.models[0];

  return (
    <div className="provider-selector">
      <button
        className="provider-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="provider-info">
          <span className="provider-model-selected">{currentModel.name}</span>
        </div>
        <ChevronDown size={14} className={`provider-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <>
          <div className="provider-backdrop" onClick={() => setOpen(false)} />
          <div className="provider-dropdown">
            {providers.map((p) => {
              const config = PROVIDER_CONFIGS[p];
              const hasKey = !!apiKeys[p];
              return (
                <button
                  key={p}
                  className={`provider-option ${p === provider ? 'active' : ''} ${!hasKey ? 'disabled' : ''}`}
                  onClick={() => hasKey && handleSelect(p)}
                  disabled={!hasKey}
                >
                  <div className="provider-option-content">
                    <span className="provider-option-model">
                      {selectedModels[p] 
                        ? config.models.find(m => m.id === selectedModels[p])?.name 
                        : config.models[0].name}
                    </span>
                  </div>
                  {!hasKey && (
                    <span className="provider-option-badge">No Key</span>
                  )}
                  {p === provider && hasKey && (
                    <Check size={14} className="provider-check" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
