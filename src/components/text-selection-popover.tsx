'use client';

// ============================================
// Drill-Chat — Text Selection Popover
// ============================================
// Shows a popover menu when the user drag-selects
// text within an AI response message.

import { useEffect, useState, useCallback, useRef } from 'react';
import type { DrillTarget } from '@/core/types';
import { MessageSquarePlus } from 'lucide-react';

interface TextSelectionPopoverProps {
  /** The container element to listen for text selection within */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** The full message content (for computing ranges) */
  messageContent: string;
  /** Called when user clicks "Open Drill-Chat" */
  onDrill: (target: DrillTarget) => void;
  /** Whether the popover should be enabled */
  enabled?: boolean;
}

interface PopoverPosition {
  top: number;
  left: number;
}

export function TextSelectionPopover({
  containerRef,
  messageContent,
  onDrill,
  enabled = true,
}: TextSelectionPopoverProps) {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    if (!enabled) return;

    // Small delay to let the selection finalize
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setPosition(null);
        setSelectedText('');
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 5) {
        setPosition(null);
        setSelectedText('');
        return;
      }

      // Check if selection is within our container
      const container = containerRef.current;
      if (!container) return;

      const range = selection.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) {
        return;
      }

      // Position the popover above the selection
      const rect = range.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      setSelectedText(text);
      setPosition({
        top: rect.top - containerRect.top - 44,
        left: rect.left - containerRect.left + rect.width / 2,
      });
    }, 10);
  }, [enabled, containerRef]);

  const handleDrill = useCallback(() => {
    if (!selectedText) return;

    const start = messageContent.indexOf(selectedText);
    const end = start >= 0 ? start + selectedText.length : 0;

    onDrill({
      text: selectedText,
      range: { start, end },
      trigger: 'text-selection',
    });

    // Clear selection
    window.getSelection()?.removeAllRanges();
    setPosition(null);
    setSelectedText('');
  }, [selectedText, messageContent, onDrill]);

  // Dismiss popover when clicking outside
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setPosition(null);
        setSelectedText('');
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  // Attach selection listener to the container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mouseup', handleMouseUp);
    return () => container.removeEventListener('mouseup', handleMouseUp);
  }, [containerRef, handleMouseUp]);

  if (!position || !selectedText) return null;

  return (
    <div
      ref={popoverRef}
      className="text-selection-popover"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <button
        className="text-selection-popover-btn"
        onClick={handleDrill}
      >
        <MessageSquarePlus size={14} />
        <span>Drill into this</span>
      </button>
    </div>
  );
}
