'use client';

import { useEffect, useState } from 'react';
import { useChatStore } from '@/lib/chat-store';
import type { LLMProvider, LLMProviderConfig } from '@/core/types';
import { ChevronDown } from 'lucide-react';

export function ProviderSelector() {
  const { provider, setProvider } = useChatStore();
  const [providers, setProviders] = useState<LLMProviderConfig[]>([]);
  const [open, setOpen] = useState(false);

  // Fetch available providers on mount
  useEffect(() => {
    fetch('/api/providers')
      .then((res) => res.json())
      .then(({ providers: p, defaultProvider }) => {
        setProviders(p);
        if (defaultProvider) {
          setProvider(defaultProvider);
        }
      })
      .catch(console.error);
  }, [setProvider]);

  const current = providers.find((p) => p.id === provider);

  const handleSelect = (id: LLMProvider) => {
    setProvider(id);
    setOpen(false);
  };

  return (
    <div className="provider-selector">
      <button
        className="provider-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="provider-name">{current?.name ?? 'Select Model'}</span>
        <ChevronDown size={14} className={`provider-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <>
          <div className="provider-backdrop" onClick={() => setOpen(false)} />
          <div className="provider-dropdown">
            {providers.map((p) => (
              <button
                key={p.id}
                className={`provider-option ${p.id === provider ? 'active' : ''} ${!p.available ? 'disabled' : ''}`}
                onClick={() => p.available && handleSelect(p.id)}
                disabled={!p.available}
              >
                <span className="provider-option-name">{p.name}</span>
                <span className="provider-option-model">{p.model}</span>
                {!p.available && (
                  <span className="provider-option-badge">No API Key</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
