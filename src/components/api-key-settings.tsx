'use client';

// ============================================
// Drill-Chat — API Key Settings Modal
// ============================================
// BYOK: Users enter their own API keys here.
// Keys are stored in localStorage only.

import { useState } from 'react';
import { useChatStore } from '@/lib/chat-store';
import type { LLMProvider } from '@/core/types';
import { PROVIDER_CONFIGS } from '@/lib/llm-providers';
import { Settings, X, Eye, EyeOff, Shield, ExternalLink } from 'lucide-react';

const PROVIDER_LINKS: Record<LLMProvider, string> = {
  google: 'https://aistudio.google.com/apikey',
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
};

export function ApiKeySettings() {
  const [open, setOpen] = useState(false);
  const { apiKeys, setApiKey } = useChatStore();
  const [showKeys, setShowKeys] = useState<Record<LLMProvider, boolean>>({
    google: false,
    openai: false,
    anthropic: false,
  });

  const providers: LLMProvider[] = ['google', 'openai', 'anthropic'];

  const toggleShow = (p: LLMProvider) =>
    setShowKeys((s) => ({ ...s, [p]: !s[p] }));

  const hasAnyKey = Object.values(apiKeys).some((k) => k.length > 0);

  return (
    <>
      <button
        className="settings-trigger"
        onClick={() => setOpen(true)}
        title="API Key Settings"
      >
        <Settings size={18} />
        {!hasAnyKey && <span className="settings-dot" />}
      </button>

      {open && (
        <>
          <div className="settings-backdrop" onClick={() => setOpen(false)} />
          <div className="settings-modal">
            <div className="settings-header">
              <h2>API Key Settings</h2>
              <button
                className="settings-close"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="settings-privacy">
              <Shield size={14} />
              <span>
                Keys are stored in your browser&apos;s localStorage only. Never sent to our servers.{' '}
                <a
                  href="https://github.com/shdomi8599/Drill-Chat"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Verify in source code ↗
                </a>
              </span>
            </div>

            <div className="settings-fields">
              {providers.map((p) => {
                const config = PROVIDER_CONFIGS[p];
                return (
                  <div key={p} className="settings-field">
                    <label className="settings-label">
                      <span className="settings-provider-name">{config.name}</span>
                      <span className="settings-model-name">{config.model}</span>
                    </label>
                    <div className="settings-input-row">
                      <input
                        type={showKeys[p] ? 'text' : 'password'}
                        className="settings-input"
                        placeholder={`Enter your ${config.name} API key`}
                        value={apiKeys[p]}
                        onChange={(e) => setApiKey(p, e.target.value)}
                        spellCheck={false}
                        autoComplete="off"
                      />
                      <button
                        className="settings-eye"
                        onClick={() => toggleShow(p)}
                        title={showKeys[p] ? 'Hide' : 'Show'}
                      >
                        {showKeys[p] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <a
                      href={PROVIDER_LINKS[p]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="settings-get-key"
                    >
                      Get API key <ExternalLink size={10} />
                    </a>
                  </div>
                );
              })}
            </div>

            <div className="settings-footer">
              <p>Enter at least one API key to start chatting.</p>
              <p>For maximum privacy, clone and run locally.</p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
