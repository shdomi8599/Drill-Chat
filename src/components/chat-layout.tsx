'use client';

// ============================================
// Drill-Chat — Chat Layout
// ============================================
// Main chat layout with integrated sub-conversation panel.

import { useEffect, useRef, useCallback, useState } from 'react';
import type { UIMessage } from 'ai';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';
import { ProviderSelector } from './provider-selector';
import { SubConversationPanel } from './sub-conversation-panel';
import { ApiKeySettings } from './api-key-settings';
import { Drill, CheckCircle2, Settings } from 'lucide-react';
import { useChatStore } from '@/lib/chat-store';
import type { DrillTarget } from '@/core/types';

interface ChatLayoutProps {
  messages: UIMessage[];
  status: 'submitted' | 'streaming' | 'ready' | 'error';
  error?: Error;
  onSendMessage: (text: string) => void;
  onStop: () => void;
  onRegenerate: () => void;
  /** Called when sync-back updates a message's content */
  onSyncBack: (messageId: string, updatedContent: string) => void;
}

export function ChatLayout({
  messages,
  status,
  error,
  onSendMessage,
  onStop,
  onRegenerate,
  onSyncBack,
}: ChatLayoutProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { activeSubConversation, openSubConversation, apiKeys } = useChatStore();
  const hasAnyKey = Object.values(apiKeys).some((k) => k.length > 0);

  // Sync-back feedback state
  const [syncedMessageId, setSyncedMessageId] = useState<string | null>(null);
  const [showSyncToast, setShowSyncToast] = useState(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  // Handle drill-down from a message bubble
  const handleDrill = useCallback(
    (messageId: string, messageContent: string, target: DrillTarget) => {
      openSubConversation(messageId, messageContent, target);
    },
    [openSubConversation],
  );

  // Handle sync-back with visual feedback
  const handleSyncBack = useCallback(
    (messageId: string, updatedContent: string) => {
      onSyncBack(messageId, updatedContent);

      // Show toast and highlight the synced message
      setSyncedMessageId(messageId);
      setShowSyncToast(true);

      // Scroll to the synced message
      setTimeout(() => {
        const el = document.getElementById(`message-${messageId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);

      // Clear highlight after 4 seconds
      setTimeout(() => {
        setSyncedMessageId(null);
      }, 4000);

      // Clear toast after 3 seconds
      setTimeout(() => {
        setShowSyncToast(false);
      }, 3000);
    },
    [onSyncBack],
  );

  const hasActiveSubConv = !!activeSubConversation;

  return (
    <div className={`chat-layout ${hasActiveSubConv ? 'chat-layout-with-panel' : ''}`}>
      {/* Header */}
      <header className="chat-header">
        <div className="chat-header-left">
          <div className="chat-logo">
            <Drill size={24} />
          </div>
          <h1 className="chat-title">Drill Chat</h1>
          <span className="chat-badge">alpha</span>
        </div>
        <div className="chat-header-right">
          <ProviderSelector />
          <ApiKeySettings />
        </div>
      </header>

      {/* Messages Area */}
      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <Drill size={48} />
            </div>
            <h2>Welcome to Drill Chat</h2>
            <p>
              Ask anything. Click on specific parts of AI answers to drill
              deeper.
            </p>
            <div className="chat-empty-hints">
              <span className="hint-item">🔍 Click list items to drill down</span>
              <span className="hint-item">📝 Drag-select text for custom drill</span>
              <span className="hint-item">🔄 Sync insights back to the original</span>
            </div>
            {!hasAnyKey && (
              <div className="chat-key-notice">
                <Settings size={16} />
                <span>Add your API key in <strong>Settings</strong> (⚙ top-right) to start chatting.</span>
              </div>
            )}
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            id={`message-${message.id}`}
            className={syncedMessageId === message.id ? 'synced-highlight' : ''}
          >
            <MessageBubble
              message={message}
              isStreaming={
                status === 'streaming' &&
                message.id === messages[messages.length - 1]?.id &&
                message.role === 'assistant'
              }
              onDrill={handleDrill}
            />
          </div>
        ))}

        {status === 'submitted' && (
          <div className="chat-thinking">
            <div className="thinking-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        {error && (
          <div className="chat-error">
            <p>Something went wrong. Please try again.</p>
            <button onClick={onRegenerate} className="chat-error-retry">
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput
        onSend={onSendMessage}
        onStop={onStop}
        isLoading={status === 'submitted' || status === 'streaming'}
      />

      {/* Sub-conversation Panel */}
      {hasActiveSubConv && (
        <SubConversationPanel onSyncBack={handleSyncBack} />
      )}

      {/* Sync-back Toast */}
      {showSyncToast && (
        <div className="sync-toast">
          <CheckCircle2 size={16} />
          <span>Answer updated with drill-chat insights</span>
        </div>
      )}
    </div>
  );
}
