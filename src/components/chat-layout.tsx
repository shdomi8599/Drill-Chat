'use client';

import { useEffect, useRef } from 'react';
import type { UIMessage } from 'ai';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';
import { ProviderSelector } from './provider-selector';
import { Drill } from 'lucide-react';

interface ChatLayoutProps {
  messages: UIMessage[];
  status: 'submitted' | 'streaming' | 'ready' | 'error';
  error?: Error;
  onSendMessage: (text: string) => void;
  onStop: () => void;
  onRegenerate: () => void;
}

export function ChatLayout({
  messages,
  status,
  error,
  onSendMessage,
  onStop,
  onRegenerate,
}: ChatLayoutProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  return (
    <div className="chat-layout">
      {/* Header */}
      <header className="chat-header">
        <div className="chat-header-left">
          <div className="chat-logo">
            <Drill size={24} />
          </div>
          <h1 className="chat-title">Drill-Chat</h1>
          <span className="chat-badge">alpha</span>
        </div>
        <ProviderSelector />
      </header>

      {/* Messages Area */}
      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <Drill size={48} />
            </div>
            <h2>Welcome to Drill-Chat</h2>
            <p>
              Ask anything. Click on specific parts of AI answers to drill
              deeper.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={
              status === 'streaming' &&
              message.id === messages[messages.length - 1]?.id &&
              message.role === 'assistant'
            }
          />
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
    </div>
  );
}
