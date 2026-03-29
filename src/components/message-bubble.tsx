'use client';

// ============================================
// Drill-Chat — Message Bubble
// ============================================
// Renders individual chat messages with drill-down
// capabilities for assistant messages.

import { useRef, useCallback } from 'react';
import type { UIMessage } from 'ai';
import { DrillableContent } from './drillable-content';
import { TextSelectionPopover } from './text-selection-popover';
import { User, Bot, MessageSquare } from 'lucide-react';
import { useChatStore } from '@/lib/chat-store';
import type { DrillTarget, SubConversation } from '@/core/types';

interface MessageBubbleProps {
  message: UIMessage;
  isStreaming?: boolean;
  onDrill?: (messageId: string, content: string, target: DrillTarget) => void;
}

export function MessageBubble({ message, isStreaming, onDrill }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const contentRef = useRef<HTMLDivElement>(null);
  const { getSubConversationsForMessage, openSubConversationById } = useChatStore();

  // Extract text content from message parts
  const textContent = message.parts
    .filter((part): part is Extract<typeof part, { type: 'text' }> => part.type === 'text')
    .map((part) => part.text)
    .join('');

  // Get sub-conversations for this message
  const subConvs = getSubConversationsForMessage(message.id);
  const activeAnchors = subConvs
    .filter((sc: SubConversation) => sc.status === 'active')
    .map((sc: SubConversation) => ({
      text: sc.anchorText,
      color: sc.color,
      index: sc.index,
      subConvId: sc.id,
    }));

  const handleDrill = useCallback(
    (target: DrillTarget) => {
      onDrill?.(message.id, textContent, target);
    },
    [message.id, textContent, onDrill],
  );

  return (
    <div className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
      {/* Avatar */}
      <div className={`message-avatar ${isUser ? 'avatar-user' : 'avatar-assistant'}`}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className={`message-content ${isUser ? 'content-user' : 'content-assistant'}`}
      >
        {isUser ? (
          <p>{textContent}</p>
        ) : (
          <>
            <DrillableContent
              content={textContent}
              onDrill={handleDrill}
              onReopen={(subConvId) => openSubConversationById(message.id, subConvId, textContent)}
              drillEnabled={!isStreaming}
              activeAnchors={activeAnchors}
            />
            {isStreaming && <span className="streaming-cursor" />}

            {/* Sub-conversation indicators */}
            {subConvs.length > 0 && (
              <div className="message-sub-indicators">
                {subConvs.map((sc: SubConversation) => (
                  <span
                    key={sc.id}
                    className={`sub-indicator sub-indicator-${sc.status}`}
                    style={{ '--drill-accent': sc.color, cursor: 'pointer' } as React.CSSProperties}
                    title={`"${sc.anchorText.slice(0, 30)}…" — ${sc.status}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      openSubConversationById(message.id, sc.id, textContent);
                    }}
                  >
                    <MessageSquare size={10} />
                    <span>
                      {sc.status === 'synced' ? 'Synced' : `Drill #${sc.index}`}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {/* Text selection popover for drill via drag */}
        {!isUser && !isStreaming && (
          <TextSelectionPopover
            containerRef={contentRef}
            messageContent={textContent}
            onDrill={handleDrill}
          />
        )}
      </div>
    </div>
  );
}
