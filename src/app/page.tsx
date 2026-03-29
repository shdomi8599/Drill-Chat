'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useChatStore } from '@/lib/chat-store';
import { ChatLayout } from '@/components/chat-layout';

export default function Home() {
  const provider = useChatStore((s) => s.provider);

  const { messages, sendMessage, status, stop, error, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { provider },
    }),
  });

  const handleSend = (text: string) => {
    sendMessage({ text });
  };

  return (
    <ChatLayout
      messages={messages}
      status={status}
      error={error}
      onSendMessage={handleSend}
      onStop={stop}
      onRegenerate={regenerate}
    />
  );
}
