'use client';

// ============================================
// Drill-Chat — Sub-conversation Panel
// ============================================
// Bottom modal panel for conducting sub-conversations.
// Slides up from the bottom, shows anchor text context,
// sub-conversation messages, input, and sync-back button.

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useChatStore } from '@/lib/chat-store';
import { useSubConversation } from '@/hooks/use-sub-conversation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  X,
  SendHorizonal,
  RefreshCw,
  GripHorizontal,
  MessageSquare,
  ArrowUpFromDot,
} from 'lucide-react';

interface SubConversationPanelProps {
  /** Called when sync-back completes with the updated content */
  onSyncBack: (messageId: string, updatedContent: string) => void;
}

export function SubConversationPanel({
  onSyncBack,
}: SubConversationPanelProps) {
  const { activeSubConversation } = useChatStore();
  const [input, setInput] = useState('');
  const [panelHeight, setPanelHeight] = useState(400);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  const { messages, sendMessage, syncBack, close, isLoading, isSyncing, error } =
    useSubConversation({
      onSyncBack: (updatedContent) => {
        if (activeSubConversation) {
          onSyncBack(activeSubConversation.messageId, updatedContent);
        }
      },
    });

  // Auto-scroll messages
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    }
  }, [input]);

  // Drag to resize panel
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startHeight: panelHeight };

    const handleDragMove = (event: MouseEvent) => {
      if (!dragRef.current) return;
      const diff = dragRef.current.startY - event.clientY;
      const newHeight = Math.max(200, Math.min(window.innerHeight * 0.8, dragRef.current.startHeight + diff));
      setPanelHeight(newHeight);
    };

    const handleDragEnd = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!activeSubConversation) return null;

  const { drillTarget } = activeSubConversation;

  return (
    <>
      {/* Backdrop */}
      <div className="sub-panel-backdrop" onClick={close} />

      {/* Panel */}
      <div
        className="sub-panel"
        style={{ height: panelHeight }}
      >
        {/* Drag handle */}
        <div className="sub-panel-drag" onMouseDown={handleDragStart}>
          <GripHorizontal size={16} />
        </div>

        {/* Header */}
        <div className="sub-panel-header">
          <div className="sub-panel-header-left">
            <MessageSquare size={16} />
            <div className="sub-panel-header-info">
              <span className="sub-panel-label">Sub-conversation</span>
              <span className="sub-panel-anchor" title={drillTarget.text}>
                &ldquo;{drillTarget.text.length > 60
                  ? drillTarget.text.slice(0, 60) + '…'
                  : drillTarget.text}&rdquo;
              </span>
            </div>
          </div>
          <div className="sub-panel-header-actions">
            {messages.length >= 2 && (
              <button
                className="sub-panel-sync-btn"
                onClick={syncBack}
                disabled={isSyncing}
                title="Sync insights back to the original answer"
              >
                {isSyncing ? (
                  <RefreshCw size={14} className="spin" />
                ) : (
                  <ArrowUpFromDot size={14} />
                )}
                <span>{isSyncing ? 'Syncing...' : 'Sync back'}</span>
              </button>
            )}
            <button
              className="sub-panel-close-btn"
              onClick={close}
              aria-label="Close sub-conversation"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="sub-panel-messages" ref={messagesRef}>
          {messages.length === 0 && (
            <div className="sub-panel-empty">
              <p>Ask a question about the selected text to drill deeper.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`sub-msg ${msg.role === 'user' ? 'sub-msg-user' : 'sub-msg-assistant'}`}
            >
              {msg.role === 'user' ? (
                <p>{msg.content}</p>
              ) : (
                <div className="markdown-body markdown-body-sub">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="sub-msg sub-msg-assistant">
              <div className="thinking-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="sub-panel-error">
            <p>{error}</p>
          </div>
        )}

        {/* Input */}
        <div className="sub-panel-input-container">
          <div className="sub-panel-input-wrapper">
            <textarea
              ref={textareaRef}
              className="sub-panel-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about "${drillTarget.text.slice(0, 30)}..."`}
              rows={1}
              disabled={isLoading || isSyncing}
            />
            <button
              type="button"
              className="chat-btn chat-btn-send sub-panel-send-btn"
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading || isSyncing}
              aria-label="Send message"
            >
              <SendHorizonal size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
