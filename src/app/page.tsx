'use client';

// ============================================
// Drill-Chat — Main Page
// ============================================
// Integrates the main chat with sub-conversation support.

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useChatStore } from '@/lib/chat-store';
import { ChatLayout } from '@/components/chat-layout';
import { useCallback, useRef } from 'react';

export default function Home() {
  const provider = useChatStore((s) => s.provider);
  const getApiKeyHeader = useChatStore((s) => s.getApiKeyHeader);

  const { messages, sendMessage, status, stop, error, regenerate, setMessages } =
    useChat({
      transport: new DefaultChatTransport({
        api: '/api/chat',
        headers: () => getApiKeyHeader(),
      }),
    });

  const handleSend = (text: string) => {
    sendMessage({ text });
  };

  /**
   * Handle sync-back: replace the content of a specific
   * assistant message with the updated (synced) content.
   */
  const handleSyncBack = useCallback(
    (messageId: string, updatedContent: string) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id !== messageId) return msg;
          // Replace the text part content
          return {
            ...msg,
            parts: msg.parts.map((part) => {
              if (part.type === 'text') {
                return { ...part, text: updatedContent };
              }
              return part;
            }),
          };
        }),
      );
    },
    [setMessages],
  );

  return (
    <ChatLayout
      messages={messages}
      status={status}
      error={error}
      onSendMessage={handleSend}
      onStop={stop}
      onRegenerate={regenerate}
      onSyncBack={handleSyncBack}
    />
  );
}
