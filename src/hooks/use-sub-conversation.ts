'use client';

// ============================================
// Drill-Chat — useSubConversation Hook
// ============================================
// Manages an individual sub-conversation's state
// including sending messages and triggering sync-back.

import { useState, useCallback } from 'react';
import { useChatStore } from '@/lib/chat-store';
import { createSubMessage } from '@/core/conversation-tree';
import type { SubMessage } from '@/core/types';

interface UseSubConversationOptions {
  /** Called when sync-back is completed with the new content */
  onSyncBack?: (updatedContent: string) => void;
}

interface UseSubConversationReturn {
  /** Messages in the active sub-conversation */
  messages: SubMessage[];
  /** Send a new user message in the sub-conversation */
  sendMessage: (text: string) => Promise<void>;
  /** Trigger sync-back: merge sub-conversation insights into root answer */
  syncBack: () => Promise<void>;
  /** Close the sub-conversation panel */
  close: () => void;
  /** Whether the sub-conversation is loading (waiting for AI response) */
  isLoading: boolean;
  /** Whether sync-back is in progress */
  isSyncing: boolean;
  /** Error if any */
  error: string | null;
}

export function useSubConversation(
  options: UseSubConversationOptions = {},
): UseSubConversationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    activeSubConversation,
    subConversations,
    provider,
    addSubMessage,
    updateSubConvStatus,
    closeSubConversation,
    syncBackInProgress,
    setSyncBackInProgress,
  } = useChatStore();

  const subConvId = activeSubConversation?.subConvId;
  const subConv = subConvId ? subConversations[subConvId] : null;
  const messages = subConv?.messages ?? [];

  /**
   * Send a message in the sub-conversation.
   * Makes a streaming API call with the sub-conversation context.
   */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!activeSubConversation || !subConvId) return;

      setError(null);
      setIsLoading(true);

      // Add user message to store
      const userMsg = createSubMessage('user', text);
      addSubMessage(subConvId, userMsg);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            isSubConversation: true,
            rootAnswer: activeSubConversation.rootAnswer,
            anchorText: activeSubConversation.drillTarget.text,
            subMessages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            newUserMessage: text,
          }),
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        // Read streaming response (plain text from toTextStreamResponse)
        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullContent += decoder.decode(value, { stream: true });
        }

        // Add assistant message to store
        if (fullContent) {
          const assistantMsg = createSubMessage('assistant', fullContent);
          addSubMessage(subConvId, assistantMsg);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
      } finally {
        setIsLoading(false);
      }
    },
    [activeSubConversation, subConvId, messages, provider, addSubMessage],
  );

  /**
   * Trigger sync-back: merge sub-conversation insights into the root answer.
   */
  const syncBack = useCallback(async () => {
    if (!activeSubConversation || !subConvId || !subConv) return;

    setSyncBackInProgress(true);
    setError(null);

    try {
      const res = await fetch('/api/sync-back', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalAnswer: activeSubConversation.rootAnswer,
          anchorText: activeSubConversation.drillTarget.text,
          subConversationHistory: subConv.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          provider,
        }),
      });

      if (!res.ok) {
        throw new Error(`Sync-back API error: ${res.status}`);
      }

      const data = await res.json();

      // Update sub-conversation status
      updateSubConvStatus(
        subConvId,
        'synced',
        data.updatedAnswer,
        activeSubConversation.rootAnswer,
      );

      // Notify parent
      options.onSyncBack?.(data.updatedAnswer);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Sync-back failed',
      );
    } finally {
      setSyncBackInProgress(false);
    }
  }, [
    activeSubConversation,
    subConvId,
    subConv,
    provider,
    updateSubConvStatus,
    setSyncBackInProgress,
    options,
  ]);

  const close = useCallback(() => {
    closeSubConversation();
  }, [closeSubConversation]);

  return {
    messages,
    sendMessage,
    syncBack,
    close,
    isLoading,
    isSyncing: syncBackInProgress,
    error,
  };
}
