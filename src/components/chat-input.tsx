'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { SendHorizonal, Square } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, onStop, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
    // Reset textarea height
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

  return (
    <div className="chat-input-container">
      <div className="chat-input-wrapper">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows={1}
          disabled={isLoading}
        />
        {isLoading ? (
          <button
            type="button"
            className="chat-btn chat-btn-stop"
            onClick={onStop}
            aria-label="Stop generation"
          >
            <Square size={18} />
          </button>
        ) : (
          <button
            type="button"
            className="chat-btn chat-btn-send"
            onClick={handleSubmit}
            disabled={!input.trim()}
            aria-label="Send message"
          >
            <SendHorizonal size={18} />
          </button>
        )}
      </div>
      <p className="chat-input-hint">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
